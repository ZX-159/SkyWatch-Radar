import type { RawAircraft, AircraftAPIResponse } from '../types/aircraft';

// Abstract ADS-B data provider interface
export interface AircraftDataProvider {
  name: string;
  fetchAll(): Promise<RawAircraft[]>;
  fetchMilitary(): Promise<RawAircraft[]>;
  fetchByHex(hex: string): Promise<RawAircraft | null>;
  fetchByCallsign(callsign: string): Promise<RawAircraft[]>;
  fetchByBounds(lat: number, lon: number, radiusNm: number): Promise<RawAircraft[]>;
}

// Rate limiter - ensures we don't exceed 1 req/sec
class RateLimiter {
  private lastCall: number = 0;
  private readonly minInterval: number;

  constructor(minIntervalMs: number = 1100) {
    this.minInterval = minIntervalMs;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCall;
    if (elapsed < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - elapsed));
    }
    this.lastCall = Date.now();
  }
}

// Airplanes.live provider
class AirplanesLiveProvider implements AircraftDataProvider {
  name = 'Airplanes.live';
  private readonly baseUrl = 'https://api.airplanes.live/v2';
  private readonly rateLimiter = new RateLimiter(1100);

  private async fetchWithRateLimit<T>(url: string): Promise<T> {
    await this.rateLimiter.throttle();
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`ADS-B API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async fetchAll(): Promise<RawAircraft[]> {
    try {
      // Fetch the global sample from airplanes.live
      const data = await this.fetchWithRateLimit<AircraftAPIResponse>(`${this.baseUrl}/all`);
      return data.ac || [];
    } catch (err) {
      console.error('[AirplanesLive] Failed to fetch all:', err);
      // Fallback to military
      return this.fetchMilitary();
    }
  }

  async fetchMilitary(): Promise<RawAircraft[]> {
    try {
      const data = await this.fetchWithRateLimit<AircraftAPIResponse>(`${this.baseUrl}/mil`);
      return data.ac || [];
    } catch (err) {
      console.error('[AirplanesLive] Failed to fetch military:', err);
      return [];
    }
  }

  async fetchByHex(hex: string): Promise<RawAircraft | null> {
    try {
      const data = await this.fetchWithRateLimit<AircraftAPIResponse>(`${this.baseUrl}/hex/${hex}`);
      return data.ac?.[0] || null;
    } catch (err) {
      console.error('[AirplanesLive] Failed to fetch by hex:', err);
      return null;
    }
  }

  async fetchByCallsign(callsign: string): Promise<RawAircraft[]> {
    try {
      const data = await this.fetchWithRateLimit<AircraftAPIResponse>(`${this.baseUrl}/callsign/${callsign}`);
      return data.ac || [];
    } catch (err) {
      console.error('[AirplanesLive] Failed to fetch by callsign:', err);
      return [];
    }
  }

  async fetchByBounds(lat: number, lon: number, radiusNm: number = 250): Promise<RawAircraft[]> {
    const clampedRadius = Math.min(radiusNm, 250);
    try {
      const data = await this.fetchWithRateLimit<AircraftAPIResponse>(
        `${this.baseUrl}/point/${lat}/${lon}/${clampedRadius}`
      );
      return data.ac || [];
    } catch (err) {
      console.error('[AirplanesLive] Failed to fetch by bounds:', err);
      return [];
    }
  }
}

// ADSB.fi provider (fallback)
class ADSBFiProvider implements AircraftDataProvider {
  name = 'ADSB.fi';
  private readonly baseUrl = 'https://opendata.adsb.fi/api/v2';
  private readonly rateLimiter = new RateLimiter(1100);

  private async fetchWithRateLimit<T>(url: string): Promise<T> {
    await this.rateLimiter.throttle();
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error(`ADSB.fi API error: ${response.status}`);
    return response.json() as Promise<T>;
  }

  async fetchAll(): Promise<RawAircraft[]> {
    try {
      const data = await this.fetchWithRateLimit<AircraftAPIResponse>(`${this.baseUrl}/all`);
      return data.ac || [];
    } catch (err) {
      return this.fetchMilitary();
    }
  }

  async fetchMilitary(): Promise<RawAircraft[]> {
    try {
      const data = await this.fetchWithRateLimit<AircraftAPIResponse>(`${this.baseUrl}/mil`);
      return data.ac || [];
    } catch (err) {
      console.error('[ADSBFi] Failed to fetch military:', err);
      return [];
    }
  }

  async fetchByHex(hex: string): Promise<RawAircraft | null> {
    try {
      const data = await this.fetchWithRateLimit<AircraftAPIResponse>(`${this.baseUrl}/hex/${hex}`);
      return data.ac?.[0] || null;
    } catch (err) {
      return null;
    }
  }

  async fetchByCallsign(callsign: string): Promise<RawAircraft[]> {
    try {
      const data = await this.fetchWithRateLimit<AircraftAPIResponse>(`${this.baseUrl}/callsign/${callsign}`);
      return data.ac || [];
    } catch (err) {
      return [];
    }
  }

  async fetchByBounds(lat: number, lon: number, radiusNm: number): Promise<RawAircraft[]> {
    const clampedRadius = Math.min(radiusNm, 250);
    try {
      const data = await this.fetchWithRateLimit<AircraftAPIResponse>(
        `${this.baseUrl}/point/${lat}/${lon}/${clampedRadius}`
      );
      return data.ac || [];
    } catch (err) {
      return [];
    }
  }
}

// Service with provider abstraction and fallback
export class AircraftService {
  private providers: AircraftDataProvider[];
  private currentProviderIndex = 0;

  constructor() {
    this.providers = [
      new AirplanesLiveProvider(),
      new ADSBFiProvider(),
    ];
  }

  private get provider(): AircraftDataProvider {
    return this.providers[this.currentProviderIndex];
  }

  private async withFallback<T>(operation: (p: AircraftDataProvider) => Promise<T>, defaultValue: T): Promise<T> {
    for (let i = 0; i < this.providers.length; i++) {
      const providerIndex = (this.currentProviderIndex + i) % this.providers.length;
      try {
        const result = await operation(this.providers[providerIndex]);
        this.currentProviderIndex = providerIndex;
        return result;
      } catch (err) {
        console.warn(`[AircraftService] Provider ${this.providers[providerIndex].name} failed:`, err);
      }
    }
    return defaultValue;
  }

  async fetchMilitary(): Promise<RawAircraft[]> {
    return this.withFallback(p => p.fetchMilitary(), []);
  }

  async fetchByBounds(lat: number, lon: number, radiusNm: number): Promise<RawAircraft[]> {
    return this.withFallback(p => p.fetchByBounds(lat, lon, radiusNm), []);
  }

  async fetchByHex(hex: string): Promise<RawAircraft | null> {
    return this.withFallback(p => p.fetchByHex(hex), null);
  }

  async fetchByCallsign(callsign: string): Promise<RawAircraft[]> {
    return this.withFallback(p => p.fetchByCallsign(callsign), []);
  }

  getCurrentProviderName(): string {
    return this.provider.name;
  }
}

// Singleton
export const aircraftService = new AircraftService();
