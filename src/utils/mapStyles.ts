import type { BaseLayer } from '../types/map';

// Map style URLs from various free providers
export function getMapStyleUrl(layer: BaseLayer): string {
  // Use Stadia Maps (requires no key for localhost usually) or fallback to reliable sources
  const styleUrls: Record<BaseLayer, string> = {
    dark: 'https://tiles.openfreemap.org/styles/dark',
    light: 'https://tiles.openfreemap.org/styles/liberty',
    satellite: 'https://tiles.openfreemap.org/styles/bright',
    terrain: 'https://tiles.openfreemap.org/styles/fiord-color',
    tactical: 'https://tiles.openfreemap.org/styles/dark',
  };

  // Fallback to demotiles if everything fails
  return styleUrls[layer] || 'https://demotiles.maplibre.org/style.json';
}

// Custom tactical overlay style additions
export const TACTICAL_COLORS = {
  background: '#0a0e1a',
  surface: '#111827',
  surfaceElevated: '#1a2235',
  border: '#1e2d45',
  borderSubtle: '#162032',
  accent: '#0ea5e9',
  accentGlow: 'rgba(14, 165, 233, 0.3)',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#22c55e',
  military: '#ef4444',
  militaryLikely: '#f97316',
  suspicious: '#eab308',
  civilian: '#22c55e',
  text: '#e2e8f0',
  textMuted: '#64748b',
  textDim: '#334155',
  gridLine: 'rgba(14, 165, 233, 0.08)',
  radarGreen: '#00ff88',
  radarGlow: 'rgba(0, 255, 136, 0.15)',
};
