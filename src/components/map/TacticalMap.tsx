import { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAircraftStore } from '../../stores/aircraftStore';
import { useMapStore } from '../../stores/mapStore';
import { getMapStyleUrl } from '../../utils/mapStyles';
import { getMilitaryConfidenceColor } from '../../utils/militaryDetection';
import { getAltitudeColor } from '../../utils/aircraftTransform';
import { airportService } from '../../services/airportService';

const AIRCRAFT_SOURCE = 'aircraft-positions';
const TRAIL_SOURCE = 'aircraft-trails';
const AIRPORT_SOURCE = 'airports';
const WEATHER_SOURCE = 'weather';

function createAircraftSVG(color: string, size: number = 32): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
    <polygon points="16,2 20,22 16,18 12,22" fill="${color}" stroke="rgba(0,0,0,0.6)" stroke-width="1"/>
    <polygon points="16,10 28,18 26,20 16,16 6,20 4,18" fill="${color}" stroke="rgba(0,0,0,0.6)" stroke-width="1"/>
    <polygon points="16,16 22,26 16,24 10,26" fill="${color}" stroke="rgba(0,0,0,0.6)" stroke-width="0.5" opacity="0.8"/>
  </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

interface TacticalMapProps {
  className?: string;
}

export function TacticalMap({ className = '' }: TacticalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const iconsLoadedRef = useRef(false);

  const { filteredAircraft, selectedHex, selectAircraft } = useAircraftStore();
  const { baseLayer, viewState, overlayLayers, setViewState, setMapLoaded, setPanelVisible } = useMapStore();

  const styleUrl = getMapStyleUrl(baseLayer);

  const initializeSources = useCallback((map: maplibregl.Map) => {
    // Weather radar source (RainViewer)
    if (!map.getSource(WEATHER_SOURCE)) {
      map.addSource(WEATHER_SOURCE, {
        type: 'raster',
        tiles: [
          'https://tilecache.rainviewer.com/v2/radar/nowcast_10/256/{z}/{x}/{y}/2/1_1.png'
        ],
        tileSize: 256,
      });

      map.addLayer({
        id: 'weather-radar',
        type: 'raster',
        source: WEATHER_SOURCE,
        paint: {
          'raster-opacity': 0.6,
          'raster-fade-duration': 300,
        },
        layout: {
          visibility: 'none',
        },
      });
    }

    // Airports source
    if (!map.getSource(AIRPORT_SOURCE)) {
      map.addSource(AIRPORT_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'airport-layer',
        type: 'circle',
        source: AIRPORT_SOURCE,
        minzoom: 4,
        paint: {
          'circle-radius': 4,
          'circle-color': '#ffffff',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#0ea5e9',
          'circle-opacity': 0.8,
        },
      });

      map.addLayer({
        id: 'airport-labels',
        type: 'symbol',
        source: AIRPORT_SOURCE,
        minzoom: 6,
        layout: {
          'text-field': ['get', 'icao'],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-size': 10,
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0,0,0,0.8)',
          'text-halo-width': 1,
        },
      });
    }

    // Aircraft positions source
    if (!map.getSource(AIRCRAFT_SOURCE)) {
      map.addSource(AIRCRAFT_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        generateId: true,
        cluster: false,
      });

      // Dot layer for global/low zoom
      map.addLayer({
        id: 'aircraft-dots',
        type: 'circle',
        source: AIRCRAFT_SOURCE,
        maxzoom: 7,
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            1, 2.5,
            4, 4,
            7, 6,
          ],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.9,
          'circle-stroke-width': [
            'case',
            ['==', ['get', 'selected'], true], 2,
            0.5
          ],
          'circle-stroke-color': [
            'case',
            ['==', ['get', 'selected'], true], '#ffffff',
            'rgba(255,255,255,0.2)'
          ],
        },
      });

      // Symbol layer for mid/high zoom - will show icons when loaded
      map.addLayer({
        id: 'aircraft-icons',
        type: 'symbol',
        source: AIRCRAFT_SOURCE,
        minzoom: 7,
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-size': [
            'interpolate', ['linear'], ['zoom'],
            7, 0.6,
            10, 0.9,
            14, 1.4,
          ],
          'icon-rotate': ['get', 'track'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'text-field': [
            'case',
            ['>', ['zoom'], 7], ['get', 'label'],
            ''
          ],
          'text-size': 10,
          'text-offset': [0, 2],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          'text-optional': true,
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        },
        paint: {
          'text-color': '#cbd5e1',
          'text-halo-color': 'rgba(0,0,0,0.85)',
          'text-halo-width': 1.5,
          'icon-opacity': 0.95,
        },
      });

      // Selected aircraft pulse ring
      map.addLayer({
        id: 'aircraft-selected',
        type: 'circle',
        source: AIRCRAFT_SOURCE,
        filter: ['==', ['get', 'selected'], true],
        paint: {
          'circle-radius': 18,
          'circle-color': 'transparent',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#0ea5e9',
          'circle-opacity': 0,
          'circle-stroke-opacity': 0.9,
        },
      });
    }

    // Trail source
    if (!map.getSource(TRAIL_SOURCE)) {
      map.addSource(TRAIL_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'aircraft-trails-layer',
        type: 'line',
        source: TRAIL_SOURCE,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            2, 1,
            8, 2,
            12, 2.5
          ],
          'line-opacity': ['get', 'opacity'],
          'line-blur': 0.3,
        },
      }, 'aircraft-dots');
    }
  }, []);

  const loadIcons = useCallback((map: maplibregl.Map) => {
    if (iconsLoadedRef.current) return;

    const iconDefs = [
      { name: 'ac-civilian', color: '#22c55e' },
      { name: 'ac-suspicious', color: '#eab308' },
      { name: 'ac-military-likely', color: '#f97316' },
      { name: 'ac-military', color: '#ef4444' },
      { name: 'ac-selected', color: '#38bdf8' },
      { name: 'ac-default', color: '#94a3b8' },
    ];

    let loadedCount = 0;
    iconDefs.forEach(({ name, color }) => {
      if (map.hasImage(name)) {
        loadedCount++;
        if (loadedCount === iconDefs.length) iconsLoadedRef.current = true;
        return;
      }
      const img = new Image(32, 32);
      img.onload = () => {
        if (!map.hasImage(name)) {
          map.addImage(name, img);
        }
        loadedCount++;
        if (loadedCount === iconDefs.length) {
          iconsLoadedRef.current = true;
        }
      };
      img.src = createAircraftSVG(color, 32);
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      pitch: viewState.pitch,
      bearing: viewState.bearing,
      maxZoom: 18,
      minZoom: 1,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    );

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      'bottom-right'
    );

    map.addControl(
      new maplibregl.ScaleControl({ unit: 'nautical' }),
      'bottom-left'
    );

    map.on('load', () => {
      loadIcons(map);
      initializeSources(map);
      setMapLoaded(true);
      setMapReady(true);
    });

    map.on('styledata', () => {
      if (map.isStyleLoaded()) {
        loadIcons(map);
        initializeSources(map);
      }
    });

    map.on('move', () => {
      if (!mapRef.current) return;
      const center = mapRef.current.getCenter();
      setViewState({
        longitude: center.lng,
        latitude: center.lat,
        zoom: mapRef.current.getZoom(),
        pitch: mapRef.current.getPitch(),
        bearing: mapRef.current.getBearing(),
      });
    });

    // Click on aircraft
    const handleAircraftClick = (e: maplibregl.MapLayerMouseEvent) => {
      if (e.features && e.features.length > 0) {
        const hex = e.features[0].properties?.hex as string;
        if (hex) {
          selectAircraft(hex);
          setPanelVisible('aircraft-info', true);
        }
      }
    };

    map.on('click', 'aircraft-dots', handleAircraftClick);
    map.on('click', 'aircraft-icons', handleAircraftClick);

    // Cursor changes
    ['aircraft-dots', 'aircraft-icons'].forEach(layer => {
      map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'crosshair'; });
      map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      iconsLoadedRef.current = false;
    };
  }, []);

  // Handle style changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    iconsLoadedRef.current = false;
    mapRef.current.setStyle(styleUrl);
  }, [styleUrl]);

  // Update aircraft data on map
  const updateLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const aircraftSource = map.getSource(AIRCRAFT_SOURCE) as maplibregl.GeoJSONSource | undefined;
    const trailSource = map.getSource(TRAIL_SOURCE) as maplibregl.GeoJSONSource | undefined;

    if (!aircraftSource || !trailSource) return;

    const { filteredAircraft: aircraft, selectedHex: selected } = useAircraftStore.getState();

    const aircraftFeatures: GeoJSON.Feature[] = [];
    const trailFeatures: GeoJSON.Feature[] = [];

    for (const ac of aircraft) {
      if (!ac.lat || !ac.lon) continue;

      const isSelected = ac.hex === selected;
      const color = isSelected ? '#38bdf8' : getMilitaryConfidenceColor(ac.militaryConfidence);

      let icon = 'ac-default';
      if (isSelected) icon = 'ac-selected';
      else if (ac.militaryConfidence === 'confirmed_military') icon = 'ac-military';
      else if (ac.militaryConfidence === 'military_likely') icon = 'ac-military-likely';
      else if (ac.militaryConfidence === 'suspicious') icon = 'ac-suspicious';
      else icon = 'ac-civilian';

      const label = ac.callsign || ac.registration || ac.hex.toUpperCase();

      aircraftFeatures.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [ac.lon, ac.lat] },
        properties: {
          hex: ac.hex,
          callsign: ac.callsign,
          track: ac.track,
          altitude: ac.altitude,
          groundSpeed: ac.groundSpeed,
          color,
          icon,
          selected: isSelected,
          label,
          militaryConfidence: ac.militaryConfidence,
        },
      });

      // Trail
      if (ac.trail.length >= 2) {
        const altColor = getAltitudeColor(ac.altitude);
        trailFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: ac.trail.map(p => [p.lon, p.lat]),
          },
          properties: {
            hex: ac.hex,
            color: isSelected ? '#38bdf8' : altColor,
            opacity: isSelected ? 0.85 : 0.35,
          },
        });
      }
    }

    aircraftSource.setData({ type: 'FeatureCollection', features: aircraftFeatures });
    trailSource.setData({ type: 'FeatureCollection', features: trailFeatures });
  }, []);

  // Load airport data
  useEffect(() => {
    if (!mapReady) return;
    const loadAirports = async () => {
      const airports = await airportService.fetchAirports();
      const map = mapRef.current;
      if (!map) return;
      const airportSource = map.getSource(AIRPORT_SOURCE) as maplibregl.GeoJSONSource;
      if (airportSource) {
        airportSource.setData({
          type: 'FeatureCollection',
          features: airports.map(a => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [a.lon, a.lat] },
            properties: { icao: a.icao, name: a.name }
          }))
        });
      }
    };
    loadAirports();
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    updateLayers();
  }, [filteredAircraft, selectedHex, mapReady, updateLayers, overlayLayers]);

  // Handle layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    overlayLayers.forEach(layer => {
      let layerId = '';
      if (layer.id === 'weather') layerId = 'weather-radar';
      if (layer.id === 'airports') layerId = 'airport-layer';

      if (layerId && map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', layer.enabled ? 'visible' : 'none');
        if (layer.id === 'airports' && map.getLayer('airport-labels')) {
           map.setLayoutProperty('airport-labels', 'visibility', layer.enabled ? 'visible' : 'none');
        }
      }
    });
  }, [overlayLayers, mapReady]);

  // Fly to selected aircraft
  useEffect(() => {
    if (!mapRef.current || !selectedHex || !mapReady) return;
    const aircraft = useAircraftStore.getState().aircraft.get(selectedHex);
    if (!aircraft) return;

    const currentZoom = mapRef.current.getZoom();
    mapRef.current.flyTo({
      center: [aircraft.lon, aircraft.lat],
      zoom: Math.max(currentZoom, 6),
      duration: 1500,
      essential: true,
      curve: 1.4,
    });
  }, [selectedHex, mapReady]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Map container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ background: '#0a0e1a' }}
      />

      {/* Tactical grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(14, 165, 233, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Tactical corner brackets */}
      <TacticalCorners />
    </div>
  );
}

function TacticalCorners() {
  return (
    <>
      <div className="absolute top-3 left-3 pointer-events-none z-10">
        <div className="w-5 h-5 border-t-2 border-l-2 border-sky-500/30" />
      </div>
      <div className="absolute top-3 right-20 pointer-events-none z-10">
        <div className="w-5 h-5 border-t-2 border-r-2 border-sky-500/30" />
      </div>
      <div className="absolute bottom-20 left-3 pointer-events-none z-10">
        <div className="w-5 h-5 border-b-2 border-l-2 border-sky-500/30" />
      </div>
      <div className="absolute bottom-8 right-20 pointer-events-none z-10">
        <div className="w-5 h-5 border-b-2 border-r-2 border-sky-500/30" />
      </div>
    </>
  );
}
