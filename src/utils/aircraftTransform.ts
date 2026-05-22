import type { RawAircraft, Aircraft, TrailPoint } from '../types/aircraft';
import { detectMilitary } from './militaryDetection';

export function transformAircraft(
  raw: RawAircraft,
  existing?: Aircraft,
  now: number = Date.now()
): Aircraft | null {
  // Skip aircraft without position
  if (raw.lat === undefined || raw.lon === undefined) return null;
  if (typeof raw.lat !== 'number' || typeof raw.lon !== 'number') return null;

  const military = detectMilitary(raw);

  const alt = typeof raw.alt_baro === 'number' ? raw.alt_baro : 0;
  const onGround = raw.alt_baro === 'ground' || (typeof raw.alt_baro === 'number' && raw.alt_baro < 50 && (raw.gs || 0) < 30);

  // Build trail point from new position
  const newTrailPoint: TrailPoint = {
    lat: raw.lat,
    lon: raw.lon,
    alt,
    ts: now,
    gs: raw.gs,
  };

  // Merge trail with existing (keep last 120 points = ~20 minutes at 10s intervals)
  let trail: TrailPoint[] = [];
  if (existing) {
    trail = [...existing.trail];
    // Only add if position changed enough
    const lastPoint = trail[trail.length - 1];
    if (!lastPoint ||
      Math.abs(lastPoint.lat - raw.lat) > 0.0001 ||
      Math.abs(lastPoint.lon - raw.lon) > 0.0001) {
      trail.push(newTrailPoint);
    }
    // Prune old trail points (keep last 2 hours worth)
    const cutoff = now - 2 * 60 * 60 * 1000;
    trail = trail.filter(p => p.ts > cutoff);
    if (trail.length > 200) {
      trail = trail.slice(trail.length - 200);
    }
  } else {
    trail = [newTrailPoint];
  }

  return {
    hex: raw.hex || '',
    callsign: (raw.flight || '').trim(),
    registration: raw.r || '',
    typeCode: raw.t || '',
    description: raw.desc || '',
    operator: raw.ownOp || '',
    origin: (raw as any).origin,
    destination: (raw as any).dest,

    lat: raw.lat,
    lon: raw.lon,
    altitude: alt,
    altitudeGeom: raw.alt_geom || alt,
    onGround,

    groundSpeed: raw.gs || 0,
    track: raw.track || 0,
    verticalRate: raw.baro_rate || 0,
    roll: raw.roll || 0,

    squawk: raw.squawk || '',
    emergency: raw.emergency || 'none',
    navModes: raw.nav_modes || [],
    selectedAltitude: raw.nav_altitude_mcp || raw.nav_altitude_fms || 0,
    selectedHeading: raw.nav_heading || raw.mag_heading || raw.true_heading || 0,

    seen: raw.seen || 0,
    seenPos: raw.seen_pos || 0,
    rssi: raw.rssi || 0,
    messages: raw.messages || 0,

    category: raw.category || '',
    isMilitary: raw.mil === true || military.confidence === 'confirmed_military' || military.confidence === 'military_likely',
    isPIA: raw.pia === true,
    isLADD: raw.ladd === true,
    militaryConfidence: military.confidence,
    militaryScore: military.score,
    militaryReasons: military.reasons,

    trail,
    dbFlags: raw.dbFlags || 0,
    lastUpdate: now,
    firstSeen: existing?.firstSeen || now,
  };
}

export function getAltitudeColor(altitude: number): string {
  // Color scale from ground (green) to cruise (blue/purple)
  if (altitude <= 0) return '#64748b';
  if (altitude < 5000) return '#22c55e';
  if (altitude < 10000) return '#84cc16';
  if (altitude < 18000) return '#eab308';
  if (altitude < 25000) return '#f97316';
  if (altitude < 35000) return '#ef4444';
  if (altitude < 45000) return '#a855f7';
  return '#8b5cf6';
}

export function getAltitudeColorHex(altitude: number): [number, number, number] {
  const hex = getAltitudeColor(altitude).replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return [r, g, b];
}

export function interpolatePosition(
  aircraft: Aircraft,
  deltaMs: number
): { lat: number; lon: number } {
  if (aircraft.onGround || aircraft.groundSpeed < 10) {
    return { lat: aircraft.lat, lon: aircraft.lon };
  }

  // Convert speed to degrees per millisecond
  // 1 knot = 1.852 km/h = 0.000514444 km/s
  const speedKmPerMs = (aircraft.groundSpeed * 1.852) / 3600000;
  const trackRad = (aircraft.track * Math.PI) / 180;

  // Approximate great-circle offset
  const deltaKm = speedKmPerMs * deltaMs;
  const earthRadiusKm = 6371;

  const dLat = (deltaKm / earthRadiusKm) * (180 / Math.PI) * Math.cos(trackRad);
  // Correct for longitude convergence at latitude
  const dLon = (deltaKm / earthRadiusKm) * (180 / Math.PI) * Math.sin(trackRad) /
    Math.cos((aircraft.lat * Math.PI) / 180);

  return {
    lat: aircraft.lat + dLat,
    lon: aircraft.lon + dLon,
  };
}

export function formatAltitude(alt: number): string {
  if (alt <= 0) return 'GND';
  if (alt >= 1000) return `${(alt / 1000).toFixed(1)}k ft`;
  return `${alt} ft`;
}

export function formatSpeed(kts: number): string {
  return `${Math.round(kts)} kts`;
}

export function formatVerticalRate(fpm: number): string {
  if (Math.abs(fpm) < 100) return 'Level';
  const sign = fpm > 0 ? '↑' : '↓';
  return `${sign}${Math.abs(Math.round(fpm))} fpm`;
}

export function getAircraftIconSize(zoom: number): number {
  if (zoom < 4) return 8;
  if (zoom < 6) return 12;
  if (zoom < 8) return 18;
  if (zoom < 10) return 24;
  return 32;
}

export function categorizeByCountry(hex: string): string {
  const num = parseInt(hex, 16);
  if (isNaN(num)) return 'Unknown';

  // Basic country identification from ICAO ranges
  if (num >= 0xA00000 && num <= 0xAFFFFF) return 'United States';
  if (num >= 0x400000 && num <= 0x43FFFF) return 'United Kingdom';
  if (num >= 0x380000 && num <= 0x3BFFFF) return 'France';
  if (num >= 0x3C0000 && num <= 0x3FFFFF) return 'Germany';
  if (num >= 0x300000 && num <= 0x33FFFF) return 'Italy';
  if (num >= 0x340000 && num <= 0x37FFFF) return 'Spain';
  if (num >= 0xC00000 && num <= 0xC3FFFF) return 'Canada';
  if (num >= 0x7C0000 && num <= 0x7FFFFF) return 'Australia';
  if (num >= 0x780000 && num <= 0x7BFFFF) return 'China';
  if (num >= 0x800000 && num <= 0x83FFFF) return 'India';
  if (num >= 0x840000 && num <= 0x87FFFF) return 'Japan';
  if (num >= 0x100000 && num <= 0x1FFFFF) return 'Russia';
  if (num >= 0x700000 && num <= 0x77FFFF) return 'Saudi Arabia';
  if (num >= 0x730000 && num <= 0x73FFFF) return 'Israel';
  if (num >= 0x480000 && num <= 0x48FFFF) return 'Netherlands';
  if (num >= 0x4A0000 && num <= 0x4AFFFF) return 'Sweden';
  if (num >= 0x500000 && num <= 0x53FFFF) return 'South Korea';
  if (num >= 0xE40000 && num <= 0xE7FFFF) return 'Brazil';
  if (num >= 0xE80000 && num <= 0xEBFFFF) return 'Argentina';
  if (num >= 0x0D0000 && num <= 0x0FFFFF) return 'South Africa';

  return 'Unknown';
}
