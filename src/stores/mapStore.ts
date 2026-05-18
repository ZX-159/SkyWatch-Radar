import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ViewMode, BaseLayer, MapViewState, OverlayLayer, UIPanel, PanelId } from '../types/map';

interface MapStoreState {
  viewMode: ViewMode;
  baseLayer: BaseLayer;
  viewState: MapViewState;
  overlayLayers: OverlayLayer[];
  panels: UIPanel[];
  isFullscreen: boolean;
  showMinimap: boolean;
  showStats: boolean;
  showRadarSweep: boolean;
  mapLoaded: boolean;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  setBaseLayer: (layer: BaseLayer) => void;
  setViewState: (state: Partial<MapViewState>) => void;
  toggleOverlayLayer: (id: string) => void;
  setOverlayOpacity: (id: string, opacity: number) => void;
  togglePanel: (id: PanelId) => void;
  setPanelVisible: (id: PanelId, visible: boolean) => void;
  toggleFullscreen: () => void;
  toggleMinimap: () => void;
  toggleStats: () => void;
  toggleRadarSweep: () => void;
  setMapLoaded: (loaded: boolean) => void;
}

const DEFAULT_OVERLAY_LAYERS: OverlayLayer[] = [
  { id: 'aircraft', name: 'All Aircraft', enabled: true, opacity: 1, category: 'aircraft' },
  { id: 'military', name: 'Military Only', enabled: false, opacity: 1, category: 'aircraft' },
  { id: 'trails', name: 'Flight Trails', enabled: true, opacity: 0.8, category: 'aircraft' },
  { id: 'airports', name: 'Airports', enabled: true, opacity: 0.9, category: 'infrastructure' },
  { id: 'fir', name: 'FIR Boundaries', enabled: false, opacity: 0.6, category: 'airspace' },
  { id: 'restricted', name: 'Restricted Airspace', enabled: false, opacity: 0.5, category: 'airspace' },
  { id: 'weather', name: 'Weather Radar', enabled: false, opacity: 0.7, category: 'weather' },
  { id: 'heatmap', name: 'Traffic Heatmap', enabled: false, opacity: 0.6, category: 'aircraft' },
  { id: 'coverage', name: 'ADS-B Coverage', enabled: false, opacity: 0.4, category: 'infrastructure' },
];

const DEFAULT_PANELS: UIPanel[] = [
  { id: 'search', visible: false, pinned: false },
  { id: 'aircraft-info', visible: false, pinned: false },
  { id: 'layer-manager', visible: false, pinned: false },
  { id: 'filter', visible: false, pinned: false },
  { id: 'stats', visible: true, pinned: true },
  { id: 'radar', visible: false, pinned: false },
  { id: 'settings', visible: false, pinned: false },
];

export const useMapStore = create<MapStoreState>()(
  subscribeWithSelector((set, _get) => ({
    viewMode: '2d-map',
    baseLayer: 'dark',
    viewState: {
      longitude: 0,
      latitude: 30,
      zoom: 2.5,
      pitch: 0,
      bearing: 0,
    },
    overlayLayers: DEFAULT_OVERLAY_LAYERS,
    panels: DEFAULT_PANELS,
    isFullscreen: false,
    showMinimap: false,
    showStats: true,
    showRadarSweep: true,
    mapLoaded: false,

    setViewMode: (mode) => set({ viewMode: mode }),
    setBaseLayer: (layer) => set({ baseLayer: layer }),
    setViewState: (state) => set(s => ({ viewState: { ...s.viewState, ...state } })),

    toggleOverlayLayer: (id) => set(s => ({
      overlayLayers: s.overlayLayers.map(l =>
        l.id === id ? { ...l, enabled: !l.enabled } : l
      )
    })),

    setOverlayOpacity: (id, opacity) => set(s => ({
      overlayLayers: s.overlayLayers.map(l =>
        l.id === id ? { ...l, opacity } : l
      )
    })),

    togglePanel: (id) => set(s => ({
      panels: s.panels.map(p =>
        p.id === id ? { ...p, visible: !p.visible } : p
      )
    })),

    setPanelVisible: (id, visible) => set(s => ({
      panels: s.panels.map(p =>
        p.id === id ? { ...p, visible } : p
      )
    })),

    toggleFullscreen: () => set(s => ({ isFullscreen: !s.isFullscreen })),
    toggleMinimap: () => set(s => ({ showMinimap: !s.showMinimap })),
    toggleStats: () => set(s => ({ showStats: !s.showStats })),
    toggleRadarSweep: () => set(s => ({ showRadarSweep: !s.showRadarSweep })),
    setMapLoaded: (loaded) => set({ mapLoaded: loaded }),
  }))
);
