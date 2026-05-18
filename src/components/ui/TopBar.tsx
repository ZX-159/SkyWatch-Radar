import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Layers, Filter, Maximize2, Minimize2,
  Radio, Map, Globe, SplitSquareHorizontal, ChevronDown,
  Shield
} from 'lucide-react';
import { useAircraftStore } from '../../stores/aircraftStore';
import { useMapStore } from '../../stores/mapStore';
import type { ViewMode, BaseLayer } from '../../types/map';

const VIEW_MODES: { id: ViewMode; icon: React.ReactNode; label: string }[] = [
  { id: '2d-map', icon: <Map size={14} />, label: '2D MAP' },
  { id: '3d-globe', icon: <Globe size={14} />, label: '3D GLOBE' },
  { id: 'split-view', icon: <SplitSquareHorizontal size={14} />, label: 'SPLIT' },
];

const BASE_LAYERS: { id: BaseLayer; label: string }[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'terrain', label: 'Terrain' },
  { id: 'tactical', label: 'Tactical' },
];

export function TopBar() {
  const {
    totalCount, militaryCount, lastUpdate, isLoading, error,
    isMilitaryMode, setMilitaryMode, setFilter,
  } = useAircraftStore();

  const {
    viewMode, setViewMode, baseLayer, setBaseLayer,
    togglePanel, panels, isFullscreen, toggleFullscreen,
    showRadarSweep,
  } = useMapStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const searchPanel = panels.find(p => p.id === 'search');
  const filterPanel = panels.find(p => p.id === 'filter');

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilter({ search: query });
  };

  const lastUpdateStr = lastUpdate
    ? new Date(lastUpdate).toLocaleTimeString('en-US', { hour12: false })
    : '--:--:--';

  return (
    <div className="absolute top-0 left-0 right-0 z-20 flex items-stretch"
      style={{ height: '52px' }}>

      {/* Main bar */}
      <div className="flex-1 flex items-center px-4 gap-3"
        style={{
          background: 'rgba(10, 14, 26, 0.96)',
          borderBottom: '1px solid rgba(14, 165, 233, 0.15)',
          backdropFilter: 'blur(20px)',
        }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
              <Radio size={14} className="text-white" />
            </div>
            {showRadarSweep && (
              <div className="absolute inset-0 rounded-lg animate-ping opacity-40"
                style={{ background: 'rgba(14, 165, 233, 0.5)' }} />
            )}
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-bold text-white tracking-widest leading-none">SKYWATCH-RADAR</div>
            <div className="text-xs text-sky-400/70 font-mono tracking-wider leading-none">TACTICAL</div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-white/10 hidden sm:block" />

        {/* View mode switcher */}
        <div className="flex items-center gap-0.5 rounded-lg p-0.5 hidden sm:flex"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {VIEW_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all"
              style={{
                background: viewMode === mode.id ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                color: viewMode === mode.id ? '#38bdf8' : '#64748b',
                border: viewMode === mode.id ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid transparent',
              }}
            >
              {mode.icon}
              <span className="hidden md:inline">{mode.label}</span>
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Stats display */}
        <div className="flex items-center gap-3 hidden md:flex">
          <StatChip
            label="TOTAL"
            value={totalCount.toLocaleString()}
            color="#38bdf8"
            pulse={isLoading}
          />
          <StatChip
            label="MILITARY"
            value={militaryCount.toLocaleString()}
            color="#ef4444"
          />
          <div className="text-xs font-mono text-slate-600">
            {lastUpdateStr}
          </div>
          {error && (
            <div className="text-xs text-amber-400 font-mono max-w-32 truncate">{error}</div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-white/10 hidden md:block" />

        {/* Military mode toggle */}
        <button
          onClick={() => setMilitaryMode(!isMilitaryMode)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all"
          style={{
            background: isMilitaryMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
            border: isMilitaryMode ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.08)',
            color: isMilitaryMode ? '#ef4444' : '#64748b',
          }}
          title="Toggle Military-only mode"
        >
          <Shield size={13} />
          <span className="hidden sm:inline">MIL</span>
        </button>

        {/* Search button */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
          style={{
            background: searchOpen ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255,255,255,0.05)',
            border: searchOpen ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid rgba(255,255,255,0.08)',
            color: searchOpen ? '#38bdf8' : '#64748b',
          }}
        >
          <Search size={13} />
          <span className="hidden sm:inline">SEARCH</span>
        </button>

        {/* Layer button */}
        <div className="relative">
          <button
            onClick={() => setLayerMenuOpen(!layerMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
            style={{
              background: layerMenuOpen ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255,255,255,0.05)',
              border: layerMenuOpen ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid rgba(255,255,255,0.08)',
              color: layerMenuOpen ? '#38bdf8' : '#64748b',
            }}
          >
            <Layers size={13} />
            <ChevronDown size={10} />
          </button>

          <AnimatePresence>
            {layerMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-40 rounded-xl overflow-hidden z-50"
                style={{
                  background: 'rgba(10, 14, 26, 0.98)',
                  border: '1px solid rgba(14, 165, 233, 0.2)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="p-2">
                  <div className="text-xs font-mono text-slate-500 px-2 py-1">BASE LAYER</div>
                  {BASE_LAYERS.map(l => (
                    <button
                      key={l.id}
                      onClick={() => { setBaseLayer(l.id); setLayerMenuOpen(false); }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2"
                      style={{
                        background: baseLayer === l.id ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                        color: baseLayer === l.id ? '#38bdf8' : '#94a3b8',
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: baseLayer === l.id ? '#38bdf8' : '#334155' }} />
                      {l.label}
                    </button>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="p-2">
                    <button
                      onClick={() => { togglePanel('layer-manager'); setLayerMenuOpen(false); }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
                    >
                      Overlay Manager →
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => togglePanel('filter')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
          style={{
            background: (filterPanel?.visible) ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.05)',
            border: (filterPanel?.visible) ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(255,255,255,0.08)',
            color: (filterPanel?.visible) ? '#a78bfa' : '#64748b',
          }}
        >
          <Filter size={13} />
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      </div>

      {/* Search bar - animated */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '280px' }}
            exit={{ opacity: 0, width: 0 }}
            className="overflow-hidden flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(14, 165, 233, 0.15)' }}
          >
            <div className="h-full flex items-center px-3 gap-2"
              style={{ background: 'rgba(14, 165, 233, 0.08)', borderLeft: '1px solid rgba(14, 165, 233, 0.2)' }}>
              <Search size={14} className="text-sky-400 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="ICAO, callsign, reg, type..."
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none font-mono"
                onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
              />
              {searchQuery && (
                <button onClick={() => handleSearch('')} className="text-slate-500 hover:text-slate-300">
                  <span className="text-xs">✕</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface StatChipProps {
  label: string;
  value: string;
  color: string;
  pulse?: boolean;
}

function StatChip({ label, value, color, pulse }: StatChipProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        {pulse && (
          <div className="absolute inset-0 w-1.5 h-1.5 rounded-full animate-ping" style={{ background: color }} />
        )}
      </div>
      <span className="text-xs font-mono text-slate-500">{label}</span>
      <span className="text-xs font-bold font-mono" style={{ color }}>{value}</span>
    </div>
  );
}
