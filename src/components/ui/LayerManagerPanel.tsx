import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Eye, EyeOff } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import type { OverlayLayer } from '../../types/map';

interface LayerManagerPanelProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  aircraft: '#0ea5e9',
  airspace: '#8b5cf6',
  weather: '#22c55e',
  infrastructure: '#f59e0b',
};

const CATEGORY_LABELS: Record<string, string> = {
  aircraft: 'AIRCRAFT',
  airspace: 'AIRSPACE',
  weather: 'WEATHER',
  infrastructure: 'INFRA',
};

export function LayerManagerPanel({ visible, onClose }: LayerManagerPanelProps) {
  const { overlayLayers, toggleOverlayLayer, setOverlayOpacity } = useMapStore();

  const categories = ['aircraft', 'airspace', 'weather', 'infrastructure'];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute right-4 top-16 w-64 z-30"
        >
          <div className="rounded-xl overflow-hidden"
            style={{
              background: 'rgba(10, 14, 26, 0.97)',
              border: '1px solid rgba(14, 165, 233, 0.15)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(14, 165, 233, 0.12)' }}>
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-sky-400" />
                <span className="text-sm font-mono font-bold text-white">OVERLAYS</span>
              </div>
              <button onClick={onClose}
                className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all">
                <X size={12} />
              </button>
            </div>

            {/* Layer groups */}
            <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
              {categories.map(cat => {
                const layers = overlayLayers.filter(l => l.category === cat);
                if (layers.length === 0) return null;
                return (
                  <div key={cat} className="mb-3">
                    <div className="px-2 py-1 mb-1">
                      <span className="text-xs font-mono font-semibold"
                        style={{ color: CATEGORY_COLORS[cat] }}>
                        {CATEGORY_LABELS[cat]}
                      </span>
                    </div>
                    {layers.map(layer => (
                      <LayerRow
                        key={layer.id}
                        layer={layer}
                        color={CATEGORY_COLORS[cat]}
                        onToggle={() => toggleOverlayLayer(layer.id)}
                        onOpacity={(v) => setOverlayOpacity(layer.id, v)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Footer note */}
            <div className="px-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs font-mono text-slate-600">
                More layers coming in Phase 2
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface LayerRowProps {
  layer: OverlayLayer;
  color: string;
  onToggle: () => void;
  onOpacity: (v: number) => void;
}

function LayerRow({ layer, color, onToggle, onOpacity }: LayerRowProps) {
  return (
    <div className="px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all">
      <div className="flex items-center gap-2">
        <button onClick={onToggle} className="flex-shrink-0">
          {layer.enabled
            ? <Eye size={13} style={{ color }} />
            : <EyeOff size={13} className="text-slate-600" />
          }
        </button>
        <span className="flex-1 text-xs font-mono"
          style={{ color: layer.enabled ? '#e2e8f0' : '#475569' }}>
          {layer.name}
        </span>
        <div className="w-1.5 h-1.5 rounded-full"
          style={{ background: layer.enabled ? color : '#334155' }} />
      </div>

      {layer.enabled && (
        <div className="mt-1.5 ml-5">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={layer.opacity}
            onChange={e => onOpacity(parseFloat(e.target.value))}
            className="w-full h-1 accent-sky-500 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
