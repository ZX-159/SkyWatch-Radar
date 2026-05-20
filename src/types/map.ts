export type ViewMode = '3d-globe' | '2d-map' | 'split';

export type BaseLayer =
  | 'dark'
  | 'satellite'
  | 'terrain'
  | 'light'
  | 'tactical';

export interface OverlayLayer {
  id: string;
  name: string;
  enabled: boolean;
  opacity: number;
  category: 'aircraft' | 'airspace' | 'weather' | 'infrastructure';
}

export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface GlobeConfig {
  atmosphere: boolean;
  stars: boolean;
  terrain: boolean;
  fog: boolean;
}

export interface MapConfig {
  terrain: boolean;
  buildings3d: boolean;
  labels: boolean;
}

export type PanelId =
  | 'aircraft-info'
  | 'layer-manager'
  | 'search'
  | 'radar'
  | 'filter'
  | 'stats'
  | 'settings';

export interface UIPanel {
  id: PanelId;
  visible: boolean;
  pinned: boolean;
  position?: { x: number; y: number };
}
