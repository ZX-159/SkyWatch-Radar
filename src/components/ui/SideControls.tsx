import { motion } from 'framer-motion';
import { List, Layers, Filter, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useMapStore } from '../../stores/mapStore';
import type { PanelId } from '../../types/map';

interface SideControlsProps {
  onToggleList: () => void;
  listVisible: boolean;
}

interface ControlButton {
  icon: React.ReactNode;
  label: string;
  panelId?: PanelId;
  action?: () => void;
  active?: boolean;
  color?: string;
}

export function SideControls({ onToggleList, listVisible }: SideControlsProps) {
  const { togglePanel, panels } = useMapStore();
  const [collapsed, setCollapsed] = useState(false);

  const isVisible = (id: PanelId) => panels.find(p => p.id === id)?.visible ?? false;

  const buttons: ControlButton[] = [
    {
      icon: <List size={16} />,
      label: 'Flight List',
      action: onToggleList,
      active: listVisible,
      color: '#38bdf8',
    },
    {
      icon: <Layers size={16} />,
      label: 'Layers',
      panelId: 'layer-manager',
      color: '#38bdf8',
    },
    {
      icon: <Filter size={16} />,
      label: 'Filters',
      panelId: 'filter',
      color: '#a78bfa',
    },
    {
      icon: <BarChart2 size={16} />,
      label: 'Stats',
      panelId: 'stats',
      color: '#22c55e',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="absolute left-4 top-1/2 -translate-y-1/2 z-20"
    >
      <div className="relative">
        {/* Control buttons */}
        <div
          className="flex flex-col gap-1.5 rounded-xl p-1.5"
          style={{
            background: 'rgba(10, 14, 26, 0.92)',
            border: '1px solid rgba(14, 165, 233, 0.15)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {buttons.map((btn, i) => {
            const active = btn.action ? btn.active : (btn.panelId ? isVisible(btn.panelId) : false);
            return (
              <button
                key={i}
                onClick={() => {
                  if (btn.action) btn.action();
                  else if (btn.panelId) togglePanel(btn.panelId);
                }}
                title={btn.label}
                className="relative group w-9 h-9 flex items-center justify-center rounded-lg transition-all"
                style={{
                  background: active ? `${btn.color}20` : 'transparent',
                  border: active ? `1px solid ${btn.color}40` : '1px solid transparent',
                  color: active ? btn.color : '#475569',
                }}
              >
                {btn.icon}

                {/* Active dot */}
                {active && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: btn.color }} />
                )}

                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 rounded-lg text-xs font-mono whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: 'rgba(10, 14, 26, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e2e8f0',
                  }}>
                  {btn.label}
                </div>
              </button>
            );
          })}

          {/* Divider */}
          <div className="h-px bg-white/10 mx-1" />

          {/* Collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-all"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
