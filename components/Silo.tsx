import React from 'react';
import { Database, CheckCircle2, Play } from 'lucide-react';
import { SiloData, SiloId } from '../types';

interface SiloProps {
    readOnly?: boolean;
    activeSilo: SiloId | null;
    silos: Record<SiloId, SiloData>;
    onDataChange?: (siloId: SiloId, field: keyof SiloData, value: any) => void;
    onShiftChange?: (siloId: SiloId, time: '06:00'|'14:00'|'22:00', field: 'percentage'|'totalUpdate', value: any) => void;
    onSiloSelect?: (siloId: SiloId) => void;
}

export const Silo: React.FC<SiloProps> = ({ readOnly = false, activeSilo, silos, onDataChange, onShiftChange, onSiloSelect }) => {
  
  // Helper to handle input changes
  const handleChange = (id: SiloId, field: keyof SiloData, val: string) => {
      if (readOnly) return;
      if (!onDataChange) return;
      onDataChange(id, field, val);
  };

  const handleShiftChange = (siloId: SiloId, time: '06:00'|'14:00'|'22:00', field: 'percentage'|'totalUpdate', val: string) => {
      if (readOnly) return;
      if (onShiftChange) {
          onShiftChange(siloId, time, field, val);
      } else if (onDataChange) {
          onDataChange(siloId, field, val);
      }
  };

  const getShiftValue = (siloId: SiloId, time: '06:00'|'14:00'|'22:00', field: 'percentage'|'totalUpdate'): string => {
      const silo = silos[siloId];
      if (silo?.shifts?.[time]?.[field] !== undefined && silo?.shifts?.[time]?.[field] !== null) {
          return String(silo.shifts[time][field] ?? '');
      }
      if (siloId === 'L' && time === '06:00') {
          return field === 'percentage' ? String(silo?.percentage || '') : String(silo?.totalUpdate || '');
      }
      if (siloId === 'M' && time === '14:00') {
          return field === 'percentage' ? String(silo?.percentage || '') : String(silo?.totalUpdate || '');
      }
      if (siloId === 'N' && time === '22:00') {
          return field === 'percentage' ? String(silo?.percentage || '') : String(silo?.totalUpdate || '');
      }
      return '';
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

  const siloKeys: SiloId[] = ['L', 'M', 'N'];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans animate-in fade-in duration-500">
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 lg:mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 lg:p-4 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-2xl text-white shadow-xl shadow-cyan-500/20 shrink-0">
                <Database className="w-6 h-6 lg:w-8 lg:h-8" />
            </div>
            <div>
                <h2 className="text-2xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">Silo Monitor</h2>
                <div className="flex items-center gap-3 mt-1">
                    <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-sm tracking-widest">Storage & Distribution</p>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 uppercase">L - M - N Control</span>
                </div>
            </div>
          </div>
          <div role={readOnly ? 'status' : undefined} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border ${readOnly ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50'}`}>
             <div className={`w-2 h-2 rounded-full ${readOnly ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></div>
             {readOnly ? 'MODE HANYA BACA DI HP' : 'SYSTEM ACTIVE'}
          </div>
      </div>

      {/* Main Silo Table - Cycle Time Model */}
      <div className="flex flex-col shadow-xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="bg-cyan-600 text-white font-black text-base px-6 py-4 flex items-center gap-2 uppercase tracking-widest">
              <Database className="w-5 h-5" />
              Silo Operational
          </div>
          <div className="p-3 lg:p-6 overflow-x-auto">
              <table className="w-full border-collapse text-center">
                  <thead>
                      <tr>
                          <th className="border-b-2 border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] text-sm font-bold">PARAMETER</th>
                          {siloKeys.map((id) => (
                              <th key={`head-${id}`} className={`border-b-2 border-slate-100 dark:border-slate-800 p-4 uppercase tracking-[0.2em] text-4xl font-black ${activeSilo === id ? 'bg-cyan-500 text-white' : 'bg-slate-50/50 dark:bg-slate-800/30 text-slate-800 dark:text-slate-200'}`}>
                                  SILO {id}
                              </th>
                          ))}
                      </tr>
                  </thead>
                  <tbody>
                      {/* ACTION Row */}
                      <tr className="border-b border-slate-100 dark:border-slate-800/50">
                          <td className="p-4 text-sm font-bold uppercase tracking-widest text-slate-400 bg-slate-50/30 dark:bg-slate-800/10">STATUS</td>
                          {siloKeys.map((siloId) => (
                              <td key={`action-${siloId}`} className="p-4">
                                   {activeSilo === siloId ? (
                                       <div className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-4 rounded-xl font-bold text-base shadow-lg shadow-emerald-500/20">
                                           <CheckCircle2 className="w-5 h-5" />
                                           CHARGING
                                       </div>
                                   ) : (
                                       <button 
                                          disabled={readOnly}
                                          onClick={() => onSiloSelect && onSiloSelect(siloId)}
                                          className={`w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-500 px-4 py-4 rounded-xl font-bold text-sm border border-slate-200 dark:border-slate-700 transition-all uppercase tracking-wider ${readOnly ? 'cursor-not-allowed opacity-50' : 'hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-300'}`}
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
                          <td className="p-4 text-sm font-bold uppercase tracking-widest text-slate-400 bg-slate-50/30 dark:bg-slate-800/10">LOT NUMBER</td>
                          {siloKeys.map((id) => (
                              <td key={`lot-${id}`} className="p-4">
                                   <input
                                       type="text"
                                       readOnly={readOnly}
                                       aria-readonly={readOnly}
                                       aria-label={`Lot number Silo ${id}`}
                                      value={silos[id]?.lotNumber || ''} 
                                      onChange={(e) => handleChange(id, 'lotNumber', e.target.value)}
                                      className="w-full bg-blue-50 dark:bg-blue-900/20 border-none rounded-xl p-4 text-2xl font-black text-center text-slate-900 dark:text-white focus:ring-4 focus:ring-cyan-500/20 transition-all"
                                      placeholder="---"
                                  />
                              </td>
                          ))}
                      </tr>

                      {/* Set Row */}
                      <tr className="border-b border-slate-100 dark:border-slate-800/50">
                          <td className="p-4 text-sm font-bold uppercase tracking-widest text-slate-400 bg-slate-50/30 dark:bg-slate-800/10">CAPACITY (T)</td>
                          {siloKeys.map((id) => (
                              <td key={`set-${id}`} className="p-4">
                                   <input
                                       type="number"
                                       readOnly={readOnly}
                                       aria-readonly={readOnly}
                                       aria-label={`Capacity Silo ${id}`}
                                      value={silos[id]?.capacitySet || ''} 
                                      onChange={(e) => handleChange(id, 'capacitySet', e.target.value)}
                                      className="w-full bg-blue-50 dark:bg-blue-900/20 border-none rounded-xl p-2 lg:p-4 text-3xl lg:text-5xl font-black text-center text-cyan-600 dark:text-cyan-400 focus:ring-4 focus:ring-cyan-500/20 transition-all"
                                      placeholder="0"
                                  /> 
                              </td>
                          ))}
                      </tr>

                      {/* Start Row */}
                      <tr className="border-b border-slate-100 dark:border-slate-800/50">
                          <td className="p-4 text-sm font-bold uppercase tracking-widest text-slate-400 bg-slate-50/30 dark:bg-slate-800/10">START TIME</td>
                          {siloKeys.map((id) => (
                              <td key={`start-${id}`} className="p-4">
                                   <input
                                       type="text"
                                       readOnly={readOnly}
                                       aria-readonly={readOnly}
                                       aria-label={`Start time Silo ${id}`}
                                      placeholder="00:00" 
                                      value={silos[id]?.startTime || ''}
                                      onChange={(e) => handleChange(id, 'startTime', e.target.value)}
                                      className="w-full bg-blue-50 dark:bg-blue-900/20 border-none rounded-xl p-4 text-2xl font-black text-center text-slate-900 dark:text-white focus:ring-4 focus:ring-cyan-500/20 transition-all"
                                  />
                              </td>
                          ))}
                      </tr>

                       {/* Finish Row */}
                      <tr>
                          <td className="p-4 text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50/30 dark:bg-slate-800/10">FINISH TIME</td>
                          {siloKeys.map((id) => (
                              <td key={`finish-${id}`} className="p-4">
                                   <input
                                       type="text"
                                       readOnly={readOnly}
                                       aria-readonly={readOnly}
                                       aria-label={`Finish time Silo ${id}`}
                                      placeholder="00:00"
                                      value={silos[id]?.finishTime || ''}
                                      onChange={(e) => handleChange(id, 'finishTime', e.target.value)}
                                      className="w-full bg-blue-50 dark:bg-blue-900/20 border-none rounded-xl p-4 text-xl font-black text-center text-rose-600 dark:text-rose-400 focus:ring-4 focus:ring-rose-500/20 transition-all"
                                  />
                              </td>
                          ))}
                      </tr>
                  </tbody>
              </table>
          </div>

          {/* Update Section - Shift Log */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 lg:p-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Shift Log Updates</h3>
              </div>
              <div className="overflow-x-auto">
              <div className="grid grid-cols-[90px_repeat(3,1fr)] lg:grid-cols-[120px_repeat(3,1fr)] gap-2 lg:gap-4 min-w-[540px]">
                  <div className="flex flex-col gap-2">
                      {['06:00', '14:00', '22:00'].map(time => (
                         <div key={time} className="h-[80px] flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center font-black text-base text-slate-600 dark:text-slate-400 shadow-sm">
                             {time}
                         </div>
                      ))}
                  </div>
                  {/* Silo Columns */}
                  {siloKeys.map((siloId) => (
                      <div key={`col-${siloId}`} className="flex flex-col gap-2">
                          {(['06:00', '14:00', '22:00'] as const).map((time) => (
                              <UpdateRow 
                                  key={`${siloId}-${time}`}
                                  readOnly={readOnly}
                                  val={getShiftValue(siloId, time, 'percentage')} 
                                  total={getShiftValue(siloId, time, 'totalUpdate')} 
                                  onPercentChange={(v) => handleShiftChange(siloId, time, 'percentage', v)}
                                  onTotalChange={(v) => handleShiftChange(siloId, time, 'totalUpdate', v)}
                                  getInputClass={getInputClass}
                              />
                          ))}
                      </div>
                  ))}
              </div>
              </div>
          </div>
      </div>
    </div>
  );
};

// Helper for the update rows
interface UpdateRowProps {
    readOnly?: boolean;
    val: string;
    total: string;
    isEmpty?: boolean;
    isHash?: boolean;
    onPercentChange?: (v: string) => void;
    onTotalChange?: (v: string) => void;
    getInputClass: (val: any, color?: string) => string;
}

const UpdateRow: React.FC<UpdateRowProps> = ({readOnly = false, val, total, isEmpty, onPercentChange, onTotalChange}) => (
    <div className={`h-[96px] flex items-center border-b border-slate-100 dark:border-slate-800/50 last:border-b-0 p-3 gap-3 ${isEmpty ? 'opacity-20' : ''}`}>
        <div className="w-24 h-full relative">
            {!isEmpty && (
                <>
                     <input
                         type="number"
                         readOnly={readOnly}
                         aria-readonly={readOnly}
                         aria-label="Persentase update silo"
                        value={val} 
                        onChange={(e) => onPercentChange && onPercentChange(e.target.value)}
                        className="w-full h-full bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 rounded-xl text-center font-black text-2xl outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                        placeholder="0"
                    />
                    <span className="absolute -top-1 -right-1 bg-white dark:bg-slate-900 text-xs font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">%</span>
                </>
            )}
        </div>
        <div className="flex-1 h-full relative">
             {!isEmpty && (
                 <>
                    <input
                        type="number"
                        readOnly={readOnly}
                        aria-readonly={readOnly}
                        aria-label="Total update silo dalam ton"
                        value={total} 
                        onChange={(e) => onTotalChange && onTotalChange(e.target.value)}
                        className="w-full h-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-center font-black text-2xl outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                        placeholder="0.0"
                    />
                    <span className="absolute -top-1 -right-1 bg-white dark:bg-slate-900 text-xs font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">TON</span>
                 </>
             )}
        </div>
    </div>
);
