import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  collection, 
  getDocs, 
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  addDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});

// Initialize Firestore with custom database ID and forced long polling for reliable iframe/proxy connections
export const db = initializeFirestore(
  app, 
  {
    experimentalForceLongPolling: true
  },
  firebaseConfig.firestoreDatabaseId || "(default)"
);

export {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  collection,
  getDocs,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  addDoc,
  onSnapshot,
  serverTimestamp
};
