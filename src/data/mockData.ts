export type EntityType = 'aircraft' | 'ship' | 'base' | 'strategic' | 'alert';
export type Classification = 'military' | 'civilian' | 'unknown';

export interface MapEntity {
  id: string;
  type: EntityType;
  classification: Classification;
  name: string;
  callsign?: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  altitude?: number;
  source: string;
  timestamp: string;
  details: string;
  country?: string;
  flagCode?: string;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  entityIds: string[];
  type: 'cluster' | 'movement' | 'airspace' | 'proximity';
}

export interface ActivityEvent {
  id: string;
  type: EntityType;
  action: string;
  description: string;
  timestamp: string;
  lat: number;
  lng: number;
}

// Middle East region mock data
const BASE_AIRCRAFT: MapEntity[] = [
  { id: 'ac-001', type: 'aircraft', classification: 'military', name: 'F-15E Strike Eagle', callsign: 'VIPER11', lat: 25.9304, lng: 50.2083, heading: 45, speed: 520, altitude: 35000, source: 'ADS-B Exchange', timestamp: new Date().toISOString(), details: 'USAF fighter patrol over Bahrain FIR', country: 'US', flagCode: 'us' },
  { id: 'ac-002', type: 'aircraft', classification: 'military', name: 'C-17 Globemaster III', callsign: 'RCH482', lat: 24.4281, lng: 54.6475, heading: 270, speed: 450, altitude: 32000, source: 'OpenSky Network', timestamp: new Date().toISOString(), details: 'USAF transport en route Al Dhafra AB', country: 'US', flagCode: 'us' },
  { id: 'ac-003', type: 'aircraft', classification: 'military', name: 'P-8A Poseidon', callsign: 'TRIDENT7', lat: 26.1, lng: 56.3, heading: 180, speed: 380, altitude: 25000, source: 'ADS-B Exchange', timestamp: new Date().toISOString(), details: 'Maritime patrol Strait of Hormuz', country: 'US', flagCode: 'us' },
  { id: 'ac-004', type: 'aircraft', classification: 'military', name: 'E-3 Sentry AWACS', callsign: 'DARKSTAR', lat: 28.3, lng: 48.5, heading: 90, speed: 360, altitude: 38000, source: 'ADS-B Exchange', timestamp: new Date().toISOString(), details: 'Airborne early warning orbit', country: 'US', flagCode: 'us' },
  { id: 'ac-005', type: 'aircraft', classification: 'civilian', name: 'Boeing 777-300ER', callsign: 'UAE231', lat: 25.2532, lng: 55.3657, heading: 315, speed: 480, altitude: 36000, source: 'OpenSky Network', timestamp: new Date().toISOString(), details: 'Emirates commercial flight', country: 'AE', flagCode: 'ae' },
  { id: 'ac-006', type: 'aircraft', classification: 'unknown', name: 'Unknown Aircraft', callsign: 'N/A', lat: 27.5, lng: 52.0, heading: 200, speed: 550, altitude: 40000, source: 'ADS-B Exchange', timestamp: new Date().toISOString(), details: 'Transponder intermittent — no ICAO match', country: 'Unknown' },
  { id: 'ac-007', type: 'aircraft', classification: 'military', name: 'KC-135 Stratotanker', callsign: 'TEXACO1', lat: 29.0, lng: 47.5, heading: 120, speed: 400, altitude: 28000, source: 'OpenSky Network', timestamp: new Date().toISOString(), details: 'Aerial refueling track', country: 'US', flagCode: 'us' },
  { id: 'ac-008', type: 'aircraft', classification: 'military', name: 'Eurofighter Typhoon', callsign: 'RSAF42', lat: 24.7, lng: 46.7, heading: 0, speed: 600, altitude: 30000, source: 'ADS-B Exchange', timestamp: new Date().toISOString(), details: 'RSAF training sortie', country: 'SA', flagCode: 'sa' },
];

const BASE_SHIPS: MapEntity[] = [
  { id: 'sh-001', type: 'ship', classification: 'military', name: 'USS Bataan (LHD-5)', lat: 26.5, lng: 56.1, heading: 90, speed: 15, source: 'AIS Data', timestamp: new Date().toISOString(), details: 'Wasp-class amphibious assault ship, Strait of Hormuz transit', country: 'US', flagCode: 'us' },
  { id: 'sh-002', type: 'ship', classification: 'military', name: 'USS Mason (DDG-87)', lat: 12.8, lng: 43.5, heading: 180, speed: 18, source: 'AIS Data', timestamp: new Date().toISOString(), details: 'Arleigh Burke-class destroyer, Bab el-Mandeb patrol', country: 'US', flagCode: 'us' },
  { id: 'sh-003', type: 'ship', classification: 'civilian', name: 'MV Ever Given', lat: 30.0, lng: 32.58, heading: 0, speed: 12, source: 'MarineTraffic', timestamp: new Date().toISOString(), details: 'Container ship, Suez Canal transit', country: 'PA', flagCode: 'pa' },
  { id: 'sh-004', type: 'ship', classification: 'military', name: 'HMS Diamond (D34)', lat: 13.2, lng: 44.0, heading: 270, speed: 20, source: 'AIS Data', timestamp: new Date().toISOString(), details: 'Royal Navy Type 45 destroyer, Red Sea operations', country: 'GB', flagCode: 'gb' },
  { id: 'sh-005', type: 'ship', classification: 'unknown', name: 'Unidentified Vessel', lat: 26.8, lng: 56.5, heading: 45, speed: 8, source: 'AIS Data', timestamp: new Date().toISOString(), details: 'AIS intermittent — possible dark ship', country: 'Unknown' },
];

const BASE_BASES: MapEntity[] = [
  { id: 'ba-001', type: 'base', classification: 'military', name: 'Al Udeid Air Base', lat: 25.1174, lng: 51.315, source: 'Geospatial Dataset', timestamp: new Date().toISOString(), details: 'USAF CENTCOM forward HQ, Qatar', country: 'QA' },
  { id: 'ba-002', type: 'base', classification: 'military', name: 'Al Dhafra Air Base', lat: 24.248, lng: 54.547, source: 'Geospatial Dataset', timestamp: new Date().toISOString(), details: 'USAF base, Abu Dhabi, UAE', country: 'AE' },
  { id: 'ba-003', type: 'base', classification: 'military', name: 'Camp Arifjan', lat: 29.112, lng: 48.095, source: 'Geospatial Dataset', timestamp: new Date().toISOString(), details: 'US Army base, Kuwait', country: 'KW' },
  { id: 'ba-004', type: 'base', classification: 'military', name: 'NSA Bahrain', lat: 26.236, lng: 50.517, source: 'Geospatial Dataset', timestamp: new Date().toISOString(), details: 'US Naval Support Activity, 5th Fleet HQ', country: 'BH' },
  { id: 'ba-005', type: 'base', classification: 'military', name: 'Incirlik Air Base', lat: 37.002, lng: 35.425, source: 'Geospatial Dataset', timestamp: new Date().toISOString(), details: 'USAF & Turkish AF shared base', country: 'TR' },
  { id: 'ba-006', type: 'base', classification: 'military', name: 'Camp Lemonnier', lat: 11.547, lng: 43.152, source: 'Geospatial Dataset', timestamp: new Date().toISOString(), details: 'US military base, Djibouti', country: 'DJ' },
];

const BASE_STRATEGIC: MapEntity[] = [
  { id: 'st-001', type: 'strategic', classification: 'civilian', name: 'Strait of Hormuz', lat: 26.6, lng: 56.25, source: 'Geospatial Dataset', timestamp: new Date().toISOString(), details: 'Critical chokepoint — 21% of global oil transit' },
  { id: 'st-002', type: 'strategic', classification: 'civilian', name: 'Bab el-Mandeb Strait', lat: 12.6, lng: 43.3, source: 'Geospatial Dataset', timestamp: new Date().toISOString(), details: 'Red Sea chokepoint — 10% of global trade' },
  { id: 'st-003', type: 'strategic', classification: 'civilian', name: 'Suez Canal', lat: 30.58, lng: 32.33, source: 'Geospatial Dataset', timestamp: new Date().toISOString(), details: '12% of global trade transits' },
];

const BASE_ALERTS: Alert[] = [
  { id: 'al-001', severity: 'critical', title: 'Aircraft Cluster Detected', description: 'Multiple military aircraft concentrated near Strait of Hormuz. Possible coordinated patrol or exercise.', timestamp: new Date().toISOString(), entityIds: ['ac-003', 'ac-004'], type: 'cluster' },
  { id: 'al-002', severity: 'high', title: 'AIS Dark Ship', description: 'Unidentified vessel with intermittent AIS near Strait of Hormuz. Possible sanctions evasion.', timestamp: new Date().toISOString(), entityIds: ['sh-005'], type: 'movement' },
  { id: 'al-003', severity: 'medium', title: 'NOTAM Active', description: 'Temporary airspace restriction over eastern Saudi Arabia. Military exercise declared.', timestamp: new Date().toISOString(), entityIds: [], type: 'airspace' },
  { id: 'al-004', severity: 'low', title: 'Naval Movement', description: 'USS Bataan transiting Strait of Hormuz eastbound. Routine deployment movement.', timestamp: new Date().toISOString(), entityIds: ['sh-001'], type: 'movement' },
];

const ACTIVITY_EVENTS: ActivityEvent[] = [
  { id: 'ev-001', type: 'aircraft', action: 'TAKEOFF', description: 'F-15E departed Al Dhafra AB', timestamp: new Date(Date.now() - 120000).toISOString(), lat: 24.248, lng: 54.547 },
  { id: 'ev-002', type: 'ship', action: 'TRANSIT', description: 'USS Bataan entered Strait of Hormuz', timestamp: new Date(Date.now() - 300000).toISOString(), lat: 26.5, lng: 56.1 },
  { id: 'ev-003', type: 'aircraft', action: 'ORBIT', description: 'E-3 Sentry established racetrack pattern', timestamp: new Date(Date.now() - 600000).toISOString(), lat: 28.3, lng: 48.5 },
  { id: 'ev-004', type: 'alert', action: 'NOTAM', description: 'Airspace restriction activated — Eastern SA', timestamp: new Date(Date.now() - 900000).toISOString(), lat: 24.0, lng: 48.0 },
  { id: 'ev-005', type: 'ship', action: 'DETECTION', description: 'AIS anomaly — dark vessel Strait of Hormuz', timestamp: new Date(Date.now() - 1200000).toISOString(), lat: 26.8, lng: 56.5 },
  { id: 'ev-006', type: 'aircraft', action: 'REFUEL', description: 'KC-135 established refueling track', timestamp: new Date(Date.now() - 1800000).toISOString(), lat: 29.0, lng: 47.5 },
];

// Utility to add random jitter for real-time simulation
function jitter(val: number, amount: number = 0.02): number {
  return val + (Math.random() - 0.5) * amount * 2;
}

export function getSimulatedEntities(): MapEntity[] {
  const now = new Date().toISOString();
  const moving = [...BASE_AIRCRAFT, ...BASE_SHIPS].map(e => ({
    ...e,
    lat: jitter(e.lat, e.type === 'aircraft' ? 0.05 : 0.01),
    lng: jitter(e.lng, e.type === 'aircraft' ? 0.05 : 0.01),
    heading: e.heading ? e.heading + (Math.random() - 0.5) * 10 : undefined,
    timestamp: now,
  }));
  return [...moving, ...BASE_BASES, ...BASE_STRATEGIC];
}

export function getAlerts(): Alert[] {
  return BASE_ALERTS.map(a => ({ ...a, timestamp: new Date().toISOString() }));
}

export function getActivityFeed(): ActivityEvent[] {
  return ACTIVITY_EVENTS;
}

export function getStats() {
  return {
    totalAircraft: BASE_AIRCRAFT.length,
    totalShips: BASE_SHIPS.length,
    totalBases: BASE_BASES.length,
    militaryAircraft: BASE_AIRCRAFT.filter(a => a.classification === 'military').length,
    militaryShips: BASE_SHIPS.filter(s => s.classification === 'military').length,
    activeAlerts: BASE_ALERTS.filter(a => a.severity === 'critical' || a.severity === 'high').length,
    unknownEntities: [...BASE_AIRCRAFT, ...BASE_SHIPS].filter(e => e.classification === 'unknown').length,
  };
}
