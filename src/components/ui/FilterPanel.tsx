import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, RotateCcw } from 'lucide-react';
import { useAircraftStore } from '../../stores/aircraftStore';
import type { MilitaryConfidence } from '../../types/aircraft';

interface FilterPanelProps {
  visible: boolean;
  onClose: () => void;
}

const CONFIDENCE_OPTIONS: { value: MilitaryConfidence | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: '#64748b' },
  { value: 'confirmed_military', label: 'Confirmed Mil', color: '#ef4444' },
  { value: 'military_likely', label: 'Mil Likely', color: '#f97316' },
  { value: 'suspicious', label: 'Suspicious', color: '#eab308' },
  { value: 'civilian', label: 'Civilian', color: '#22c55e' },
];

export function FilterPanel({ visible, onClose }: FilterPanelProps) {
  const { filter, setFilter, resetFilters } = useAircraftStore();

  const handleReset = () => {
    resetFilters();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          className="w-72"
        >
          <div className="rounded-xl overflow-hidden"
            style={{
              background: 'rgba(10, 14, 26, 0.97)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.12)' }}>
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-violet-400" />
                <span className="text-sm font-mono font-bold text-white">FILTERS</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleReset}
                  className="flex items-center gap-1 text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors">
                  <RotateCcw size={10} /> RESET
                </button>
                <button onClick={onClose}
                  className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-slate-300 hover:bg-white/5">
                  <X size={12} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-96 overflow-y-auto custom-scrollbar">

              {/* Military only toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-semibold text-slate-300">Military Only</div>
                  <div className="text-xs text-slate-600">Show only military aircraft</div>
                </div>
                <button
                  onClick={() => setFilter({ militaryOnly: !filter.militaryOnly })}
                  className="relative w-10 h-5 rounded-full transition-all"
                  style={{ background: filter.militaryOnly ? '#ef4444' : '#1e293b' }}
                >
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ transform: filter.militaryOnly ? 'translateX(20px)' : 'translateX(0)' }} />
                </button>
              </div>

              {/* Hide on ground */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-semibold text-slate-300">Hide Ground Traffic</div>
                  <div className="text-xs text-slate-600">Exclude aircraft on ground</div>
                </div>
                <button
                  onClick={() => setFilter({ onGroundHidden: !filter.onGroundHidden })}
                  className="relative w-10 h-5 rounded-full transition-all"
                  style={{ background: filter.onGroundHidden ? '#0ea5e9' : '#1e293b' }}
                >
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{ transform: filter.onGroundHidden ? 'translateX(20px)' : 'translateX(0)' }} />
                </button>
              </div>

              {/* Confidence filter */}
              <div>
                <div className="text-xs font-mono font-semibold text-slate-400 mb-2">CLASSIFICATION</div>
                <div className="flex flex-wrap gap-1.5">
                  {CONFIDENCE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFilter({ militaryConfidence: opt.value })}
                      className="px-2 py-1 rounded-lg text-xs font-mono transition-all"
                      style={{
                        background: filter.militaryConfidence === opt.value ? `${opt.color}25` : 'rgba(255,255,255,0.05)',
                        border: filter.militaryConfidence === opt.value ? `1px solid ${opt.color}60` : '1px solid rgba(255,255,255,0.08)',
                        color: filter.militaryConfidence === opt.value ? opt.color : '#64748b',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Altitude range */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold text-slate-400">ALTITUDE RANGE</span>
                  <span className="text-xs font-mono text-slate-500">
                    {(filter.minAltitude / 1000).toFixed(0)}k – {(filter.maxAltitude / 1000).toFixed(0)}k ft
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-8">MIN</span>
                    <input type="range" min="0" max="60000" step="1000"
                      value={filter.minAltitude}
                      onChange={e => setFilter({ minAltitude: parseInt(e.target.value) })}
                      className="flex-1 h-1 accent-violet-500 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-8">MAX</span>
                    <input type="range" min="0" max="60000" step="1000"
                      value={filter.maxAltitude}
                      onChange={e => setFilter({ maxAltitude: parseInt(e.target.value) })}
                      className="flex-1 h-1 accent-violet-500 cursor-pointer" />
                  </div>
                </div>
              </div>

              {/* Speed range */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold text-slate-400">SPEED RANGE</span>
                  <span className="text-xs font-mono text-slate-500">
                    {filter.minSpeed} – {filter.maxSpeed} kts
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-8">MIN</span>
                    <input type="range" min="0" max="1500" step="10"
                      value={filter.minSpeed}
                      onChange={e => setFilter({ minSpeed: parseInt(e.target.value) })}
                      className="flex-1 h-1 accent-violet-500 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-8">MAX</span>
                    <input type="range" min="0" max="1500" step="10"
                      value={filter.maxSpeed}
                      onChange={e => setFilter({ maxSpeed: parseInt(e.target.value) })}
                      className="flex-1 h-1 accent-violet-500 cursor-pointer" />
                  </div>
                </div>
              </div>

              {/* Type code */}
              <div>
                <div className="text-xs font-mono font-semibold text-slate-400 mb-2">AIRCRAFT TYPE</div>
                <input
                  type="text"
                  value={filter.typeCode}
                  onChange={e => setFilter({ typeCode: e.target.value })}
                  placeholder="B738, A320, F16..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 transition-all"
                />
              </div>

              {/* Squawk */}
              <div>
                <div className="text-xs font-mono font-semibold text-slate-400 mb-2">SQUAWK</div>
                <input
                  type="text"
                  value={filter.squawk}
                  onChange={e => setFilter({ squawk: e.target.value })}
                  placeholder="7700, 7600..."
                  maxLength={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-violet-500/50 transition-all"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
