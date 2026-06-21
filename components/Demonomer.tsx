
import React, { useMemo } from 'react';
import { ArrowRight, Settings2, Activity, RotateCcw, Calculator, Info, Database } from 'lucide-react';
import { GradeType, DemonomerData } from '../types';
import { GRADE_COLORS } from '../constants';

interface DemonomerProps {
  currentGrade: GradeType;
  onGradeChange: (grade: GradeType) => void;
  data: DemonomerData;
  onDataChange: (field: keyof DemonomerData, value: any) => void;
  gradeMode: 'normal' | 'gradeChange';
  onGradeModeChange: (mode: 'normal' | 'gradeChange') => void;
}

type GradeKey = 'SM' | 'SLP' | 'SLK' | 'SE' | 'SR';

const DEFAULT_STEAM_FORMULA = "(FIE2002 * FAKTOR)";

export const Demonomer: React.FC<DemonomerProps> = ({ currentGrade, onGradeChange, data, onDataChange, gradeMode, onGradeModeChange }) => {
  
  // --- Handlers ---
  const handleResetFormulas = () => {
    onDataChange('steamFormula', DEFAULT_STEAM_FORMULA);
  };

  const handleMultiplierChange = (grade: GradeKey, val: string) => {
    const num = parseFloat(val) || 0;
    onDataChange('multipliers', { ...data.multipliers, [grade]: num });
  };

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
    const formula = (!data.steamFormula || data.steamFormula.includes("PVC * Steam Rasio") || data.steamFormula.includes("PVC * Multiplier") || data.steamFormula === "%PVC * F2002") 
      ? DEFAULT_STEAM_FORMULA 
      : data.steamFormula;

    return evaluateMath(formula, {
        'F2002': data.f2002,
        'FIE2002': data.f2002,
        'FAKTOR': data.pvcPercent,
        '%PVC': data.pvcPercent
    });
  }, [data.f2002, data.pvcPercent, data.steamFormula]);


  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans animate-in fade-in duration-500 flex flex-col gap-8 relative">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl text-white shadow-xl shadow-teal-500/20">
                <Activity className="w-8 h-8" />
            </div>
            <div>
                <h2 className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">HITUNG STEAM RASIO DEMONOMER</h2>
                <div className="flex items-center gap-3 mt-1">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 uppercase flex items-center gap-1">
                        <Database className="w-4 h-4" /> Real-time Sync
                    </span>
                </div>
            </div>
          </div>
      </div>

      {/* Main Calculation Table Section - Cycle Time Model */}
      <div className="flex flex-col shadow-xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="bg-teal-600 text-white font-black text-base px-6 py-4 flex items-center gap-2 uppercase tracking-widest">
              <Calculator className="w-5 h-5" />
              Operational Calculation
          </div>
          <div className="p-6 overflow-x-auto">
              <table className="w-full border-collapse text-center">
                  <thead>
                      <tr>
                          <th className="border-b-2 border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] text-xs font-bold">FIE2002</th>
                          <th className="border-b-2 border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] text-xs font-bold">FAKTOR</th>
                          <th className="border-b-2 border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] text-xs font-bold">STEAM TOTAL</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr>
                          <td className="p-4">
                              <input 
                                type="number"
                                value={data.f2002}
                                onChange={(e) => onDataChange('f2002', parseFloat(e.target.value) || 0)}
                                className="w-full bg-violet-50 dark:bg-violet-900/20 text-violet-900 dark:text-violet-100 border-none rounded-xl p-4 text-4xl font-black text-center focus:ring-4 focus:ring-violet-500/30 transition-all"
                              />
                          </td>
                          <td className="p-4">
                              <div className="relative">
                                  <input 
                                    type="number"
                                    step="0.01"
                                    value={data.pvcPercent}
                                    onChange={(e) => onDataChange('pvcPercent', parseFloat(e.target.value) || 0)}
                                    className="w-full bg-violet-50 dark:bg-violet-900/20 text-violet-900 dark:text-violet-100 border-none rounded-xl p-4 text-4xl font-black text-center focus:ring-4 focus:ring-violet-500/30 transition-all"
                                  />
                              </div>
                          </td>
                          <td className="p-4">
                              <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-xl p-4 text-6xl font-black text-center border-2 border-rose-100 dark:border-rose-800/50 tracking-tighter">
                                  {Math.round(calculatedSteam)}
                              </div>
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>

      {/* Settings & Formula Section */}
      <div className="grid grid-cols-1 gap-6">
          {/* Formula Configuration */}
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6">
                  <button onClick={handleResetFormulas} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white/40 hover:text-white" title="Reset Formulas">
                      <RotateCcw className="w-4 h-4" />
                  </button>
               </div>
               
               <h4 className="text-white font-extrabold text-lg mb-8 flex items-center gap-3">
                   <Calculator className="w-6 h-6 text-violet-400" /> FORMULAS
               </h4>

               <div className="space-y-8">
                   <div className="space-y-3">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">STEAM CALCULATION</label>
                       <input 
                            type="text"
                            value={data.steamFormula || "%PVC * F2002"}
                            onChange={(e) => onDataChange('steamFormula', e.target.value)}
                            className="w-full font-mono text-xs font-bold text-rose-400 bg-white/5 border border-white/10 rounded-2xl p-4 focus:bg-white/10 focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                       />
                       <div className="flex items-center justify-between text-[9px] font-bold text-slate-500">
                           <span>VARS: FIE2002, FAKTOR</span>
                           <span className="text-rose-400/60">RESULT: {calculatedSteam.toFixed(0)}</span>
                       </div>
                   </div>
               </div>

               <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3">
                   <div className="p-2 bg-violet-500/20 rounded-lg">
                       <Info className="w-4 h-4 text-violet-400" />
                   </div>
                   <p className="text-[10px] text-slate-400 leading-relaxed">
                       Formulas are evaluated in real-time. Use standard operators (+, -, *, /) and defined variables.
                   </p>
               </div>
          </div>
      </div>
    </div>
  );
};
