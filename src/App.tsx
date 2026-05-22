import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TacticalMap } from './components/map/TacticalMap';
import { GlobeView } from './components/map/GlobeView';
import { TopBar } from './components/ui/TopBar';
import { AircraftInfoPanel } from './components/ui/AircraftInfoPanel';
import { AircraftListPanel } from './components/ui/AircraftListPanel';
import { LayerManagerPanel } from './components/ui/LayerManagerPanel';
import { FilterPanel } from './components/ui/FilterPanel';
import { StatsOverlay } from './components/ui/StatsOverlay';
import { SideControls } from './components/ui/SideControls';
import { StatusBar } from './components/ui/StatusBar';
import { useAircraftFeed } from './hooks/useAircraftFeed';
import { useMapStore } from './stores/mapStore';
import { motion, AnimatePresence } from 'framer-motion';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 2,
    },
  },
});

function TacticalPlatform() {
  const { panels, togglePanel, viewMode } = useMapStore();
  const [listVisible, setListVisible] = useState(false);

  // Start aircraft data feed
  useAircraftFeed();

  const layerPanel = panels.find(p => p.id === 'layer-manager');
  const filterPanel = panels.find(p => p.id === 'filter');

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none"
      style={{ background: '#0a0e1a', fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}
    >
      {/* Primary map view */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          {viewMode === '2d-map' && (
            <motion.div key="2d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
              <TacticalMap className="w-full h-full" />
            </motion.div>
          )}
          {viewMode === '3d-globe' && (
            <motion.div key="3d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
              <GlobeView className="w-full h-full" />
            </motion.div>
          )}
          {viewMode === 'split-view' && (
            <motion.div key="split" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex w-full h-full">
              <TacticalMap className="flex-1 border-r border-sky-500/20" />
              <GlobeView className="flex-1" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Top status bar (52px high) */}
      <TopBar />

      {/* Bottom status bar (28px high) */}
      <StatusBar />

      {/* Left side panel controls - centered vertically */}
      <div className="absolute left-0 top-14 bottom-8 flex flex-col justify-center pointer-events-none">
        <div className="pointer-events-auto ml-4">
          <SideControls
            onToggleList={() => setListVisible(v => !v)}
            listVisible={listVisible}
          />
        </div>
      </div>

      {/* Flight list panel (left side) */}
      <div className="absolute left-16 top-14 bottom-8 pointer-events-none">
        <div className="pointer-events-auto h-full">
          <AircraftListPanel
            visible={listVisible}
            onClose={() => setListVisible(false)}
          />
        </div>
      </div>

      {/* Stats overlay - bottom left above status bar */}
      <div className="absolute bottom-8 left-16 pointer-events-none">
        <div className="pointer-events-auto">
          <StatsOverlay />
        </div>
      </div>

      {/* Right side panels container - ensure they are properly stacked and not overlapping */}
      <div className="absolute top-16 right-4 bottom-10 pointer-events-none flex flex-col items-end gap-4 z-30 overflow-hidden">
        <div className="pointer-events-auto flex-shrink-0">
          <AircraftInfoPanel />
        </div>

        <div className="pointer-events-auto flex-1 flex flex-col gap-4 overflow-hidden">
          <LayerManagerPanel
            visible={layerPanel?.visible ?? false}
            onClose={() => togglePanel('layer-manager')}
          />
          <FilterPanel
            visible={filterPanel?.visible ?? false}
            onClose={() => togglePanel('filter')}
          />
        </div>
      </div>

      {/* Boot overlay */}
      <BootSequence />
    </div>
  );
}

function BootSequence() {
  const [booting, setBooting] = useState(true);
  const [step, setStep] = useState(0);

  const steps = [
    'INITIALIZING TACTICAL SYSTEMS...',
    'CONNECTING ADS-B NETWORK...',
    'LOADING GEOSPATIAL ENGINE...',
    'CALIBRATING MILITARY DETECTION...',
    'SYSTEMS ONLINE',
  ];

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach((_, i) => {
      timers.push(setTimeout(() => setStep(i), i * 400));
    });
    timers.push(setTimeout(() => setBooting(false), steps.length * 400 + 600));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <AnimatePresence>
      {booting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: '#0a0e1a' }}
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            {/* Radar animation */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {[20, 35, 48].map(r => (
                  <circle key={r} cx="50" cy="50" r={r}
                    fill="none" stroke="rgba(14, 165, 233, 0.15)" strokeWidth="0.8" />
                ))}
                <line x1="50" y1="2" x2="50" y2="98" stroke="rgba(14, 165, 233, 0.1)" strokeWidth="0.5" />
                <line x1="2" y1="50" x2="98" y2="50" stroke="rgba(14, 165, 233, 0.1)" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="3" fill="#0ea5e9" opacity="0.8" />
              </svg>

              {/* Rotating sweep */}
              <div className="absolute inset-0">
                <svg viewBox="0 0 100 100" className="w-full h-full animate-spin" style={{ animationDuration: '2s' }}>
                  <defs>
                    <radialGradient id="bootSweep" cx="50%" cy="50%">
                      <stop offset="0%" stopColor="rgba(0, 255, 136, 0.4)" />
                      <stop offset="100%" stopColor="rgba(0, 255, 136, 0)" />
                    </radialGradient>
                  </defs>
                  <path d="M 50 50 L 50 2 A 48 48 0 0 1 95 50 Z" fill="url(#bootSweep)" />
                  <line x1="50" y1="50" x2="50" y2="2" stroke="#00ff88" strokeWidth="1" opacity="0.8" />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-[0.4em] text-white mb-1">SKYWATCH-RADAR</h1>
            <p className="text-sm font-mono tracking-widest text-sky-400/70">TACTICAL FLIGHT INTELLIGENCE</p>
          </motion.div>

          {/* Boot log */}
          <div className="space-y-1.5 text-center">
            {steps.slice(0, step + 1).map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-mono"
                style={{ color: i === step ? '#38bdf8' : '#334155' }}
              >
                {i < step ? '✓ ' : i === step ? '▶ ' : '  '}{s}
              </motion.div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-8 w-64 h-0.5 rounded-full overflow-hidden" style={{ background: '#1e293b' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)' }}
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min(100, ((step + 1) / steps.length) * 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TacticalPlatform />
    </QueryClientProvider>
  );
}
