import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import firebaseConfig from "./firebase-applet-config.json";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with persistent local cache for high offline resilience
let db: any;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, firebaseConfig.firestoreDatabaseId);
} catch (err) {
  console.warn("Failed to initializeFirestore with persistent local cache. Falling back to getFirestore...", err);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

function sanitizeForFirestore(val: any): any {
  if (val === undefined) {
    return null;
  }
  if (val === null) {
    return null;
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeForFirestore);
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(val)) {
      const v = val[key];
      if (v !== undefined) {
        cleaned[key] = sanitizeForFirestore(v);
      }
    }
    return cleaned;
  }
  return val;
}

let authPromise: Promise<any> | null = null;

async function ensureAuth() {
  // Bypassed: Firestore rules are configured to allow public reads and writes (allow read, write: if true;)
  // This avoids auth/admin-restricted-operation errors when Anonymous Sign-in is not enabled in Firebase Console,
  // and makes database requests execute instantly.
  return;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const auth = getAuth(app);
  const errMessage = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  console.error("Firestore error mapped to JSON:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class QueryChain {
  private colName: string;
  private updateData: any = null;
  private upsertData: any = null;
  private insertData: any = null;
  private isDelete = false;

  constructor(colName: string) {
    this.colName = colName;
  }

  select(columns = "*") {
    return this;
  }

  update(data: any) {
    this.updateData = data;
    return this;
  }

  upsert(data: any) {
    this.upsertData = data;
    return this;
  }

  insert(data: any) {
    this.insertData = data;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  // To support awaiting the chain itself (e.g. await supabase.from('...').select('*'))
  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any): Promise<any> {
    try {
      await ensureAuth();
      let result: any = { data: null, error: null };
      
      if (this.upsertData) {
        // Handle upsert
        const dataArray = Array.isArray(this.upsertData) ? this.upsertData : [this.upsertData];
        try {
          for (const item of dataArray) {
            const docId = String(item.id || item.reactor_id || "1");
            const sanitized = sanitizeForFirestore(item);
            await setDoc(doc(db, this.colName, docId), sanitized, { merge: true });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, this.colName);
        }
        result = { data: this.upsertData, error: null };
      } else if (this.insertData) {
        // Handle insert
        const dataArray = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
        try {
          for (const item of dataArray) {
            const docId = String(item.id || item.reactor_id || "1");
            const sanitized = sanitizeForFirestore(item);
            await setDoc(doc(db, this.colName, docId), sanitized, { merge: true });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, this.colName);
        }
        result = { data: this.insertData, error: null };
      } else if (this.isDelete) {
        // Delete without filter (delete everything)
        try {
          const colRef = collection(db, this.colName);
          const querySnapshot = await getDocs(colRef);
          const batch = writeBatch(db);
          querySnapshot.forEach((docSnap) => {
            batch.delete(docSnap.ref);
          });
          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, this.colName);
        }
        result = { data: null, error: null };
      } else {
        // Plain fetch
        let querySnapshot;
        try {
          const colRef = collection(db, this.colName);
          querySnapshot = await getDocs(colRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, this.colName);
        }
        
        const list: any[] = [];
        querySnapshot.forEach((docSnap) => {
          const snapData = docSnap.data();
          const rowData = { ...snapData };
          if (!rowData.id) rowData.id = docSnap.id;
          if (!rowData.reactor_id && this.colName === 'reactor_notes') rowData.reactor_id = docSnap.id;
          list.push(rowData);
        });
        result = { data: list, error: null };
      }

      if (onfulfilled) {
        return Promise.resolve(onfulfilled(result));
      }
      return result;
    } catch (err: any) {
      // Re-throw if already handled as JSON
      if (err.message && err.message.trim().startsWith('{')) {
        if (onrejected) return Promise.resolve(onrejected({ data: null, error: err }));
        throw err;
      }
      
      console.error(`Firebase error during transaction on table/collection: ${this.colName}:`, err);
      const result = { data: null, error: err };
      if (onrejected) {
        return Promise.resolve(onrejected(result));
      }
      return result;
    }
  }

  async single() {
    try {
      await ensureAuth();
      const docRef = doc(db, this.colName, "1");
      let docSnap;
      try {
        docSnap = await getDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `${this.colName}/1`);
      }
      
      if (docSnap.exists()) {
        const snapData = docSnap.data();
        const rowData = { ...snapData };
        if (!rowData.id) rowData.id = docSnap.id;
        return { data: rowData, error: null };
      } else {
        // Return null and PGRST116 code indicating missing document
        return { data: null, error: { code: 'PGRST116', message: 'No rows' } };
      }
    } catch (err: any) {
      if (err.message && err.message.trim().startsWith('{')) {
        throw err;
      }
      console.error(`Firebase error during single load on: ${this.colName}:`, err);
      return { data: null, error: err };
    }
  }

  eq(field: string, val: any) {
    return this.executeFilter('eq', field, val);
  }

  neq(field: string, val: any) {
    return this.executeFilter('neq', field, val);
  }

  private async executeFilter(op: 'eq' | 'neq', field: string, val: any) {
    try {
      await ensureAuth();
      const docId = String(val);
      if (this.updateData) {
        let targetId = "1";
        if (field === 'id') {
          targetId = docId;
        } else if (field === 'reactor_id') {
          targetId = docId;
        }

        const docRef = doc(db, this.colName, targetId);
        try {
          const sanitized = sanitizeForFirestore(this.updateData);
          await setDoc(docRef, sanitized, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `${this.colName}/${targetId}`);
        }
        return { data: this.updateData, error: null };
      }

      if (this.isDelete) {
        if (op === 'neq' && field === 'id' && val === 'placeholder') {
          // Empty all overrides except placeholder
          try {
            const colRef = collection(db, this.colName);
            const querySnapshot = await getDocs(colRef);
            const batch = writeBatch(db);
            querySnapshot.forEach((docSnap) => {
              if (docSnap.id !== 'placeholder') {
                batch.delete(docSnap.ref);
              }
            });
            await batch.commit();
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, this.colName);
          }
          return { error: null };
        } else {
          let targetId = "1";
          if (field === 'id') {
            targetId = docId;
          } else if (field === 'reactor_id') {
            targetId = docId;
          }
          const docRef = doc(db, this.colName, targetId);
          try {
            await deleteDoc(docRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, `${this.colName}/${targetId}`);
          }
          return { error: null };
        }
      }

      return { data: null, error: null };
    } catch (err: any) {
      if (err.message && err.message.trim().startsWith('{')) {
        throw err;
      }
      console.error(`Firebase error inside operation filter execution of ${this.colName}:`, err);
      return { data: null, error: err };
    }
  }
}

export const supabase = {
  from(collectionName: string) {
    return new QueryChain(collectionName);
  }
};
