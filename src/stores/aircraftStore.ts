import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Aircraft, AircraftFilter } from '../types/aircraft';
import { transformAircraft } from '../utils/aircraftTransform';
import { aircraftService } from '../services/aircraftService';
import { useMapStore } from './mapStore';
import { db } from '../services/db';
import Fuse from 'fuse.js';

interface AircraftStoreState {
  // Data
  aircraft: Map<string, Aircraft>;
  filteredAircraft: Aircraft[];
  selectedHex: string | null;
  hoveredHex: string | null;

  // Filters
  filter: AircraftFilter;

  // Stats
  totalCount: number;
  militaryCount: number;
  lastUpdate: number | null;
  isLoading: boolean;
  error: string | null;
  providerName: string;

  // Fetch state
  fetchRegion: { lat: number; lon: number; radius: number } | null;
  isMilitaryMode: boolean;

  // Actions
  updateAircraft: (rawList: import('../types/aircraft').RawAircraft[], now?: number) => void;
  setFilter: (filter: Partial<AircraftFilter>) => void;
  selectAircraft: (hex: string | null) => void;
  hoverAircraft: (hex: string | null) => void;
  setFetchRegion: (region: { lat: number; lon: number; radius: number } | null) => void;
  setMilitaryMode: (enabled: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProviderName: (name: string) => void;
  pruneStaleAircraft: () => void;
  getAircraft: (hex: string) => Aircraft | undefined;
  startFetching: () => () => void;
}

const DEFAULT_FILTER: AircraftFilter = {
  militaryOnly: false,
  search: '',
  minAltitude: 0,
  maxAltitude: 60000,
  minSpeed: 0,
  maxSpeed: 1500,
  squawk: '',
  typeCode: '',
  country: '',
  onGroundHidden: false,
  categories: [],
  militaryConfidence: 'all',
};

function applyFilters(aircraft: Aircraft[], filter: AircraftFilter): Aircraft[] {
  let result = aircraft;

  if (filter.militaryOnly) {
    result = result.filter(a => a.isMilitary);
  } else if (filter.militaryConfidence !== 'all') {
    result = result.filter(a => a.militaryConfidence === filter.militaryConfidence);
  }

  if (filter.onGroundHidden) {
    result = result.filter(a => !a.onGround);
  }

  if (filter.minAltitude > 0) {
    result = result.filter(a => a.altitude >= filter.minAltitude);
  }

  if (filter.maxAltitude < 60000) {
    result = result.filter(a => a.altitude <= filter.maxAltitude);
  }

  if (filter.minSpeed > 0) {
    result = result.filter(a => a.groundSpeed >= filter.minSpeed);
  }

  if (filter.maxSpeed < 1500) {
    result = result.filter(a => a.groundSpeed <= filter.maxSpeed);
  }

  if (filter.squawk) {
    result = result.filter(a => a.squawk.includes(filter.squawk));
  }

  if (filter.typeCode) {
    const tc = filter.typeCode.toUpperCase();
    result = result.filter(a => a.typeCode.toUpperCase().includes(tc));
  }

  if (filter.search && filter.search.length >= 1) {
    const fuse = new Fuse(result, {
      keys: ['callsign', 'registration', 'typeCode', 'hex', 'description', 'operator'],
      threshold: 0.3,
      includeScore: true,
    });
    const searchResults = fuse.search(filter.search);
    result = searchResults.map(r => r.item);
  }

  return result;
}

export const useAircraftStore = create<AircraftStoreState>()(
  subscribeWithSelector((set, get) => ({
    aircraft: new Map(),
    filteredAircraft: [],
    selectedHex: null,
    hoveredHex: null,
    filter: DEFAULT_FILTER,
    totalCount: 0,
    militaryCount: 0,
    lastUpdate: null,
    isLoading: false,
    error: null,
    providerName: 'Airplanes.live',
    fetchRegion: null,
    isMilitaryMode: true,

    updateAircraft: async (rawList, now = Date.now()) => {
      const { aircraft: currentMap, filter } = get();
      const updatedMap = new Map(currentMap);

      // Identify which aircraft are new and might need trail recovery
      const newHexes = rawList
        .filter(raw => raw.hex && !updatedMap.has(raw.hex))
        .map(raw => raw.hex!);

      // Bulk fetch saved trails for new aircraft to improve performance
      const savedTrailsMap = new Map<string, any>();
      if (newHexes.length > 0) {
        const savedTrails = await db.trails.bulkGet(newHexes);
        savedTrails.forEach(trail => {
          if (trail) savedTrailsMap.set(trail.hex, trail);
        });
      }

      for (const raw of rawList) {
        if (!raw.hex) continue;

        let existing = updatedMap.get(raw.hex);

        if (!existing) {
          const saved = savedTrailsMap.get(raw.hex);
          if (saved) {
             existing = { trail: saved.points, firstSeen: saved.lastUpdate } as any;
          }
        }

        const transformed = transformAircraft(raw, existing, now);
        if (transformed) {
          updatedMap.set(raw.hex, transformed);

          if (transformed.trail.length > 0) {
            db.trails.put({
              hex: transformed.hex,
              points: transformed.trail,
              lastUpdate: now
            });
          }
        }
      }

      const allAircraft = Array.from(updatedMap.values());
      const filtered = applyFilters(allAircraft, filter);
      const militaryCount = allAircraft.filter(a => a.isMilitary).length;

      set({
        aircraft: updatedMap,
        filteredAircraft: filtered,
        totalCount: updatedMap.size,
        militaryCount,
        lastUpdate: now,
        error: null,
      });
    },

    setFilter: (partialFilter) => {
      const { filter, aircraft } = get();
      const newFilter = { ...filter, ...partialFilter };
      const allAircraft = Array.from(aircraft.values());
      const filtered = applyFilters(allAircraft, newFilter);

      set({ filter: newFilter, filteredAircraft: filtered });
    },

    selectAircraft: (hex) => set({ selectedHex: hex }),
    hoverAircraft: (hex) => set({ hoveredHex: hex }),
    setFetchRegion: (region) => set({ fetchRegion: region }),
    setMilitaryMode: (enabled) => {
      set({ isMilitaryMode: enabled });
      // Clear filters when switching modes to ensure all aircraft show
      if (!enabled) {
        get().setFilter({ militaryOnly: false, militaryConfidence: 'all' });
      }
    },
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    setProviderName: (name) => set({ providerName: name }),

    pruneStaleAircraft: () => {
      const { aircraft: currentMap, filter } = get();
      const now = Date.now();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes
      const updatedMap = new Map(currentMap);
      let changed = false;

      for (const [hex, aircraft] of updatedMap) {
        if (now - aircraft.lastUpdate > staleThreshold) {
          updatedMap.delete(hex);
          changed = true;
        }
      }

      if (changed) {
        const allAircraft = Array.from(updatedMap.values());
        const filtered = applyFilters(allAircraft, filter);
        set({
          aircraft: updatedMap,
          filteredAircraft: filtered,
          totalCount: updatedMap.size,
          militaryCount: allAircraft.filter(a => a.isMilitary).length,
        });
      }
    },

    getAircraft: (hex) => get().aircraft.get(hex),

    startFetching: () => {
      let active = true;
      let timeoutId: ReturnType<typeof setTimeout>;
      let fetchCount = 0;

      const REGION_CENTERS = [
        { lat: 40, lon: -100, radius: 250, name: 'North America' },
        { lat: 51, lon: 10, radius: 250, name: 'Europe' },
        { lat: 35, lon: 135, radius: 250, name: 'East Asia' },
        { lat: 25, lon: 55, radius: 250, name: 'Middle East' },
        { lat: -25, lon: 130, radius: 250, name: 'Australia' },
        { lat: 55, lon: 37, radius: 250, name: 'Russia/Eastern Europe' },
        { lat: -15, lon: -60, radius: 250, name: 'South America' },
        { lat: 0, lon: 20, radius: 250, name: 'Africa' },
      ];

      const fetchCycle = async () => {
        if (!active) return;

        const { isMilitaryMode, fetchRegion } = get();
        const { viewState } = useMapStore.getState();
        get().setLoading(true);

        try {
          let rawAircraft: any[] = [];

          if (isMilitaryMode) {
            rawAircraft = await aircraftService.fetchMilitary();
          } else if (fetchRegion) {
            rawAircraft = await aircraftService.fetchByBounds(
              fetchRegion.lat, fetchRegion.lon, fetchRegion.radius
            );
          } else {
            // Adaptive radius based on zoom
            const radius = Math.min(250, Math.max(50, 2000 / Math.pow(2, viewState.zoom - 1)));
            const currentView = await aircraftService.fetchByBounds(viewState.latitude, viewState.longitude, radius);

            // Background regional fetching for global presence
            const region = REGION_CENTERS[fetchCount % REGION_CENTERS.length];
            const extraAircraft = await aircraftService.fetchByBounds(region.lat, region.lon, region.radius);

            // Merge unique aircraft
            const merged = new Map();
            [...currentView, ...extraAircraft].forEach(ac => {
              if (ac.hex) merged.set(ac.hex, ac);
            });
            rawAircraft = Array.from(merged.values());

            fetchCount++;
          }

          if (active && rawAircraft.length > 0) {
            get().updateAircraft(rawAircraft);
            get().setProviderName(aircraftService.getCurrentProviderName());
          }
        } catch (err) {
          if (active) {
            get().setError(err instanceof Error ? err.message : 'Fetch failed');
          }
        } finally {
          if (active) {
            get().setLoading(false);
            // Schedule next fetch
            timeoutId = setTimeout(fetchCycle, isMilitaryMode ? 8000 : 5000);
          }
        }
      };

      // Start immediately
      fetchCycle();

      // Also prune stale aircraft every 2 minutes
      const pruneInterval = setInterval(() => {
        if (active) get().pruneStaleAircraft();
      }, 120000);

      return () => {
        active = false;
        clearTimeout(timeoutId);
        clearInterval(pruneInterval);
      };
    },
  }))
);
