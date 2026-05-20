import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plane, Navigation, Gauge, TrendingUp,
  Shield, Clock, Target,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useAircraftStore } from '../../stores/aircraftStore';
import { useMapStore } from '../../stores/mapStore';
import { getMilitaryConfidenceColor, getMilitaryConfidenceLabel } from '../../utils/militaryDetection';
import { formatAltitude, formatSpeed, formatVerticalRate } from '../../utils/aircraftTransform';
import type { Aircraft } from '../../types/aircraft';

export function AircraftInfoPanel() {
  const { selectedHex, aircraft, selectAircraft } = useAircraftStore();
  const { panels, setPanelVisible } = useMapStore();
  const isVisible = panels.find(p => p.id === 'aircraft-info')?.visible ?? false;

  const [ac, setAc] = useState<Aircraft | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [age, setAge] = useState(0);

  useEffect(() => {
    if (!selectedHex) {
      setAc(null);
      return;
    }
    const found = aircraft.get(selectedHex);
    setAc(found || null);
  }, [selectedHex, aircraft]);

  // Update age counter
  useEffect(() => {
    if (!ac) return;
    const interval = setInterval(() => {
      setAge(Math.floor((Date.now() - ac.lastUpdate) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [ac]);

  const handleClose = () => {
    setPanelVisible('aircraft-info', false);
    selectAircraft(null);
  };

  const confColor = ac ? getMilitaryConfidenceColor(ac.militaryConfidence) : '#22c55e';
  const confLabel = ac ? getMilitaryConfidenceLabel(ac.militaryConfidence) : '';

  return (
    <AnimatePresence>
      {isVisible && ac && (
        <motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring' as const, damping: 25, stiffness: 200 }}
          className="absolute top-16 right-4 w-80 z-30"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        >
          <div className="rounded-xl overflow-hidden shadow-2xl"
            style={{
              background: 'rgba(10, 14, 26, 0.95)',
              border: '1px solid rgba(14, 165, 233, 0.2)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Header */}
            <div className="relative p-4 pb-3"
              style={{
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(10, 14, 26, 0))',
                borderBottom: '1px solid rgba(14, 165, 233, 0.15)',
              }}
            >
              {/* Military confidence badge */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: confColor, boxShadow: `0 0 6px ${confColor}` }}
                  />
                  <span className="text-xs font-mono font-semibold tracking-widest"
                    style={{ color: confColor }}>
                    {confLabel}
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Callsign + Type */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${confColor}20`, border: `1px solid ${confColor}40` }}>
                  <Plane size={20} style={{ color: confColor }} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white font-mono leading-none">
                    {ac.callsign || ac.hex.toUpperCase()}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {ac.registration && (
                      <span className="text-xs text-slate-400">{ac.registration}</span>
                    )}
                    {ac.typeCode && (
                      <span className="text-xs text-sky-400 font-mono">{ac.typeCode}</span>
                    )}
                  </div>
                  {ac.description && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{ac.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Telemetry Grid */}
            <div className="p-4 grid grid-cols-2 gap-3">
              <TelemetryCard
                icon={<TrendingUp size={14} />}
                label="ALTITUDE"
                value={formatAltitude(ac.altitude)}
                sub={ac.verticalRate !== 0 ? formatVerticalRate(ac.verticalRate) : 'Level'}
                subColor={ac.verticalRate > 200 ? '#22c55e' : ac.verticalRate < -200 ? '#ef4444' : '#64748b'}
                accent="#0ea5e9"
              />
              <TelemetryCard
                icon={<Gauge size={14} />}
                label="SPEED"
                value={formatSpeed(ac.groundSpeed)}
                sub={ac.onGround ? 'On Ground' : 'GS'}
                accent="#0ea5e9"
              />
              <TelemetryCard
                icon={<Navigation size={14} />}
                label="HEADING"
                value={`${Math.round(ac.track)}°`}
                sub={getHeadingLabel(ac.track)}
                accent="#8b5cf6"
              />
              <TelemetryCard
                icon={<Target size={14} />}
                label="SQUAWK"
                value={ac.squawk || '----'}
                sub={getSquawkLabel(ac.squawk)}
                subColor={isEmergencySquawk(ac.squawk) ? '#ef4444' : undefined}
                accent={isEmergencySquawk(ac.squawk) ? '#ef4444' : '#64748b'}
              />
            </div>

            {/* Position */}
            <div className="px-4 pb-3">
              <div className="rounded-lg p-2.5 text-xs font-mono"
                style={{ background: 'rgba(14, 165, 233, 0.06)', border: '1px solid rgba(14, 165, 233, 0.1)' }}>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>POSITION</span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    <span style={{ color: age > 30 ? '#f59e0b' : '#22c55e' }}>{age}s ago</span>
                  </span>
                </div>
                <div className="text-slate-200">
                  {ac.lat.toFixed(4)}° {ac.lat >= 0 ? 'N' : 'S'} / {Math.abs(ac.lon).toFixed(4)}° {ac.lon >= 0 ? 'E' : 'W'}
                </div>
              </div>
            </div>

            {/* Military Intel */}
            {ac.militaryConfidence !== 'civilian' && ac.militaryReasons.length > 0 && (
              <div className="px-4 pb-3">
                <div className="rounded-lg p-3"
                  style={{ background: `${confColor}10`, border: `1px solid ${confColor}25` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={12} style={{ color: confColor }} />
                    <span className="text-xs font-mono font-semibold" style={{ color: confColor }}>
                      INTEL SIGNALS
                    </span>
                    <span className="ml-auto text-xs text-slate-500">
                      Score: {ac.militaryScore}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {ac.militaryReasons.slice(0, 4).map((reason, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                        <span style={{ color: confColor }} className="mt-0.5">▸</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full px-4 py-2 flex items-center justify-between text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="font-mono">EXTENDED DATA</span>
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-1.5">
                    <ExtRow label="ICAO HEX" value={ac.hex.toUpperCase()} mono />
                    {ac.operator && <ExtRow label="OPERATOR" value={ac.operator} />}
                    {ac.navModes.length > 0 && (
                      <ExtRow label="NAV MODES" value={ac.navModes.join(', ').toUpperCase()} mono />
                    )}
                    {ac.selectedAltitude > 0 && (
                      <ExtRow label="SEL ALT" value={formatAltitude(ac.selectedAltitude)} />
                    )}
                    {ac.emergency && ac.emergency !== 'none' && (
                      <ExtRow label="EMERGENCY" value={ac.emergency.toUpperCase()} valueColor="#ef4444" />
                    )}
                    <ExtRow label="MESSAGES" value={ac.messages.toLocaleString()} />
                    <ExtRow label="RSSI" value={`${ac.rssi.toFixed(1)} dBFS`} />
                    {ac.roll !== 0 && (
                      <ExtRow label="ROLL" value={`${ac.roll.toFixed(1)}°`} />
                    )}
                    <ExtRow label="FLAGS" value={[
                      ac.isPIA && 'PIA',
                      ac.isLADD && 'LADD',
                      ac.onGround && 'GND',
                    ].filter(Boolean).join(' ') || 'None'} mono />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface TelemetryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  accent?: string;
}

function TelemetryCard({ icon, label, value, sub, subColor, accent = '#0ea5e9' }: TelemetryCardProps) {
  return (
    <div className="rounded-lg p-2.5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span style={{ color: accent }}>{icon}</span>
        <span className="text-xs font-mono text-slate-500">{label}</span>
      </div>
      <div className="text-base font-bold text-white font-mono leading-none">{value}</div>
      {sub && (
        <div className="text-xs mt-1 font-mono" style={{ color: subColor || '#64748b' }}>{sub}</div>
      )}
    </div>
  );
}

interface ExtRowProps {
  label: string;
  value: string;
  mono?: boolean;
  valueColor?: string;
}

function ExtRow({ label, value, mono, valueColor }: ExtRowProps) {
  return (
    <div className="flex items-center justify-between text-xs py-1"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-slate-500 font-mono">{label}</span>
      <span className={`text-slate-300 ${mono ? 'font-mono' : ''}`}
        style={valueColor ? { color: valueColor } : {}}>
        {value}
      </span>
    </div>
  );
}

function getHeadingLabel(track: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(track / 22.5) % 16];
}

function getSquawkLabel(squawk: string): string {
  if (!squawk) return '';
  if (squawk === '7700') return 'EMERGENCY';
  if (squawk === '7600') return 'RADIO FAIL';
  if (squawk === '7500') return 'HIJACK';
  if (squawk === '1200') return 'VFR US';
  if (squawk === '2000') return 'VFR IFR';
  if (squawk === '0000') return 'SPECIAL';
  return 'XPDR';
}

function isEmergencySquawk(squawk: string): boolean {
  return ['7700', '7600', '7500'].includes(squawk);
}
