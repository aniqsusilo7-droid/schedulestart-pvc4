import React, { useMemo } from 'react';
import { Settings2, Activity, RotateCcw, Calculator, Info, Database, TrendingUp } from 'lucide-react';
import { GradeType, DemonomerData } from '../types';
import { GRADE_COLORS } from '../constants';

interface DemonomerProps {
  readOnly?: boolean;
  currentGrade: GradeType;
  onGradeChange: (grade: GradeType) => void;
  data: DemonomerData;
  onDataChange: (field: keyof DemonomerData, value: any) => void;
  gradeMode: 'normal' | 'gradeChange';
  onGradeModeChange: (mode: 'normal' | 'gradeChange') => void;
  onOpenFieTrend?: () => void;
}

type GradeKey = 'SM' | 'SLP' | 'SLK' | 'SE' | 'SR';

const DEFAULT_STEAM_FORMULA = "(FIE2002 * FAKTOR)";

export const Demonomer: React.FC<DemonomerProps> = ({ 
  readOnly = false, 
  currentGrade, 
  onGradeChange, 
  data, 
  onDataChange, 
  gradeMode, 
  onGradeModeChange, 
  onOpenFieTrend 
}) => {
  
  // --- Handlers ---
  const handleResetFormulas = () => {
    if (readOnly) return;
    onDataChange('steamFormula', DEFAULT_STEAM_FORMULA);
  };

  const handleMultiplierChange = (grade: GradeKey, val: string) => {
    if (readOnly) return;
    const num = parseFloat(val) || 0;
    onDataChange('multipliers', { ...data.multipliers, [grade]: num });
  };

  const currentFaktor = data.multipliers[currentGrade as GradeKey] ?? 33;

  // --- Dynamic Calculation Logic ---
  const evaluateMath = (expression: string, vars: Record<string, number>): number => {
    let expr = expression;
    // Sort keys by length desc to prevent partial replacement issues
    const sortedKeys = Object.keys(vars).sort((a, b) => b.length - a.length);
    
    for (const key of sortedKeys) {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedKey, 'g');
        expr = expr.replace(regex, String(vars[key]));
    }

    try {
        const cleanExpr = expr.replace(/[^0-9\.\+\-\*\/\(\)\s]/g, '');
        if (!cleanExpr.trim()) return 0;
        const result = new Function('return ' + expr)();
        return isFinite(result) ? result : 0;
    } catch (e) {
        return 0;
    }
  };

  const calculatedSteam = useMemo(() => {
    return evaluateMath(data.steamFormula || DEFAULT_STEAM_FORMULA, {
        'FIE2002': data.f2002,
        'FAKTOR': currentFaktor,
        'F2002': data.f2002,
        'Steam Rasio': currentFaktor,
        'Multiplier': currentFaktor,
        'PVC': data.f2002,
        'AI2802': data.aie2802,
        '%PVC': data.pvcPercent / 100
    });
  }, [data.f2002, currentFaktor, data.steamFormula, data.aie2802, data.pvcPercent]);

  return (
    <div className="p-1 sm:p-2 font-sans animate-in fade-in duration-300 flex flex-col gap-4 relative max-w-6xl mx-auto">
      {readOnly && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-black uppercase tracking-wide text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
          Steam &amp; Grade Selection hanya baca di HP
        </div>
      )}
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl text-white shadow-md shadow-teal-500/20 shrink-0">
                <Activity className="w-5 h-5" />
            </div>
            <div>
                <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">HITUNG STEAM RASIO DEMONOMER</h2>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 uppercase flex items-center gap-1">
                        <Database className="w-3 h-3 text-teal-500" /> REAL-TIME SYNC
                    </span>
                </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
              <div className={`flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl ${readOnly ? 'opacity-65' : ''}`}>
                  <button 
                    disabled={readOnly}
                    onClick={() => onGradeModeChange('normal')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${readOnly ? 'cursor-not-allowed' : 'cursor-pointer'} ${gradeMode === 'normal' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                      NORMAL
                  </button>
                  <button 
                    disabled={readOnly}
                    onClick={() => onGradeModeChange('gradeChange')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${readOnly ? 'cursor-not-allowed' : 'cursor-pointer'} ${gradeMode === 'gradeChange' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                      GRADE CHANGE
                  </button>
              </div>
              <div className={`flex gap-1 ${readOnly ? 'opacity-65' : ''}`}>
                  {(Object.keys(data.multipliers) as GradeKey[]).map(g => (
                      <button 
                        key={g} 
                        disabled={readOnly}
                        onClick={() => onGradeChange(g as GradeType)}
                        className={`px-2.5 py-1.5 rounded-lg font-black text-xs transition-all ${readOnly ? 'cursor-not-allowed' : 'cursor-pointer'} ${currentGrade === g ? `${GRADE_COLORS[g]} text-white shadow-sm ring-1 ring-teal-400` : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'}`}
                      >
                          {g}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      {/* Main Operational Calculation Section */}
      <div className="flex flex-col shadow-xs rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="bg-teal-600 text-white font-black text-xs px-4 py-2.5 flex items-center justify-between uppercase tracking-wider">
              <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  <span>OPERATIONAL CALCULATION</span>
              </div>
              <span className="text-[10px] font-bold text-teal-100 bg-teal-700/60 px-2 py-0.5 rounded border border-teal-500/40">
                  Grade Aktif: {currentGrade}
              </span>
          </div>

          <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  
                  {/* FIE2002 Column */}
                  <div className="flex flex-col gap-2 text-center">
                      <div 
                        className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors group"
                        onClick={onOpenFieTrend}
                        title="Klik tulisan FIE2002 untuk melihat Grafik Trend Perjam"
                      >
                          <span>FIE2002</span>
                          <TrendingUp className="w-4 h-4 text-cyan-500 animate-pulse group-hover:scale-125 transition-transform" />
                      </div>
                      <div className="bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl p-3 border border-indigo-100 dark:border-indigo-900/50">
                          <input 
                            type="number"
                            step="any"
                            readOnly={readOnly}
                            aria-readonly={readOnly}
                            aria-label="Nilai FIE2002"
                            value={data.f2002}
                            onChange={(e) => onDataChange('f2002', parseFloat(e.target.value) || 0)}
                            className="w-full bg-transparent text-purple-900 dark:text-purple-200 text-4xl sm:text-5xl font-mono font-black text-center outline-none transition-all"
                          />
                      </div>
                  </div>

                  {/* FAKTOR Column */}
                  <div className="flex flex-col gap-2 text-center">
                      <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          FAKTOR
                      </div>
                      <div className="bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl p-3 border border-indigo-100 dark:border-indigo-900/50">
                          <input 
                            type="number"
                            step="any"
                            readOnly={readOnly}
                            aria-readonly={readOnly}
                            aria-label="Nilai Faktor"
                            value={currentFaktor}
                            onChange={(e) => handleMultiplierChange(currentGrade as GradeKey, e.target.value)}
                            className="w-full bg-transparent text-purple-900 dark:text-purple-200 text-4xl sm:text-5xl font-mono font-black text-center outline-none transition-all"
                          />
                      </div>
                  </div>

                  {/* STEAM TOTAL Column */}
                  <div className="flex flex-col gap-2 text-center">
                      <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          STEAM TOTAL
                      </div>
                      <div className="bg-rose-50 dark:bg-rose-950/40 rounded-2xl p-3 border border-rose-200 dark:border-rose-800/60 shadow-xs">
                          <div className="text-rose-600 dark:text-rose-400 text-4xl sm:text-5xl font-mono font-black text-center tracking-tight">
                              {Math.round(calculatedSteam)}
                          </div>
                      </div>
                  </div>

              </div>
          </div>
      </div>

      {/* Formulas Card */}
      <div className="bg-slate-950 text-white p-5 sm:p-6 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden flex flex-col gap-4">
           <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
               <h4 className="text-white font-black text-sm uppercase flex items-center gap-2 tracking-wide">
                   <Calculator className="w-4 h-4 text-purple-400" /> FORMULAS
               </h4>
               <button 
                 disabled={readOnly} 
                 onClick={handleResetFormulas} 
                 className={`p-1.5 bg-white/10 rounded-lg transition-all text-white/60 ${readOnly ? 'cursor-not-allowed opacity-40' : 'hover:bg-white/20 hover:text-white cursor-pointer'}`} 
                 title={readOnly ? 'Formula hanya dapat diubah dari desktop' : 'Reset Formula'}
               >
                   <RotateCcw className="w-3.5 h-3.5" />
               </button>
           </div>

           <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                   STEAM CALCULATION
               </label>
               <input 
                    type="text"
                    readOnly={readOnly}
                    aria-readonly={readOnly}
                    aria-label="Formula perhitungan steam"
                    value={data.steamFormula || DEFAULT_STEAM_FORMULA}
                    onChange={(e) => onDataChange('steamFormula', e.target.value)}
                    className="w-full font-mono text-sm sm:text-base font-bold text-rose-500 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2.5 focus:bg-slate-900 focus:ring-1 focus:ring-rose-400 outline-none transition-all"
               />
               <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                   <span>VARS: FIE2002, FAKTOR</span>
                   <span className="text-rose-400 font-bold">RESULT: {Math.round(calculatedSteam)}</span>
               </div>
           </div>

           <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
               <Info className="w-4 h-4 text-purple-400 shrink-0" />
               <p className="text-[10px] text-slate-400 leading-tight">
                   Formulas are evaluated in real-time. Use standard operators (+, -, *, /) and defined variables.
               </p>
           </div>
      </div>

      {/* Adjust Steam Rasio (Per Grade Config) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                  <Settings2 className="w-4 h-4 text-teal-500 shrink-0" />
                  <h3 className="text-slate-900 dark:text-white font-black text-xs sm:text-sm uppercase tracking-tight truncate">
                      ADJUST STEAM RASIO (FAKTOR) PER GRADE
                  </h3>
              </div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 uppercase tracking-wider shrink-0 whitespace-nowrap">
                  PER GRADE CONFIG
              </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {(Object.keys(data.multipliers) as GradeKey[]).map(g => (
                  <div 
                      key={g} 
                      className={`group flex flex-col gap-1.5 p-2.5 rounded-xl border transition-all ${readOnly ? 'cursor-default opacity-70' : 'cursor-pointer'} ${currentGrade === g ? 'bg-teal-50/70 dark:bg-teal-900/30 border-teal-500 shadow-xs ring-1 ring-teal-400/40' : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                      onClick={readOnly ? undefined : () => onGradeChange(g as GradeType)}
                  >
                      <div className="flex justify-between items-center">
                          <span className={`text-xs font-black ${currentGrade === g ? 'text-teal-700 dark:text-teal-300 font-mono' : 'text-slate-600 dark:text-slate-400'}`}>{g}</span>
                          <div className={`w-2 h-2 rounded-full ${currentGrade === g ? 'bg-teal-500 animate-ping' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                      </div>
                      <input 
                          type="number"
                          step="any"
                          readOnly={readOnly}
                          aria-readonly={readOnly}
                          aria-label={`Steam rasio grade ${g}`}
                          value={data.multipliers[g]}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleMultiplierChange(g, e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-base sm:text-lg font-mono font-black text-teal-600 dark:text-teal-400 text-center focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                      />
                  </div>
              ))}
          </div>
      </div>

    </div>
  );
};
