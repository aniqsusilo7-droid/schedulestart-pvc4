import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Edit3, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  Info,
  Calendar,
  Lock,
  Unlock,
  CornerDownRight
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { KesepakatanData, Shift } from '../types';

const DEFAULT_KESEPAKATAN: KesepakatanData = {
  shifts: [
    { name: "SHIFT 1", time: "22:45 - 07:00", closeMode: "22:25", openMode: "21:55" },
    { name: "SHIFT 2", time: "06:45 - 15:00", closeMode: "06:25", openMode: "05:55" },
    { name: "SHIFT 3", time: "14:45 - 23:00", closeMode: "14:25", openMode: "13:55" }
  ],
  additionalNotes: [
    "DEMONOMER F LINE WASHING Pertama >= JAM 06:25 , 14:25 , 22:25",
    "SAMPLE SA DISSOLUTION COMPLETE >= JAM 22:25",
    "SILO CHARGE COMPLETTE >= JAM 6:25 , 14:25 , 22:25"
  ],
  footerNote: "TANGGUNG JAWAB SHIFT YANG BARU DATANG"
};

export const Kesepakatan: React.FC = () => {
  const [data, setData] = useState<KesepakatanData>(DEFAULT_KESEPAKATAN);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for inline editing or additions
  const [newNote, setNewNote] = useState<string>("");

  useEffect(() => {
    fetchKesepakatan();
  }, []);

  const fetchKesepakatan = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: fetchErr } = await supabase.from('kesepakatan').single();
      if (fetchErr) {
        // If not found, let's create the default document
        if (fetchErr.code === 'PGRST116' || fetchErr.message?.includes('No rows') || fetchErr.error?.includes('No rows')) {
          console.log("No kesepakatan found. Creating default...");
          const defaultDoc = { id: "1", ...DEFAULT_KESEPAKATAN };
          await supabase.from('kesepakatan').insert(defaultDoc);
          setData(DEFAULT_KESEPAKATAN);
        } else {
          console.error("Error fetching kesepakatan:", fetchErr);
          setError("Gagal memuat data dari database. Menggunakan data lokal.");
        }
      } else if (result) {
        // If loaded, the structure from PostgreSQL is either { data: KesepakatanData } or the root is the object
        if (result.data && result.data.shifts) {
          setData(result.data as KesepakatanData);
        } else if (result.shifts) {
          setData(result as unknown as KesepakatanData);
        } else {
          // Fallback if schema is weird
          setData(DEFAULT_KESEPAKATAN);
        }
      }
    } catch (err) {
      console.error("Fetch try-catch error:", err);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      // Prepared payload
      const payload = {
        id: "1",
        shifts: data.shifts,
        additionalNotes: data.additionalNotes,
        footerNote: data.footerNote,
        updated_at: new Date().toISOString()
      };

      const { error: saveErr } = await supabase.from('kesepakatan').upsert(payload);
      if (saveErr) {
        console.error("Error saving kesepakatan:", saveErr);
        setError("Gagal menyimpan ke database.");
      } else {
        setSuccessMsg("Kesepakatan berhasil disimpan!");
        setIsEditMode(false);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error("Save try-catch error:", err);
      setError("Kesalahan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  const handleShiftChange = (index: number, field: keyof Shift, value: string) => {
    const updatedShifts = [...data.shifts];
    updatedShifts[index] = { ...updatedShifts[index], [field]: value };
    setData({ ...data, shifts: updatedShifts });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setData({
      ...data,
      additionalNotes: [...data.additionalNotes, newNote.trim()]
    });
    setNewNote("");
  };

  const handleRemoveNote = (index: number) => {
    const updatedNotes = data.additionalNotes.filter((_, i) => i !== index);
    setData({ ...data, additionalNotes: updatedNotes });
  };

  const handleNoteChange = (index: number, value: string) => {
    const updatedNotes = [...data.additionalNotes];
    updatedNotes[index] = value;
    setData({ ...data, additionalNotes: updatedNotes });
  };

  const handleFooterChange = (value: string) => {
    setData({ ...data, footerNote: value });
  };

  const handleResetToDefault = () => {
    if (window.confirm("Apakah Anda yakin ingin menyetel ulang ke nilai bawaan pabrik?")) {
      setData(DEFAULT_KESEPAKATAN);
      setSuccessMsg("Disetel ulang ke default! Tekan SIMPAN untuk menyimpan permanen.");
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="p-0 font-sans animate-in fade-in duration-500 flex flex-col gap-4 relative w-full h-full">

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3 animate-bounce">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-800 dark:text-red-400 text-base">Terjadi Masalah</h4>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start gap-3 animate-pulse">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-base">Sukses</h4>
            <p className="text-emerald-700 dark:text-emerald-300 text-sm mt-1">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-2xl"></div>
          <div className="h-48 bg-slate-100 dark:bg-slate-800/50 rounded-2xl"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* Main Card: Shifts Table & Points */}
          <div className="flex flex-col shadow-xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-base px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 uppercase tracking-widest">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 mr-1">
                  <Clock className="w-5 h-5 text-indigo-200" />
                </span>

                {/* REFRESH Button */}
                <button 
                  onClick={fetchKesepakatan}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all font-bold text-xs flex items-center gap-1.5 border border-white/20 cursor-pointer"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  REFRESH
                </button>

                {/* AKTIFKAN EDIT Button */}
                <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs tracking-wide transition-all duration-300 flex items-center gap-1.5 border cursor-pointer ${
                    isEditMode 
                      ? 'bg-amber-500 text-white border-amber-400 shadow-sm' 
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  }`}
                >
                  {isEditMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {isEditMode ? 'EDIT AKTIF' : 'AKTIFKAN EDIT'}
                </button>

                {/* SIMPAN Button */}
                {isEditMode && (
                  <button 
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs tracking-wider uppercase transition-all shadow-md flex items-center gap-1.5 border border-emerald-400 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'MENYIMPAN...' : 'SIMPAN'}
                  </button>
                )}
              </div>

              <span className="text-[13px] bg-white/20 px-2.5 py-1 rounded-full text-indigo-100 font-bold whitespace-nowrap">
                3 SHIFTS DEFINED
              </span>
            </div>
            
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3 px-4 text-base font-black text-slate-400 uppercase tracking-wider">Nama Shift</th>
                    <th className="py-3 px-4 text-base font-black text-slate-400 uppercase tracking-wider">Jam Kerja</th>
                    <th className="py-3 px-4 text-base font-black text-slate-400 uppercase tracking-wider text-red-500">Close Mode</th>
                    <th className="py-3 px-4 text-base font-black text-slate-400 uppercase tracking-wider text-emerald-500">Open Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.shifts.map((shift, idx) => (
                    <React.Fragment key={idx}>
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-4 px-4 font-black text-slate-950 dark:text-white text-lg">
                          {isEditMode ? (
                            <input 
                              type="text"
                              value={shift.name}
                              onChange={(e) => handleShiftChange(idx, 'name', e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-bold text-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                              {shift.name}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-slate-600 dark:text-slate-300 text-lg">
                          {isEditMode ? (
                            <input 
                              type="text"
                              value={shift.time}
                              onChange={(e) => handleShiftChange(idx, 'time', e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold text-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          ) : (
                            shift.time
                          )}
                        </td>
                        <td className="py-4 px-4 font-mono font-black text-red-600 dark:text-red-400 text-lg">
                          {isEditMode ? (
                            <input 
                              type="text"
                              value={shift.closeMode}
                              onChange={(e) => handleShiftChange(idx, 'closeMode', e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-red-200 dark:border-red-900/40 rounded-lg p-2 font-mono font-black text-lg text-red-600 dark:text-red-400 focus:ring-2 focus:ring-red-500 outline-none"
                            />
                          ) : (
                            shift.closeMode
                          )}
                        </td>
                        <td className="py-4 px-4 font-mono font-black text-emerald-600 dark:text-emerald-400 text-lg">
                          {isEditMode ? (
                            <input 
                              type="text"
                              value={shift.openMode}
                              onChange={(e) => handleShiftChange(idx, 'openMode', e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/40 rounded-lg p-2 font-mono font-black text-lg text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          ) : (
                            shift.openMode
                          )}
                        </td>
                      </tr>

                      {/* Position the points (additionalNotes) directly below Shift 3 only */}
                      {idx === 2 && (
                        <tr>
                          <td colSpan={4} className="p-6 bg-slate-50/40 dark:bg-slate-800/10 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 dark:text-slate-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-violet-500" />
                                  POIN KESEPAKATAN TAMBAHAN
                                </span>
                                <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-full font-black text-slate-600 dark:text-slate-400">
                                  {data.additionalNotes.length} POIN
                                </span>
                              </div>

                              <div className="flex flex-col gap-3">
                                {data.additionalNotes.map((note, index) => (
                                  <motion.div 
                                    key={index} 
                                    layout
                                    className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 flex gap-3 group relative hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300"
                                  >
                                    <CornerDownRight className="w-4 h-4 text-violet-500 shrink-0 mt-1" />
                                    <div className="flex-1">
                                      {isEditMode ? (
                                        <textarea 
                                          value={note}
                                          onChange={(e) => handleNoteChange(index, e.target.value)}
                                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-bold text-base text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                          rows={2}
                                        />
                                      ) : (
                                        <p className="text-slate-800 dark:text-slate-300 font-extrabold text-base md:text-lg leading-relaxed">
                                          {note}
                                        </p>
                                      )}
                                    </div>
                                    
                                    {isEditMode && (
                                      <button 
                                        onClick={() => handleRemoveNote(index)}
                                        className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors self-start cursor-pointer"
                                        title="Hapus Catatan"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </motion.div>
                                ))}

                                {data.additionalNotes.length === 0 && (
                                  <div className="text-center py-8 text-slate-400 dark:text-slate-500 font-bold text-xs flex flex-col items-center gap-2">
                                    <AlertCircle className="w-8 h-8 text-slate-300" />
                                    Belum ada catatan kesepakatan tambahan.
                                  </div>
                                )}
                              </div>

                              {/* Add New Note Section */}
                              {isEditMode && (
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                                  <label className="text-sm font-black text-slate-400 uppercase tracking-wider">Tambah Baru</label>
                                  <div className="flex gap-2">
                                    <input 
                                      type="text"
                                      placeholder="Ketik detail poin kesepakatan lapangan di sini..."
                                      value={newNote}
                                      onChange={(e) => setNewNote(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-bold text-base text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <button 
                                      onClick={handleAddNote}
                                      className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all font-black text-base flex items-center justify-center gap-1.5 shadow-md shrink-0 active:scale-95"
                                    >
                                      <Plus className="w-4 h-4" />
                                      TAMBAH
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Note Card */}
          <div className="shadow-lg rounded-2xl border border-rose-100 dark:border-rose-950/40 bg-gradient-to-br from-rose-50/50 to-amber-50/20 dark:from-rose-950/10 dark:to-slate-900 p-6 flex flex-col gap-4">
            {isEditMode ? (
              <textarea 
                value={data.footerNote}
                onChange={(e) => handleFooterChange(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/40 rounded-xl p-4 font-bold text-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                rows={2}
              />
            ) : (
              <div className="p-4 bg-white/70 dark:bg-slate-900/40 rounded-xl border border-rose-200/50 dark:border-rose-900/20 text-rose-950 dark:text-rose-300 font-extrabold text-xl tracking-wide flex items-center gap-3 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 animate-ping"></span>
                "{data.footerNote}"
              </div>
            )}
          </div>

          {/* Default Presets Quick Action */}
          {isEditMode && (
            <button 
              onClick={handleResetToDefault}
              className="w-full py-2.5 rounded-xl border border-dashed border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 font-bold text-xs uppercase tracking-wider transition-all"
            >
              Setel Ulang ke Preset Default
            </button>
          )}

        </div>
      )}

    </div>
  );
};
