import React from 'react';
import { useAircraftStore } from '../../stores/aircraftStore';
import { useMapStore } from '../../stores/mapStore';

export function StatusBar() {
  const { totalCount, militaryCount, lastUpdate, isLoading, error, providerName, filteredAircraft } = useAircraftStore();
  const { viewState, viewMode } = useMapStore();

  const timeStr = lastUpdate
    ? new Date(lastUpdate).toLocaleTimeString('en-US', { hour12: false })
    : '--:--:--';

  const coords = `${viewState.latitude.toFixed(3)}° ${viewState.latitude >= 0 ? 'N' : 'S'} / ${Math.abs(viewState.longitude).toFixed(3)}° ${viewState.longitude >= 0 ? 'E' : 'W'}`;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-20 h-7 flex items-center px-4 gap-4"
      style={{
        background: 'rgba(10, 14, 26, 0.95)',
        borderTop: '1px solid rgba(14, 165, 233, 0.1)',
      }}
    >
      {/* Live indicator */}
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
        <span className="text-xs font-mono text-slate-500">
          {isLoading ? 'UPDATING' : 'LIVE'}
        </span>
      </div>

      <Divider />

      {/* Counts */}
      <span className="text-xs font-mono text-slate-500">
        <span className="text-sky-400">{filteredAircraft.length}</span>
        /{totalCount} shown •
        <span className="text-red-400 ml-1">{militaryCount} mil</span>
      </span>

      <Divider />

      {/* Last update */}
      <span className="text-xs font-mono text-slate-600">UPDT {timeStr}</span>

      <Divider />

      {/* View mode */}
      <span className="text-xs font-mono text-slate-600 uppercase">{viewMode.replace('-', ' ')}</span>

      <Divider />

      {/* Coordinates */}
      <span className="text-xs font-mono text-slate-600">{coords}</span>

      <Divider />

      {/* Zoom */}
      <span className="text-xs font-mono text-slate-600">
        Z{viewState.zoom.toFixed(1)}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Provider */}
      <span className="text-xs font-mono text-slate-600">{providerName}</span>

      <Divider />

      {/* Error */}
      {error && (
        <span className="text-xs font-mono text-amber-400 truncate max-w-48">{error}</span>
      )}

      {/* System label */}
      <span className="text-[10px] font-mono text-slate-700">SKYWATCH-RADAR_PLATFORM_V1.1_STABLE</span>
    </div>
  );
}

function Divider() {
  return <div className="h-3 w-px bg-white/10" />;
}
