import React, { useEffect, useRef, useState } from 'react';
import * as og from '@openglobus/og';
import { useAircraftStore } from '../../stores/aircraftStore';
import { useMapStore } from '../../stores/mapStore';
import { getMilitaryConfidenceColor } from '../../utils/militaryDetection';

interface GlobeViewProps {
  className?: string;
}

export function GlobeView({ className = '' }: GlobeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const vectorsRef = useRef<any>(null);
  const entitiesRef = useRef<Map<string, any>>(new Map());

  const { viewState, setViewState } = useMapStore();
  const { filteredAircraft, selectedHex, selectAircraft } = useAircraftStore();

  useEffect(() => {
    if (!containerRef.current || globeRef.current) return;

    const osm = new og.layer.XYZ('OSM', {
      isBaseLayer: true,
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      visibility: true,
      attribution: '© OpenStreetMap contributors',
    });

    const globe = new og.Globe({
      target: containerRef.current,
      name: 'Earth',
      layers: [osm],
      autoActivate: true,
    });

    const vectors = new og.layer.Vector('Aircraft', {
      clampToGround: false,
    });
    globe.planet.addLayer(vectors);
    vectorsRef.current = vectors;

    globe.planet.events.on('draw', () => {
      const cam = globe.planet.camera;
      const lonlat = cam.getLonLat();
      const height = cam.eye.length();
      const zoom = Math.max(1, Math.min(18, Math.log2(40075016 / (height / 256))));

      // Only update store if the change is significant to prevent feedback loops
      const current = useMapStore.getState().viewState;
      const dLon = Math.abs(current.longitude - lonlat.lon);
      const dLat = Math.abs(current.latitude - lonlat.lat);
      const dZoom = Math.abs(current.zoom - zoom);

      if (dLon > 0.01 || dLat > 0.01 || dZoom > 0.1) {
        setViewState({
          longitude: lonlat.lon,
          latitude: lonlat.lat,
          zoom: zoom,
        });
      }
    });

    vectors.events.on('ldown', (e: any) => {
      const pickingObject = e.pickingObject;
      if (pickingObject && pickingObject.properties && pickingObject.properties.hex) {
        selectAircraft(pickingObject.properties.hex);
      }
    });

    globeRef.current = globe;
    setGlobeReady(true);

    globe.planet.camera.setLonLat(new og.LonLat(viewState.longitude, viewState.latitude, 5000000));

    return () => {
      // og cleanup is handled by target destruction in most cases
    };
  }, []);

  useEffect(() => {
    if (!globeReady || !vectorsRef.current) return;

    const vectors = vectorsRef.current;
    const currentHexes = new Set(filteredAircraft.map(a => a.hex));

    for (const [hex, entity] of entitiesRef.current.entries()) {
      if (!currentHexes.has(hex)) {
        vectors.remove(entity);
        entitiesRef.current.delete(hex);
      }
    }

    filteredAircraft.forEach(ac => {
      let entity = entitiesRef.current.get(ac.hex);
      const color = ac.hex === selectedHex ? '#38bdf8' : getMilitaryConfidenceColor(ac.militaryConfidence);

      if (!entity) {
        entity = new og.Entity({
          name: ac.callsign || ac.hex,
          lonlat: [ac.lon, ac.lat, ac.altitude * 0.3048],
          billboard: {
            src: createAircraftDataURL(color, ac.track),
            width: 24,
            height: 24,
            rotation: 0,
          },
          properties: { hex: ac.hex }
        });
        vectors.add(entity);
        entitiesRef.current.set(ac.hex, entity);
      } else {
        entity.setLonLat(new og.LonLat(ac.lon, ac.lat, ac.altitude * 0.3048));
        entity.billboard.setSrc(createAircraftDataURL(color, ac.track));
      }
    });
  }, [filteredAircraft, selectedHex, globeReady]);

  useEffect(() => {
    if (!globeRef.current || !globeReady) return;
    const cam = globeRef.current.planet.camera;
    const current = cam.getLonLat();

    // Only update camera if the change came from outside (e.g. 2D map)
    if (Math.abs(current.lon - viewState.longitude) > 0.01 ||
        Math.abs(current.lat - viewState.latitude) > 0.01) {
      cam.setLonLat(new og.LonLat(viewState.longitude, viewState.latitude, cam.eye.length()));
    }
  }, [viewState.longitude, viewState.latitude, globeReady]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

function createAircraftDataURL(color: string, rotation: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" style="transform: rotate(${rotation}deg)">
    <path d="M16 4 L24 24 L16 20 L8 24 Z" fill="${color}" stroke="white" stroke-width="1" />
  </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}
