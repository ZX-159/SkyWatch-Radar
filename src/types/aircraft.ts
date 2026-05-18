// Core aircraft data types matching ADS-B exchange / airplanes.live API format

export type MilitaryConfidence = 'civilian' | 'suspicious' | 'military_likely' | 'confirmed_military';

export type AircraftCategory =
  | 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7'
  | 'B0' | 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' | 'B7'
  | 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7'
  | 'D0' | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7';

export interface RawAircraft {
  hex: string;
  type?: string;
  flight?: string;
  r?: string;           // registration
  t?: string;           // aircraft type code
  desc?: string;        // aircraft description
  alt_baro?: number | 'ground';
  alt_geom?: number;
  gs?: number;          // ground speed knots
  ias?: number;         // indicated airspeed
  tas?: number;         // true airspeed
  mach?: number;
  track?: number;       // true track over ground
  track_rate?: number;
  roll?: number;
  mag_heading?: number;
  true_heading?: number;
  baro_rate?: number;
  geom_rate?: number;
  squawk?: string;
  emergency?: string;
  category?: AircraftCategory;
  nav_qnh?: number;
  nav_altitude_mcp?: number;
  nav_altitude_fms?: number;
  nav_heading?: number;
  nav_modes?: string[];
  lat?: number;
  lon?: number;
  nic?: number;
  rc?: number;
  seen_pos?: number;
  version?: number;
  nic_baro?: number;
  nac_p?: number;
  nac_v?: number;
  sil?: number;
  sil_type?: string;
  gva?: number;
  sda?: number;
  alert?: number;
  spi?: number;
  mlat?: string[];
  tisb?: string[];
  messages?: number;
  seen?: number;
  rssi?: number;
  dbFlags?: number;
  mil?: boolean;
  pia?: boolean;
  ladd?: boolean;
  ownOp?: string;
  year?: string;
}

export interface TrailPoint {
  lat: number;
  lon: number;
  alt: number;
  ts: number;
  gs?: number;
}

export interface Aircraft {
  // Identity
  hex: string;
  callsign: string;
  registration: string;
  typeCode: string;
  description: string;
  operator: string;

  // Position
  lat: number;
  lon: number;
  altitude: number;         // feet
  altitudeGeom: number;
  onGround: boolean;

  // Motion
  groundSpeed: number;      // knots
  track: number;            // degrees true
  verticalRate: number;     // fpm
  roll: number;

  // Navigation
  squawk: string;
  emergency: string;
  navModes: string[];
  selectedAltitude: number;
  selectedHeading: number;

  // Signal
  seen: number;
  seenPos: number;
  rssi: number;
  messages: number;

  // Classification
  category: AircraftCategory | '';
  isMilitary: boolean;
  isPIA: boolean;
  isLADD: boolean;
  militaryConfidence: MilitaryConfidence;
  militaryScore: number;
  militaryReasons: string[];

  // Trail
  trail: TrailPoint[];

  // Meta
  dbFlags: number;
  lastUpdate: number;       // unix ms
  firstSeen: number;        // unix ms

  // Rendering
  interpolatedLat?: number;
  interpolatedLon?: number;
  interpolatedTrack?: number;
}

export interface AircraftAPIResponse {
  ac: RawAircraft[];
  msg: string;
  now: number;
  total: number;
  ctime: number;
  ptime: number;
}

export interface AircraftFilter {
  militaryOnly: boolean;
  search: string;
  minAltitude: number;
  maxAltitude: number;
  minSpeed: number;
  maxSpeed: number;
  squawk: string;
  typeCode: string;
  country: string;
  onGroundHidden: boolean;
  categories: string[];
  militaryConfidence: MilitaryConfidence | 'all';
}

export interface Airport {
  id: number;
  ident: string;
  type: string;
  name: string;
  lat: number;
  lon: number;
  elevation: number;
  continent: string;
  country: string;
  region: string;
  municipality: string;
  scheduledService: boolean;
  iata: string;
  wikipedia: string;
  runways?: Runway[];
}

export interface Runway {
  id: number;
  airportRef: number;
  airportIdent: string;
  lengthFt: number;
  widthFt: number;
  surface: string;
  lighted: boolean;
  closed: boolean;
  leIdent: string;
  heIdent: string;
  leHeadingDegT: number;
  heHeadingDegT: number;
  leElevationFt: number;
  heElevationFt: number;
}
