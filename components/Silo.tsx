import React from 'react';
import { Database, CheckCircle2, Play } from 'lucide-react';
import { SiloData } from '../types';

interface SiloProps {
    activeSilo: 'L' | 'M' | 'N' | null;
    silos: Record<'L' | 'M' | 'N', SiloData>;
    onDataChange?: (siloId: 'L'|'M'|'N', field: keyof SiloData, value: any) => void;
    onSiloSelect?: (siloId: 'L'|'M'|'N') => void;
}

export const Silo: React.FC<SiloProps> = ({ activeSilo, silos, onDataChange, onSiloSelect }) => {
  // Local state to prevent input jumping/lag while typing
  const [localSilos, setLocalSilos] = React.useState<Record<'L'|'M'|'N', SiloData>>(silos);

  // Keep track of which input field has focus so background updates do not overwrite it
  const [focusedField, setFocusedField] = React.useState<{ siloId: 'L'|'M'|'N'; field: keyof SiloData } | null>(null);

  // Ref container for debounced save values
  const saveTimers = React.useRef<Record<string, any>>({});

  // Sync prop changes to local state for fields NOT currently focused
  React.useEffect(() => {
    setLocalSilos((prev) => {
      const next = { ...prev };
      (['L', 'M', 'N'] as const).forEach((id) => {
        next[id] = { ...next[id] };
        const propSilo = silos[id];
        if (propSilo) {
          Object.keys(propSilo).forEach((key) => {
            const field = key as keyof SiloData;
            // Never overwrite the value if the operator is actively typing/focusing this input field
            if (focusedField?.siloId === id && focusedField?.field === field) {
              return;
            }
            (next[id] as any)[field] = propSilo[field];
          });
        }
      });
      return next;
    });
  }, [silos, focusedField]);

  // Clean up timers on unmount
  React.useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach((t) => clearTimeout(t as any));
    };
  }, []);

  // Handle immediate local changes + debounced database saves
  const handleChange = (id: 'L'|'M'|'N', field: keyof SiloData, val: string) => {
    // 1. Immediately update local state to be extremely snappy
    setLocalSilos((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: val
      }
    }));

    // 2. Clear any active debounce timer for this field and restart it
    const timerKey = `${id}-${field}`;
    if (saveTimers.current[timerKey]) {
      clearTimeout(saveTimers.current[timerKey]);
    }
    
    saveTimers.current[timerKey] = setTimeout(() => {
      if (onDataChange) {
        onDataChange(id, field, val);
      }
    }, 1500); // 1.5 seconds debounce for casual keystrokes
  };

  // Focus tracking helper
  const handleFocus = (id: 'L'|'M'|'N', field: keyof SiloData) => {
    setFocusedField({ siloId: id, field });
  };

  // Blur helper to immediately flushing the value to the database
  const handleBlur = (id: 'L'|'M'|'N', field: keyof SiloData, currentVal: any) => {
    setFocusedField(null);
    const timerKey = `${id}-${field}`;
    if (saveTimers.current[timerKey]) {
      clearTimeout(saveTimers.current[timerKey]);
      delete saveTimers.current[timerKey];
    }
    if (onDataChange) {
      onDataChange(id, field, currentVal);
    }
  };

  // Helper for conditional styling for Columns
  const getColumnClass = (siloId: 'L'|'M'|'N') => {
      if (activeSilo === siloId) {
          return "bg-emerald-100/50 border-emerald-500/50";
      }
      return "bg-slate-50"; // Default neutral background
  };

  // Helper for conditional styling for Headers
  const getHeaderClass = (siloId: 'L'|'M'|'N') => {
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
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 uppercase">L - M - N Control</span>
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
                          {['L', 'M', 'N'].map((id) => (
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
                          {['L', 'M', 'N'].map((siloId) => (
                              <td key={`action-${siloId}`} className="p-4">
                                   {activeSilo === siloId ? (
                                        <div className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-4 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20">
                                            <CheckCircle2 className="w-5 h-5" />
                                            CHARGING
                                        </div>
                                    ) : (
                                        <button 
                                           onClick={() => onSiloSelect && onSiloSelect(siloId as 'L'|'M'|'N')}
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
                          {['L', 'M', 'N'].map((id) => (
                              <td key={`lot-${id}`} className="p-4">
                                  <input 
                                      type="text" 
                                      value={localSilos[id as 'L'|'M'|'N'].lotNumber} 
                                      onFocus={() => handleFocus(id as 'L'|'M'|'N', 'lotNumber')}
                                      onBlur={(e) => handleBlur(id as 'L'|'M'|'N', 'lotNumber', e.target.value)}
                                      onChange={(e) => handleChange(id as 'L'|'M'|'N', 'lotNumber', e.target.value)}
                                      className="w-full bg-violet-50 dark:bg-violet-900/20 border-none rounded-xl p-4 text-xl font-black text-center text-slate-900 dark:text-white focus:ring-4 focus:ring-violet-500/20 transition-all"
                                      placeholder="---"
                                  />
                              </td>
                          ))}
                      </tr>

                      {/* Set Row */}
                      <tr className="border-b border-slate-100 dark:border-slate-800/50">
                          <td className="p-4 text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50/30 dark:bg-slate-800/10">CAPACITY (T)</td>
                          {['L', 'M', 'N'].map((id) => (
                              <td key={`set-${id}`} className="p-4">
                                  <input 
                                      type="number" 
                                      value={localSilos[id as 'L'|'M'|'N'].capacitySet} 
                                      onFocus={() => handleFocus(id as 'L'|'M'|'N', 'capacitySet')}
                                      onBlur={(e) => handleBlur(id as 'L'|'M'|'N', 'capacitySet', e.target.value)}
                                      onChange={(e) => handleChange(id as 'L'|'M'|'N', 'capacitySet', e.target.value)}
                                      className="w-full bg-violet-50 dark:bg-violet-900/20 border-none rounded-xl p-4 text-4xl font-black text-center text-cyan-600 dark:text-cyan-400 focus:ring-4 focus:ring-violet-500/20 transition-all"
                                      placeholder="0"
                                  /> 
                              </td>
                          ))}
                      </tr>

                      {/* Start Row */}
                      <tr className="border-b border-slate-100 dark:border-slate-800/50">
                          <td className="p-4 text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50/30 dark:bg-slate-800/10">START TIME</td>
                          {['L', 'M', 'N'].map((id) => (
                              <td key={`start-${id}`} className="p-4">
                                  <input 
                                      type="text"
                                      placeholder="00:00" 
                                      value={localSilos[id as 'L'|'M'|'N'].startTime || ''}
                                      onFocus={() => handleFocus(id as 'L'|'M'|'N', 'startTime')}
                                      onBlur={(e) => handleBlur(id as 'L'|'M'|'N', 'startTime', e.target.value)}
                                      onChange={(e) => handleChange(id as 'L'|'M'|'N', 'startTime', e.target.value)}
                                      className="w-full bg-violet-50 dark:bg-violet-900/20 border-none rounded-xl p-4 text-xl font-black text-center text-slate-900 dark:text-white focus:ring-4 focus:ring-violet-500/20 transition-all"
                                  />
                              </td>
                          ))}
                      </tr>

                       {/* Finish Row */}
                      <tr>
                          <td className="p-4 text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50/30 dark:bg-slate-800/10">FINISH TIME</td>
                          {['L', 'M', 'N'].map((id) => (
                              <td key={`finish-${id}`} className="p-4">
                                  <input 
                                      type="text" 
                                      placeholder="00:00"
                                      value={localSilos[id as 'L'|'M'|'N'].finishTime || ''}
                                      onFocus={() => handleFocus(id as 'L'|'M'|'N', 'finishTime')}
                                      onBlur={(e) => handleBlur(id as 'L'|'M'|'N', 'finishTime', e.target.value)}
                                      onChange={(e) => handleChange(id as 'L'|'M'|'N', 'finishTime', e.target.value)}
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
                  {/* Silo L Col */}
                  <div className="flex flex-col gap-2">
                       <UpdateRow 
                          val={String(localSilos.L.percentage || '')} 
                          total={String(localSilos.L.totalUpdate || '')} 
                          onPercentChange={(v) => handleChange('L', 'percentage', v)}
                          onTotalChange={(v) => handleChange('L', 'totalUpdate', v)}
                          onPercentFocus={() => handleFocus('L', 'percentage')}
                          onPercentBlur={() => handleBlur('L', 'percentage', localSilos.L.percentage)}
                          onTotalFocus={() => handleFocus('L', 'totalUpdate')}
                          onTotalBlur={() => handleBlur('L', 'totalUpdate', localSilos.L.totalUpdate)}
                          getInputClass={getInputClass}
                      />
                       <UpdateRow 
                          val={String(localSilos.L.percentage_14 || '')} 
                          total={String(localSilos.L.totalUpdate_14 || '')} 
                          onPercentChange={(v) => handleChange('L', 'percentage_14', v)}
                          onTotalChange={(v) => handleChange('L', 'totalUpdate_14', v)}
                          onPercentFocus={() => handleFocus('L', 'percentage_14')}
                          onPercentBlur={() => handleBlur('L', 'percentage_14', localSilos.L.percentage_14)}
                          onTotalFocus={() => handleFocus('L', 'totalUpdate_14')}
                          onTotalBlur={() => handleBlur('L', 'totalUpdate_14', localSilos.L.totalUpdate_14)}
                          getInputClass={getInputClass}
                      />
                       <UpdateRow 
                          val={String(localSilos.L.percentage_22 || '')} 
                          total={String(localSilos.L.totalUpdate_22 || '')} 
                          onPercentChange={(v) => handleChange('L', 'percentage_22', v)}
                          onTotalChange={(v) => handleChange('L', 'totalUpdate_22', v)}
                          onPercentFocus={() => handleFocus('L', 'percentage_22')}
                          onPercentBlur={() => handleBlur('L', 'percentage_22', localSilos.L.percentage_22)}
                          onTotalFocus={() => handleFocus('L', 'totalUpdate_22')}
                          onTotalBlur={() => handleBlur('L', 'totalUpdate_22', localSilos.L.totalUpdate_22)}
                          getInputClass={getInputClass}
                      />
                  </div>
                  {/* Silo M Col */}
                  <div className="flex flex-col gap-2">
                       <UpdateRow 
                          val={String(localSilos.M.percentage || '')} 
                          total={String(localSilos.M.totalUpdate || '')} 
                          onPercentChange={(v) => handleChange('M', 'percentage', v)}
                          onTotalChange={(v) => handleChange('M', 'totalUpdate', v)}
                          onPercentFocus={() => handleFocus('M', 'percentage')}
                          onPercentBlur={() => handleBlur('M', 'percentage', localSilos.M.percentage)}
                          onTotalFocus={() => handleFocus('M', 'totalUpdate')}
                          onTotalBlur={() => handleBlur('M', 'totalUpdate', localSilos.M.totalUpdate)}
                          getInputClass={getInputClass}
                      />
                       <UpdateRow 
                          val={String(localSilos.M.percentage_14 || '')} 
                          total={String(localSilos.M.totalUpdate_14 || '')} 
                          onPercentChange={(v) => handleChange('M', 'percentage_14', v)}
                          onTotalChange={(v) => handleChange('M', 'totalUpdate_14', v)}
                          onPercentFocus={() => handleFocus('M', 'percentage_14')}
                          onPercentBlur={() => handleBlur('M', 'percentage_14', localSilos.M.percentage_14)}
                          onTotalFocus={() => handleFocus('M', 'totalUpdate_14')}
                          onTotalBlur={() => handleBlur('M', 'totalUpdate_14', localSilos.M.totalUpdate_14)}
                          getInputClass={getInputClass}
                      />
                       <UpdateRow 
                          val={String(localSilos.M.percentage_22 || '')} 
                          total={String(localSilos.M.totalUpdate_22 || '')} 
                          onPercentChange={(v) => handleChange('M', 'percentage_22', v)}
                          onTotalChange={(v) => handleChange('M', 'totalUpdate_22', v)}
                          onPercentFocus={() => handleFocus('M', 'percentage_22')}
                          onPercentBlur={() => handleBlur('M', 'percentage_22', localSilos.M.percentage_22)}
                          onTotalFocus={() => handleFocus('M', 'totalUpdate_22')}
                          onTotalBlur={() => handleBlur('M', 'totalUpdate_22', localSilos.M.totalUpdate_22)}
                          getInputClass={getInputClass}
                      />
                  </div>
                   {/* Silo N Col */}
                  <div className="flex flex-col gap-2">
                       <UpdateRow 
                          val={String(localSilos.N.percentage || '')} 
                          total={String(localSilos.N.totalUpdate || '')} 
                          onPercentChange={(v) => handleChange('N', 'percentage', v)}
                          onTotalChange={(v) => handleChange('N', 'totalUpdate', v)}
                          onPercentFocus={() => handleFocus('N', 'percentage')}
                          onPercentBlur={() => handleBlur('N', 'percentage', localSilos.N.percentage)}
                          onTotalFocus={() => handleFocus('N', 'totalUpdate')}
                          onTotalBlur={() => handleBlur('N', 'totalUpdate', localSilos.N.totalUpdate)}
                          getInputClass={getInputClass}
                      />
                       <UpdateRow 
                          val={String(localSilos.N.percentage_14 || '')} 
                          total={String(localSilos.N.totalUpdate_14 || '')} 
                          onPercentChange={(v) => handleChange('N', 'percentage_14', v)}
                          onTotalChange={(v) => handleChange('N', 'totalUpdate_14', v)}
                          onPercentFocus={() => handleFocus('N', 'percentage_14')}
                          onPercentBlur={() => handleBlur('N', 'percentage_14', localSilos.N.percentage_14)}
                          onTotalFocus={() => handleFocus('N', 'totalUpdate_14')}
                          onTotalBlur={() => handleBlur('N', 'totalUpdate_14', localSilos.N.totalUpdate_14)}
                          getInputClass={getInputClass}
                      />
                       <UpdateRow 
                          val={String(localSilos.N.percentage_22 || '')} 
                          total={String(localSilos.N.totalUpdate_22 || '')} 
                          onPercentChange={(v) => handleChange('N', 'percentage_22', v)}
                          onTotalChange={(v) => handleChange('N', 'totalUpdate_22', v)}
                          onPercentFocus={() => handleFocus('N', 'percentage_22')}
                          onPercentBlur={() => handleBlur('N', 'percentage_22', localSilos.N.percentage_22)}
                          onTotalFocus={() => handleFocus('N', 'totalUpdate_22')}
                          onTotalBlur={() => handleBlur('N', 'totalUpdate_22', localSilos.N.totalUpdate_22)}
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
    onPercentFocus?: () => void;
    onPercentBlur?: () => void;
    onTotalFocus?: () => void;
    onTotalBlur?: () => void;
    getInputClass: (val: any, color?: string) => string;
}

const UpdateRow = ({
  val, 
  total, 
  isEmpty, 
  onPercentChange, 
  onTotalChange,
  onPercentFocus,
  onPercentBlur,
  onTotalFocus,
  onTotalBlur
}: UpdateRowProps) => (
    <div className="h-[80px] flex items-center border-b border-slate-100 dark:border-slate-800/50 last:border-b-0 p-3 gap-3">
        <div className="w-20 h-full relative">
            {!isEmpty && (
                <>
                    <input 
                        type="number" 
                        value={val} 
                        onFocus={onPercentFocus}
                        onBlur={onPercentBlur}
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
                        onFocus={onTotalFocus}
                        onBlur={onTotalBlur}
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
