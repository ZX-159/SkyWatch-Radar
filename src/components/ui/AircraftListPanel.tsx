import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Shield, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useAircraftStore } from '../../stores/aircraftStore';
import { useMapStore } from '../../stores/mapStore';
import { getMilitaryConfidenceColor } from '../../utils/militaryDetection';
import { formatAltitude, formatSpeed } from '../../utils/aircraftTransform';
import type { Aircraft } from '../../types/aircraft';

type SortField = 'callsign' | 'altitude' | 'groundSpeed' | 'militaryScore';
type SortDir = 'asc' | 'desc';

interface AircraftListPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function AircraftListPanel({ visible, onClose }: AircraftListPanelProps) {
  const { filteredAircraft, selectedHex, selectAircraft } = useAircraftStore();
  const { setPanelVisible } = useMapStore();
  const [sortField, setSortField] = useState<SortField>('militaryScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page] = useState(0);
  const PAGE_SIZE = 50;

  const sorted = useMemo(() => {
    const arr = [...filteredAircraft];
    arr.sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;
      switch (sortField) {
        case 'callsign':
          va = a.callsign || a.hex;
          vb = b.callsign || b.hex;
          break;
        case 'altitude':
          va = a.altitude;
          vb = b.altitude;
          break;
        case 'groundSpeed':
          va = a.groundSpeed;
          vb = b.groundSpeed;
          break;
        case 'militaryScore':
          va = a.militaryScore;
          vb = b.militaryScore;
          break;
      }
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === 'asc'
        ? (va as number) - (vb as number)
        : (vb as number) - (va as number);
    });
    return arr;
  }, [filteredAircraft, sortField, sortDir]);

  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleSelect = (ac: Aircraft) => {
    selectAircraft(ac.hex);
    setPanelVisible('aircraft-info', true);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 250 }}
          className="absolute left-4 top-16 bottom-4 w-72 z-20 flex flex-col"
          style={{ maxHeight: 'calc(100vh - 80px)' }}
        >
          <div className="flex flex-col h-full rounded-xl overflow-hidden"
            style={{
              background: 'rgba(10, 14, 26, 0.95)',
              border: '1px solid rgba(14, 165, 233, 0.15)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(14, 165, 233, 0.12)' }}>
              <div>
                <h3 className="text-sm font-mono font-bold text-white">FLIGHT INTEL</h3>
                <p className="text-xs text-slate-500 font-mono">{sorted.length} CONTACTS</p>
              </div>
              <button
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-300 font-mono px-2 py-1 rounded hover:bg-white/5 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Sort header */}
            <div className="grid grid-cols-12 gap-1 px-4 py-2 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <SortBtn col="col-span-5" label="CALLSIGN" field="callsign" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortBtn col="col-span-3" label="ALT" field="altitude" current={sortField} dir={sortDir} onClick={handleSort} />
              <SortBtn col="col-span-4" label="SCORE" field="militaryScore" current={sortField} dir={sortDir} onClick={handleSort} />
            </div>

            {/* Aircraft list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {paged.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600">
                  <Shield size={32} className="mb-3 opacity-30" />
                  <p className="text-sm font-mono">NO CONTACTS</p>
                  <p className="text-xs mt-1">Adjust filters or wait for data</p>
                </div>
              ) : (
                paged.map((ac) => (
                  <AircraftRow
                    key={ac.hex}
                    aircraft={ac}
                    selected={ac.hex === selectedHex}
                    onClick={() => handleSelect(ac)}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 flex-shrink-0 flex items-center justify-between"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-xs font-mono text-slate-600">
                {paged.length} / {sorted.length}
              </span>
              <span className="text-xs font-mono text-slate-600 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                LIVE
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface AircraftRowProps {
  aircraft: Aircraft;
  selected: boolean;
  onClick: () => void;
}

function AircraftRow({ aircraft: ac, selected, onClick }: AircraftRowProps) {
  const confColor = getMilitaryConfidenceColor(ac.militaryConfidence);

  const vrIcon = ac.verticalRate > 200
    ? <ArrowUp size={10} color="#22c55e" />
    : ac.verticalRate < -200
    ? <ArrowDown size={10} color="#ef4444" />
    : <Minus size={10} color="#475569" />;

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClick}
      className="w-full text-left grid grid-cols-12 gap-1 px-4 py-2 transition-all group"
      style={{
        background: selected ? 'rgba(14, 165, 233, 0.12)' : 'transparent',
        borderLeft: selected ? '2px solid #0ea5e9' : '2px solid transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Callsign + type */}
      <div className="col-span-5 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: confColor, boxShadow: `0 0 4px ${confColor}` }} />
          <span className="text-xs font-mono font-semibold text-slate-200 truncate">
            {ac.callsign || ac.hex.toUpperCase()}
          </span>
        </div>
        <span className="text-xs text-slate-600 font-mono ml-3">
          {ac.typeCode || '----'}
        </span>
      </div>

      {/* Altitude */}
      <div className="col-span-3">
        <div className="flex items-center gap-0.5">
          {vrIcon}
          <span className="text-xs font-mono text-slate-400">
            {formatAltitude(ac.altitude)}
          </span>
        </div>
        <span className="text-xs text-slate-600 font-mono">
          {formatSpeed(ac.groundSpeed)}
        </span>
      </div>

      {/* Military score */}
      <div className="col-span-3 flex items-center">
        <div className="flex-1">
          <div className="h-1 rounded-full overflow-hidden bg-slate-800">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, ac.militaryScore / 2)}%`,
                background: confColor,
              }}
            />
          </div>
          <span className="text-xs font-mono" style={{ color: confColor }}>
            {ac.militaryScore}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <div className="col-span-1 flex items-center justify-end">
        <ChevronRight size={10} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
      </div>
    </motion.button>
  );
}

interface SortBtnProps {
  col: string;
  label: string;
  field: SortField;
  current: SortField;
  dir: SortDir;
  onClick: (f: SortField) => void;
}

function SortBtn({ col, label, field, current, dir, onClick }: SortBtnProps) {
  const active = current === field;
  return (
    <button
      onClick={() => onClick(field)}
      className={`${col} text-left text-xs font-mono flex items-center gap-0.5 transition-colors`}
      style={{ color: active ? '#38bdf8' : '#475569' }}
    >
      {label}
      {active && (dir === 'asc' ? <ArrowUp size={8} /> : <ArrowDown size={8} />)}
    </button>
  );
}
