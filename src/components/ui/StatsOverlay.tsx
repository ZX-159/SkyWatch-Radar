import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAircraftStore } from '../../stores/aircraftStore';
import { getMilitaryConfidenceColor } from '../../utils/militaryDetection';
import type { MilitaryConfidence } from '../../types/aircraft';

export function StatsOverlay() {
  const { totalCount, militaryCount, filteredAircraft, lastUpdate, isLoading, providerName } = useAircraftStore();
  const [radarAngle, setRadarAngle] = useState(0);
  const animRef = useRef<number>(0);
  const lastAngleRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Animate radar sweep
  useEffect(() => {
    const animate = (time: number) => {
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;
      lastAngleRef.current = (lastAngleRef.current + delta * 0.06) % 360;
      setRadarAngle(lastAngleRef.current);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Count by confidence level
  const confidenceCounts = filteredAircraft.reduce<Record<MilitaryConfidence, number>>(
    (acc, ac) => {
      acc[ac.militaryConfidence] = (acc[ac.militaryConfidence] || 0) + 1;
      return acc;
    },
    { civilian: 0, suspicious: 0, military_likely: 0, confirmed_military: 0 }
  );

  const confidenceLevels: { key: MilitaryConfidence; label: string }[] = [
    { key: 'confirmed_military', label: 'CONFIRMED' },
    { key: 'military_likely', label: 'MIL LIKELY' },
    { key: 'suspicious', label: 'SUSPICIOUS' },
    { key: 'civilian', label: 'CIVILIAN' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="absolute bottom-8 left-4 z-20 flex flex-col gap-2"
    >
      {/* Radar display */}
      <div
        className="rounded-xl p-3"
        style={{
          background: 'rgba(10, 14, 26, 0.92)',
          border: '1px solid rgba(14, 165, 233, 0.15)',
          backdropFilter: 'blur(16px)',
          width: '140px',
        }}
      >
        {/* Mini radar */}
        <div className="relative w-20 h-20 mx-auto mb-2">
          <svg viewBox="0 0 80 80" className="w-full h-full">
            {/* Radar rings */}
            {[20, 30, 40].map((r) => (
              <circle key={r} cx={40} cy={40} r={r}
                fill="none" stroke="rgba(14, 165, 233, 0.1)" strokeWidth="0.5" />
            ))}
            {/* Cross hairs */}
            <line x1="40" y1="0" x2="40" y2="80" stroke="rgba(14, 165, 233, 0.08)" strokeWidth="0.5" />
            <line x1="0" y1="40" x2="80" y2="40" stroke="rgba(14, 165, 233, 0.08)" strokeWidth="0.5" />

            {/* Sweep gradient */}
            <defs>
              <radialGradient id="radarGrad" cx="50%" cy="50%">
                <stop offset="0%" stopColor="rgba(0, 255, 136, 0.3)" />
                <stop offset="100%" stopColor="rgba(0, 255, 136, 0)" />
              </radialGradient>
            </defs>
            <path
              d={getSweepPath(40, 40, 38, radarAngle)}
              fill="url(#radarGrad)"
              style={{ transformOrigin: '40px 40px' }}
            />

            {/* Sweep line */}
            <line
              x1="40" y1="40"
              x2={40 + 38 * Math.cos((radarAngle - 90) * Math.PI / 180)}
              y2={40 + 38 * Math.sin((radarAngle - 90) * Math.PI / 180)}
              stroke="#00ff88"
              strokeWidth="1"
              opacity="0.8"
            />

            {/* Sample blips */}
            {filteredAircraft.slice(0, 15).map((ac, i) => {
              // Map aircraft positions to radar display
              const angle = (ac.lon + 180) / 360 * Math.PI * 2;
              const radius = ((90 - Math.abs(ac.lat)) / 90) * 35;
              const bx = 40 + radius * Math.cos(angle);
              const by = 40 + radius * Math.sin(angle);
              const color = getMilitaryConfidenceColor(ac.militaryConfidence);
              return (
                <circle key={i} cx={bx} cy={by} r={1.5}
                  fill={color} opacity={0.8} />
              );
            })}

            {/* Center dot */}
            <circle cx="40" cy="40" r="2" fill="rgba(14, 165, 233, 0.6)" />
          </svg>
        </div>

        {/* Stats */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500">CONTACTS</span>
            <span className="text-xs font-bold font-mono text-sky-400">{totalCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500">MILITARY</span>
            <span className="text-xs font-bold font-mono text-red-400">{militaryCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500">FILTER</span>
            <span className="text-xs font-mono text-slate-300">{filteredAircraft.length}</span>
          </div>
        </div>

        {/* Provider */}
        <div className="mt-2 pt-2 flex items-center gap-1.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
          <span className="text-xs font-mono text-slate-600 truncate">{providerName}</span>
        </div>
      </div>

      {/* Confidence legend */}
      <div
        className="rounded-xl p-3"
        style={{
          background: 'rgba(10, 14, 26, 0.92)',
          border: '1px solid rgba(14, 165, 233, 0.1)',
          backdropFilter: 'blur(16px)',
          width: '140px',
        }}
      >
        <div className="text-xs font-mono text-slate-500 mb-2">CLASSIFICATION</div>
        {confidenceLevels.map(({ key, label }) => {
          const count = confidenceCounts[key] || 0;
          const color = getMilitaryConfidenceColor(key);
          return (
            <div key={key} className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: color, boxShadow: `0 0 4px ${color}50` }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500 truncate" style={{ fontSize: '9px' }}>
                    {label}
                  </span>
                  <span className="text-xs font-mono" style={{ color, fontSize: '10px' }}>{count}</span>
                </div>
                <div className="h-0.5 rounded-full mt-0.5 overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full"
                    style={{
                      width: totalCount > 0 ? `${(count / totalCount) * 100}%` : '0%',
                      background: color,
                      opacity: 0.6,
                    }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function getSweepPath(cx: number, cy: number, r: number, angle: number): string {
  const startAngle = (angle - 90 - 45) * Math.PI / 180;
  const endAngle = (angle - 90) * Math.PI / 180;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
}
