import type { RawAircraft, MilitaryConfidence } from '../types/aircraft';

// Military ICAO hex prefix ranges by country
// These are well-known military ICAO allocations
const MILITARY_ICAO_RANGES: Array<{ start: number; end: number; nation: string }> = [
  // USA Military (AE0000 - AFFFFF)
  { start: 0xAE0000, end: 0xAFFFFF, nation: 'US' },
  // UK Military (43C000 - 43CFFF)
  { start: 0x43C000, end: 0x43CFFF, nation: 'UK' },
  // France Military (3A8000 - 3AFFFF)
  { start: 0x3A8000, end: 0x3AFFFF, nation: 'FR' },
  // Germany Military (3DC000 - 3DFFFF)
  { start: 0x3DC000, end: 0x3DFFFF, nation: 'DE' },
  // Russia Military (0x100000 - 0x1FFFFF)
  { start: 0x100000, end: 0x1FFFFF, nation: 'RU' },
  // China Military (780000 - 7BFFFF)
  { start: 0x780000, end: 0x7BFFFF, nation: 'CN' },
  // NATO/Belgium (45D000 - 45DFFF)
  { start: 0x45D000, end: 0x45DFFF, nation: 'BE' },
  // Netherlands Military (480000 - 487FFF)
  { start: 0x480000, end: 0x487FFF, nation: 'NL' },
  // Spain Military (340000 - 347FFF)
  { start: 0x340000, end: 0x347FFF, nation: 'ES' },
  // Italy Military (300000 - 33FFFF)
  { start: 0x300000, end: 0x33FFFF, nation: 'IT' },
  // Australia Military (7C0000 - 7C3FFF)
  { start: 0x7C0000, end: 0x7C3FFF, nation: 'AU' },
  // Canada Military (C00000 - C3FFFF)
  { start: 0xC00000, end: 0xC3FFFF, nation: 'CA' },
  // Israel Military (738000 - 73FFFF)
  { start: 0x738000, end: 0x73FFFF, nation: 'IL' },
  // India Military (800000 - 83FFFF)
  { start: 0x800000, end: 0x83FFFF, nation: 'IN' },
  // Japan Military (840000 - 87FFFF)
  { start: 0x840000, end: 0x87FFFF, nation: 'JP' },
  // Saudi Arabia Military (710000 - 717FFF)
  { start: 0x710000, end: 0x717FFF, nation: 'SA' },
  // Turkey Military (4B8000 - 4BFFFF)
  { start: 0x4B8000, end: 0x4BFFFF, nation: 'TR' },
  // Sweden Military (4A0000 - 4A7FFF)
  { start: 0x4A0000, end: 0x4A7FFF, nation: 'SE' },
  // Norway Military (480000 - 480FFF)
  { start: 0x477000, end: 0x47FFFF, nation: 'NO' },
  // Poland Military (489000 - 48FFFF)
  { start: 0x489000, end: 0x48FFFF, nation: 'PL' },
];

// Known military callsign prefixes
const MILITARY_CALLSIGN_PREFIXES = [
  'RCH', 'REACH', 'FORTE', 'JAKE', 'DUKE',
  'KNIGHT', 'SWORD', 'SHIELD', 'IRON', 'STEEL',
  'ASCOT', 'SPAR', 'SHUCK', 'MAGMA', 'JOLLY',
  'PEDRO', 'PAVE', 'DARK', 'GHOST', 'VAPOR',
  'DOOM', 'SKULL', 'BONE', 'LANCER', 'SPIRIT',
  'RAPTOR', 'EAGLE', 'VIPER', 'HORNET', 'COBRA',
  'HAVOC', 'HELLCAT', 'THUNDER', 'LIGHTNING',
  'ROCKY', 'REAPER', 'PREDATOR', 'GLOBAL',
  'TOPAZ', 'RUBY', 'DIAMOND', 'PEARL',
  'NATO', 'ALLIED', 'USAF', 'USMIL',
  'HKY', 'GAF', 'CNF', 'IAF', 'RAF',
  'ATLAS', 'BOXER', 'HERKY', 'HERC',
  'ANVIL', 'HAMMER', 'TORCH', 'BLADE',
  'CONVOY', 'NOMAD', 'RANGER', 'RANGER',
  'LOBO', 'WOLF', 'BEAR', 'POLAR',
  'TREK', 'MAVERICK', 'GOOSE', 'ICE',
  'MUSEL', 'VENOM', 'TALON', 'FURY',
  'CLAW', 'FANG', 'HAWK', 'FALCON',
  'OSPREY', 'RAVEN', 'CROW', 'OWL',
  'TIGER', 'LION', 'PANTHER', 'LEOPARD',
  'BRONCO', 'MUSTANG', 'WARHAWK',
  'SAM', 'CAP', 'AWACS', 'JSTAR',
  'TANKER', 'REFUEL', 'GUARD',
];

// Known military aircraft type codes
const MILITARY_TYPE_CODES = new Set([
  // Fighters
  'F16', 'F/A18', 'FA18', 'F18', 'F15', 'F22', 'F35', 'F14',
  'EF18', 'EFT', 'GRIF', 'TPHY', 'EUFI', 'RFAL',
  // Bombers
  'B1', 'B2', 'B52', 'B52H',
  // Transport
  'C130', 'C17', 'C5', 'C2', 'C12', 'C40', 'C37', 'C32',
  'E3TF', 'E3', 'E8', 'E4B',
  // Tankers
  'KC10', 'KC135', 'KC46', 'MRTT', 'KC130',
  // Maritime/Patrol
  'P3', 'P8', 'E2', 'EP3', 'RC135',
  // AWACS/ISR
  'E3TF', 'E2', 'AWAC', 'RC12',
  // Helicopters
  'UH60', 'CH47', 'AH64', 'UH72', 'V22', 'HH60', 'MH60',
  'SH60', 'CH53', 'AH1', 'UH1', 'OH58',
  // Trainers
  'T38', 'T45', 'T6', 'T1',
  // UAV
  'RQ4', 'MQ9', 'RQ1', 'MQ1', 'PRED', 'REAP', 'GLBL',
  // Other
  'U2', 'SR71', 'WC135', 'WP3', 'EC130',
]);

// Suspicious squawk codes (military, emergency, special ops)
// Reserved for future squawk-based detection feature
export const MILITARY_SQUAWKS = new Set([
  '7500', '7600', '7700',
  '0000', '0100', '0200', '0300', '0400', '0500',
  '7776', '7777',
  '4400', '4401', '4402', '4403', '4404', '4405', '4406', '4407',
  '4500', '4501', '4502',
  '6100', '6200', '6300', '6400', '6500',
  '3100', '3200', '3300',
  '2000',
  '1200',
]);

export interface MilitaryDetectionResult {
  confidence: MilitaryConfidence;
  score: number;
  reasons: string[];
}

function isInMilitaryICAORange(hex: string): { result: boolean; nation?: string } {
  const hexNum = parseInt(hex.replace('~', ''), 16);
  if (isNaN(hexNum)) return { result: false };

  for (const range of MILITARY_ICAO_RANGES) {
    if (hexNum >= range.start && hexNum <= range.end) {
      return { result: true, nation: range.nation };
    }
  }
  return { result: false };
}

function checkCallsignPattern(callsign: string): { score: number; reasons: string[] } {
  if (!callsign || callsign.trim() === '') return { score: 0, reasons: [] };

  const cs = callsign.trim().toUpperCase();
  const reasons: string[] = [];
  let score = 0;

  // Check known military prefixes
  for (const prefix of MILITARY_CALLSIGN_PREFIXES) {
    if (cs.startsWith(prefix)) {
      score += 40;
      reasons.push(`Military callsign prefix: ${prefix}`);
      break;
    }
  }

  // Check for military-style numeric callsign patterns (e.g., "RCH123", "FORTE01")
  if (/^[A-Z]{2,6}\d{1,4}$/.test(cs) && score > 0) {
    score += 10;
    reasons.push('Military callsign format');
  }

  // No IATA airline code pattern (military often don't use 3-letter airline codes)
  // Commercial flights typically follow IATACODE + 3-4 digits
  if (/^[A-Z]{3}\d{3,4}[A-Z]?$/.test(cs)) {
    // Looks commercial
    score -= 10;
  }

  return { score: Math.max(0, score), reasons };
}

function checkSuspiciousBehavior(aircraft: RawAircraft): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Very high altitude (reconnaissance/tanker altitudes)
  const alt = typeof aircraft.alt_baro === 'number' ? aircraft.alt_baro : 0;
  if (alt > 50000) {
    score += 25;
    reasons.push(`Extreme altitude: ${alt}ft (possible U-2/SR-71 class)`);
  } else if (alt > 40000) {
    score += 10;
    reasons.push(`High altitude: ${alt}ft`);
  }

  // Very slow speed at altitude (orbiting/surveillance pattern)
  const gs = aircraft.gs || 0;
  if (alt > 15000 && gs > 10 && gs < 150) {
    score += 20;
    reasons.push(`Slow speed at altitude: ${gs}kts (possible surveillance orbit)`);
  }

  // No position data but still transmitting
  if (!aircraft.lat || !aircraft.lon) {
    if (aircraft.flight && aircraft.flight.trim()) {
      score += 5;
      reasons.push('Broadcasting callsign without position');
    }
  }

  // Emergency squawk handling
  if (aircraft.squawk === '7700') {
    score += 5;
    reasons.push('Emergency squawk 7700');
  }

  // Alert or SPI flag
  if (aircraft.alert === 1) {
    score += 10;
    reasons.push('Alert flag active');
  }
  if (aircraft.spi === 1) {
    score += 10;
    reasons.push('SPI (Special Position Identification) active');
  }

  // Unusual roll angles (maneuvering aircraft)
  const roll = Math.abs(aircraft.roll || 0);
  if (roll > 45) {
    score += 15;
    reasons.push(`High bank angle: ${roll.toFixed(0)}° (tactical maneuvering)`);
  }

  // Very high vertical rate (fighter-style climb)
  const vr = Math.abs(aircraft.baro_rate || 0);
  if (vr > 5000) {
    score += 20;
    reasons.push(`Extreme vertical rate: ${aircraft.baro_rate}fpm`);
  }

  // Very high speed
  if (gs > 500) {
    score += 20;
    reasons.push(`High speed: ${gs}kts (possible military jet)`);
  }
  if (gs > 600) {
    score += 15;
    reasons.push(`Extreme speed: ${gs}kts`);
  }

  return { score, reasons };
}

export function detectMilitary(aircraft: RawAircraft): MilitaryDetectionResult {
  const reasons: string[] = [];
  let score = 0;

  // 1. API flag (confirmed by data provider)
  if (aircraft.mil === true) {
    score += 100;
    reasons.push('Flagged as military by ADS-B provider');
  }

  // 2. ICAO hex range check
  const icaoCheck = isInMilitaryICAORange(aircraft.hex || '');
  if (icaoCheck.result) {
    score += 60;
    reasons.push(`Military ICAO address range (${icaoCheck.nation || 'unknown nation'})`);
  }

  // 3. Aircraft type code
  const typeCode = (aircraft.t || '').toUpperCase();
  if (MILITARY_TYPE_CODES.has(typeCode)) {
    score += 50;
    reasons.push(`Known military aircraft type: ${typeCode}`);
  }

  // 4. Callsign pattern
  const callsignCheck = checkCallsignPattern(aircraft.flight || '');
  score += callsignCheck.score;
  reasons.push(...callsignCheck.reasons);

  // 5. dbFlags check (bit 1 = military in ADSBx format)
  if (aircraft.dbFlags && (aircraft.dbFlags & 1) !== 0) {
    score += 70;
    reasons.push('Military flag in aircraft database');
  }

  // 6. Behavioral patterns
  const behaviorCheck = checkSuspiciousBehavior(aircraft);
  score += behaviorCheck.score;
  reasons.push(...behaviorCheck.reasons);

  // 7. LADD/PIA - privacy-protected (often government/military)
  if (aircraft.ladd) {
    score += 30;
    reasons.push('LADD filtered aircraft (law enforcement/government)');
  }
  if (aircraft.pia) {
    score += 20;
    reasons.push('PIA privacy-protected aircraft');
  }

  // 8. No airline operator with unusual callsign
  const hasAirlinePattern = /^[A-Z]{3}\d{3,4}[A-Z]?$/.test((aircraft.flight || '').trim());
  if (!hasAirlinePattern && aircraft.flight && aircraft.flight.trim() && !icaoCheck.result) {
    // Non-standard callsign format
    score += 5;
  }

  // Clamp score
  score = Math.max(0, Math.min(200, score));

  // Determine confidence level
  let confidence: MilitaryConfidence;
  if (score >= 100) {
    confidence = 'confirmed_military';
  } else if (score >= 60) {
    confidence = 'military_likely';
  } else if (score >= 25) {
    confidence = 'suspicious';
  } else {
    confidence = 'civilian';
  }

  return { confidence, score, reasons };
}

export function getMilitaryConfidenceColor(confidence: MilitaryConfidence): string {
  switch (confidence) {
    case 'confirmed_military': return '#ef4444';
    case 'military_likely': return '#f97316';
    case 'suspicious': return '#eab308';
    case 'civilian': return '#22c55e';
  }
}

export function getMilitaryConfidenceLabel(confidence: MilitaryConfidence): string {
  switch (confidence) {
    case 'confirmed_military': return 'CONFIRMED MIL';
    case 'military_likely': return 'MIL LIKELY';
    case 'suspicious': return 'SUSPICIOUS';
    case 'civilian': return 'CIVILIAN';
  }
}
