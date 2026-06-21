
import React from 'react';
import { Database, CheckCircle2, Play } from 'lucide-react';
import { SiloData } from '../types';

interface SiloProps {
    activeSilo: 'K' | 'L' | 'M' | null;
    silos: Record<'K' | 'L' | 'M', SiloData>;
    onDataChange?: (siloId: 'K'|'L'|'M', field: keyof SiloData, value: any) => void;
    onSiloSelect?: (siloId: 'K'|'L'|'M') => void;
}

export const Silo: React.FC<SiloProps> = ({ activeSilo, silos, onDataChange, onSiloSelect }) => {
  
  // Helper to handle input changes
  const handleChange = (id: 'K'|'L'|'M', field: keyof SiloData, val: string) => {
      if (!onDataChange) return;
      onDataChange(id, field, val);
  };

  // Helper for conditional styling for Columns
  const getColumnClass = (siloId: 'K'|'L'|'M') => {
      if (activeSilo === siloId) {
          return "bg-emerald-100/50 border-emerald-500/50";
      }
      return "bg-slate-50"; // Default neutral background
  };

  // Helper for conditional styling for Headers
  const getHeaderClass = (siloId: 'K'|'L'|'M') => {
      if (activeSilo === siloId) {
          return "bg-emerald-600 ring-inset ring-4 ring-yellow-400 z-10 scale-105 shadow-xl opacity-100";
      }
      return "bg-black opacity-80 scale-95";
  };

  // Helper for Input Styling (Empty vs Filled)
  const getInputClass = (value: any, filledColor: string = 'text-black', activeBorder: boolean = false) => {
      const hasValue = value !== '' && value !== null && value !== undefined;
      const base = "w-full h-full text-center font-bold text-xl outline-none transition-all duration-200 rounded";
      
      if (hasValue) {
          return `${base} bg-white shadow-sm ${filledColor} ${activeBorder ? 'border-2 border-emerald-400' : 'border border-slate-300'}`;
      }
      return `${base} bg-transparent border border-transparent placeholder-slate-400 opacity-60 focus:bg-white focus:opacity-100 focus:shadow-md`;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-2xl text-white shadow-xl shadow-cyan-500/20">
                <Database className="w-8 h-8" />
            </div>
            <div>
                <h2 className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">Silo Monitor</h2>
                <div className="flex items-center gap-3 mt-1">
                    <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-sm tracking-widest">Storage & Distribution</p>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 uppercase">K - L - M Control</span>
                </div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-full text-xs font-bold border border-emerald-100 dark:border-emerald-800/50">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             SYSTEM ACTIVE
          </div>
      </div>

      {/* Main Silo Table - Cycle Time Model */}
      <div className="flex flex-col shadow-xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="bg-cyan-600 text-white font-black text-base px-6 py-4 flex items-center gap-2 uppercase tracking-widest">
              <Database className="w-5 h-5" />
              Silo Operational
          </div>
          <div className="p-6 overflow-x-auto">
              <table className="w-full border-collapse text-center">
                  <thead>
                      <tr>
                          <th className="border-b-2 border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] text-xs font-bold">PARAMETER</th>
                          {['K', 'L', 'M'].map((id) => (
                              <th key={`head-${id}`} className={`border-b-2 border-slate-100 dark:border-slate-800 p-4 uppercase tracking-[0.2em] text-3xl font-black ${activeSilo === id ? 'bg-cyan-500 text-white' : 'bg-slate-50/50 dark:bg-slate-800/30 text-slate-800 dark:text-slate-200'}`}>
                                  SILO {id}
                              </th>
                          ))}
                      </tr>
                  </thead>
                  <tbody>
                      {/* ACTION Row */}
                      <tr className="border-b border-slate-100 dark:border-slate-800/50">
                          <td className="p-4 text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50/30 dark:bg-slate-800/10">STATUS</td>
                          {['K', 'L', 'M'].map((siloId) => (
                              <td key={`action-${siloId}`} className="p-4">
                                   {activeSilo === siloId ? (
                                       <div className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-4 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20">
                                           <CheckCircle2 className="w-5 h-5" />
                                           CHARGING
                                       </div>
                                   ) : (
                                       <button 
                                          onClick={() => onSiloSelect && onSiloSelect(siloId as 'K'|'L'|'M')}
                                          className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-cyan-50 dark:bg-slate-800 dark:hover:bg-cyan-900/20 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 px-4 py-4 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700 hover:border-cyan-300 transition-all uppercase tracking-wider"
                                       >
                                           <Play className="w-4 h-4" />
                                           SELECT
                                       </button>
                                   )}
                              </td>
                          ))}
                      </tr>

                      {/* Lot Number Row */}
                      <tr className="border-b border-slate-100 dark:border-slate-800/50">
                          <td className="p-4 text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50/30 dark:bg-slate-800/10">LOT NUMBER</td>
                          {['K', 'L', 'M'].map((id) => (
                              <td key={`lot-${id}`} className="p-4">
                                  <input 
                                      type="text" 
                                      value={silos[id as 'K'|'L'|'M'].lotNumber} 
                                      onChange={(e) => handleChange(id as 'K'|'L'|'M', 'lotNumber', e.target.value)}
                                      className="w-full bg-violet-50 dark:bg-violet-900/20 border-none rounded-xl p-4 text-xl font-black text-center text-slate-900 dark:text-white focus:ring-4 focus:ring-violet-500/20 transition-all"
                                      placeholder="---"
                                  />
                              </td>
                          ))}
                      </tr>

                      {/* Set Row */}
                      <tr className="border-b border-slate-100 dark:border-slate-800/50">
                          <td className="p-4 text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50/30 dark:bg-slate-800/10">CAPACITY (T)</td>
                          {['K', 'L', 'M'].map((id) => (
                              <td key={`set-${id}`} className="p-4">
                                  <input 
                                      type="number" 
                                      value={silos[id as 'K'|'L'|'M'].capacitySet} 
                                      onChange={(e) => handleChange(id as 'K'|'L'|'M', 'capacitySet', e.target.value)}
                                      className="w-full bg-violet-50 dark:bg-violet-900/20 border-none rounded-xl p-4 text-4xl font-black text-center text-cyan-600 dark:text-cyan-400 focus:ring-4 focus:ring-violet-500/20 transition-all"
                                      placeholder="0"
                                  /> 
                              </td>
                          ))}
                      </tr>

                      {/* Start Row */}
                      <tr className="border-b border-slate-100 dark:border-slate-800/50">
                          <td className="p-4 text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50/30 dark:bg-slate-800/10">START TIME</td>
                          {['K', 'L', 'M'].map((id) => (
                              <td key={`start-${id}`} className="p-4">
                                  <input 
                                      type="text"
                                      placeholder="00:00" 
                                      value={silos[id as 'K'|'L'|'M'].startTime || ''}
                                      onChange={(e) => handleChange(id as 'K'|'L'|'M', 'startTime', e.target.value)}
                                      className="w-full bg-violet-50 dark:bg-violet-900/20 border-none rounded-xl p-4 text-xl font-black text-center text-slate-900 dark:text-white focus:ring-4 focus:ring-violet-500/20 transition-all"
                                  />
                              </td>
                          ))}
                      </tr>

                       {/* Finish Row */}
                      <tr>
                          <td className="p-4 text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50/30 dark:bg-slate-800/10">FINISH TIME</td>
                          {['K', 'L', 'M'].map((id) => (
                              <td key={`finish-${id}`} className="p-4">
                                  <input 
                                      type="text" 
                                      placeholder="00:00"
                                      value={silos[id as 'K'|'L'|'M'].finishTime || ''}
                                      onChange={(e) => handleChange(id as 'K'|'L'|'M', 'finishTime', e.target.value)}
                                      className="w-full bg-violet-50 dark:bg-violet-900/20 border-none rounded-xl p-4 text-xl font-black text-center text-rose-600 dark:text-rose-400 focus:ring-4 focus:ring-violet-500/20 transition-all"
                                  />
                              </td>
                          ))}
                      </tr>
                  </tbody>
              </table>
          </div>

          {/* Update Section - Shift Log */}
          <div className="bg-slate-50 dark:bg-slate-950 p-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Shift Log Updates</h3>
              </div>
              <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-4">
                  <div className="flex flex-col gap-2">
                      {['06:00', '14:00', '22:00'].map(time => (
                         <div key={time} className="h-[80px] flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center font-black text-base text-slate-600 dark:text-slate-400 shadow-sm">
                             {time}
                          </div>
                      ))}
                  </div>
                  {/* Silo K Col */}
                  <div className="flex flex-col gap-2">
                       <UpdateRow 
                          val={String(silos.K.percentage || '')} 
                          total={String(silos.K.totalUpdate || '')} 
                          onPercentChange={(v) => handleChange('K', 'percentage', v)}
                          onTotalChange={(v) => handleChange('K', 'totalUpdate', v)}
                          getInputClass={getInputClass}
                      />
                       <UpdateRow 
                          val={String(silos.K.percentage_14 || '')} 
                          total={String(silos.K.totalUpdate_14 || '')} 
                          onPercentChange={(v) => handleChange('K', 'percentage_14', v)}
                          onTotalChange={(v) => handleChange('K', 'totalUpdate_14', v)}
                          getInputClass={getInputClass}
                      />
                       <UpdateRow 
                          val={String(silos.K.percentage_22 || '')} 
                          total={String(silos.K.totalUpdate_22 || '')} 
                          onPercentChange={(v) => handleChange('K', 'percentage_22', v)}
                          onTotalChange={(v) => handleChange('K', 'totalUpdate_22', v)}
                          getInputClass={getInputClass}
                      />
                  </div>
                  {/* Silo L Col */}
                  <div className="flex flex-col gap-2">
                       <UpdateRow 
                          val={String(silos.L.percentage || '')} 
                          total={String(silos.L.totalUpdate || '')} 
                          onPercentChange={(v) => handleChange('L', 'percentage', v)}
                          onTotalChange={(v) => handleChange('L', 'totalUpdate', v)}
                          getInputClass={getInputClass}
                      />
                       <UpdateRow 
                          val={String(silos.L.percentage_14 || '')} 
                          total={String(silos.L.totalUpdate_14 || '')} 
                          onPercentChange={(v) => handleChange('L', 'percentage_14', v)}
                          onTotalChange={(v) => handleChange('L', 'totalUpdate_14', v)}
                          getInputClass={getInputClass}
                      />
                       <UpdateRow 
                          val={String(silos.L.percentage_22 || '')} 
                          total={String(silos.L.totalUpdate_22 || '')} 
                          onPercentChange={(v) => handleChange('L', 'percentage_22', v)}
                          onTotalChange={(v) => handleChange('L', 'totalUpdate_22', v)}
                          getInputClass={getInputClass}
                      />
                  </div>
                   {/* Silo M Col */}
                  <div className="flex flex-col gap-2">
                       <UpdateRow 
                          val={String(silos.M.percentage || '')} 
                          total={String(silos.M.totalUpdate || '')} 
                          onPercentChange={(v) => handleChange('M', 'percentage', v)}
                          onTotalChange={(v) => handleChange('M', 'totalUpdate', v)}
                          getInputClass={getInputClass}
                      />
                       <UpdateRow 
                          val={String(silos.M.percentage_14 || '')} 
                          total={String(silos.M.totalUpdate_14 || '')} 
                          onPercentChange={(v) => handleChange('M', 'percentage_14', v)}
                          onTotalChange={(v) => handleChange('M', 'totalUpdate_14', v)}
                          getInputClass={getInputClass}
                      />
                       <UpdateRow 
                          val={String(silos.M.percentage_22 || '')} 
                          total={String(silos.M.totalUpdate_22 || '')} 
                          onPercentChange={(v) => handleChange('M', 'percentage_22', v)}
                          onTotalChange={(v) => handleChange('M', 'totalUpdate_22', v)}
                          getInputClass={getInputClass}
                      />
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

// Helper for the update rows
interface UpdateRowProps {
    val: string;
    total: string;
    isEmpty?: boolean;
    isHash?: boolean;
    onPercentChange?: (v: string) => void;
    onTotalChange?: (v: string) => void;
    getInputClass: (val: any, color?: string) => string;
}

const UpdateRow = ({val, total, isEmpty, onPercentChange, onTotalChange}: UpdateRowProps) => (
    <div className={`h-[80px] flex items-center border-b border-slate-100 dark:border-slate-800/50 last:border-b-0 p-3 gap-3 ${isEmpty ? 'opacity-20' : ''}`}>
        <div className="w-20 h-full relative">
            {!isEmpty && (
                <>
                    <input 
                        type="number" 
                        value={val} 
                        onChange={(e) => onPercentChange && onPercentChange(e.target.value)}
                        className="w-full h-full bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 rounded-xl text-center font-black text-xl outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                        placeholder="0"
                    />
                    <span className="absolute -top-1 -right-1 bg-white dark:bg-slate-900 text-xs font-bold px-1 rounded border border-slate-200 dark:border-slate-700">%</span>
                </>
            )}
        </div>
        <div className="flex-1 h-full relative">
             {!isEmpty && (
                 <>
                    <input 
                        type="number" 
                        value={total} 
                        onChange={(e) => onTotalChange && onTotalChange(e.target.value)}
                        className="w-full h-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-center font-black text-xl outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                        placeholder="0.0"
                    />
                    <span className="absolute -top-1 -right-1 bg-white dark:bg-slate-900 text-xs font-bold px-1 rounded border border-slate-200 dark:border-slate-700">TON</span>
                 </>
             )}
        </div>
    </div>
);
