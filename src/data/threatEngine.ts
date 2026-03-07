import { MapEntity } from './mockData';

// ===== THREAT SCORING ENGINE =====

const BASE_LOCATIONS = [
  { lat: 25.1174, lng: 51.315 },  // Al Udeid
  { lat: 24.248, lng: 54.547 },   // Al Dhafra
  { lat: 29.112, lng: 48.095 },   // Camp Arifjan
  { lat: 26.236, lng: 50.517 },   // NSA Bahrain
  { lat: 37.002, lng: 35.425 },   // Incirlik
  { lat: 11.547, lng: 43.152 },   // Camp Lemonnier
];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateThreatScore(entity: MapEntity, allEntities: MapEntity[]): number {
  if (entity.type === 'base' || entity.type === 'strategic') return 0;

  let score = 0;

  // 1. Classification weight
  if (entity.classification === 'unknown') score += 30;
  else if (entity.classification === 'military') score += 10;

  // 2. Proximity to military bases (closer = higher threat)
  const minBaseDist = Math.min(...BASE_LOCATIONS.map(b => haversineDistance(entity.lat, entity.lng, b.lat, b.lng)));
  if (minBaseDist < 50) score += 25;
  else if (minBaseDist < 150) score += 15;
  else if (minBaseDist < 300) score += 5;

  // 3. Clustering — count nearby entities of same type
  const nearby = allEntities.filter(e =>
    e.id !== entity.id &&
    (e.type === 'aircraft' || e.type === 'ship') &&
    haversineDistance(entity.lat, entity.lng, e.lat, e.lng) < 100
  );
  if (nearby.length >= 3) score += 20;
  else if (nearby.length >= 1) score += 10;

  // 4. Speed anomaly
  if (entity.speed) {
    if (entity.type === 'aircraft' && entity.speed > 500) score += 10;
    if (entity.type === 'ship' && entity.speed > 25) score += 15;
    if (entity.type === 'ship' && entity.speed < 3) score += 10; // loitering
  }

  // 5. AIS/transponder issues (simulated via callsign)
  if (entity.callsign === 'N/A' || !entity.callsign) score += 15;

  return Math.min(100, Math.max(0, score));
}

export function getThreatColor(score: number): string {
  if (score >= 80) return '#ef4444'; // red
  if (score >= 60) return '#f97316'; // orange
  if (score >= 30) return '#eab308'; // yellow
  return '#22c55e'; // green
}

export function getThreatLabel(score: number): string {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'ELEVATED';
  return 'LOW';
}

export function getThreatTailwindClass(score: number): string {
  if (score >= 80) return 'text-alert';
  if (score >= 60) return 'text-warning';
  if (score >= 30) return 'text-yellow-400';
  return 'text-primary';
}

// ===== LINK ANALYSIS =====

export interface LinkConnection {
  id: string;
  from: MapEntity;
  to: MapEntity;
  distance: number;
  reason: string;
}

export function findLinks(entities: MapEntity[]): LinkConnection[] {
  const links: LinkConnection[] = [];
  const movingEntities = entities.filter(e => e.type === 'aircraft' || e.type === 'ship');
  const bases = entities.filter(e => e.type === 'base');

  for (let i = 0; i < movingEntities.length; i++) {
    for (let j = i + 1; j < movingEntities.length; j++) {
      const a = movingEntities[i];
      const b = movingEntities[j];
      const dist = haversineDistance(a.lat, a.lng, b.lat, b.lng);

      // Aircraft-to-aircraft proximity (e.g., tanker + fighter)
      if (a.type === 'aircraft' && b.type === 'aircraft' && dist < 80) {
        const isRefuel = a.name.includes('KC-135') || b.name.includes('KC-135') ||
                          a.name.includes('Tanker') || b.name.includes('Tanker');
        links.push({
          id: `${a.id}-${b.id}`,
          from: a, to: b, distance: dist,
          reason: isRefuel ? 'AERIAL REFUELING PROXIMITY' : 'AIRCRAFT CLUSTER',
        });
      }

      // Ship cluster
      if (a.type === 'ship' && b.type === 'ship' && dist < 60) {
        links.push({
          id: `${a.id}-${b.id}`,
          from: a, to: b, distance: dist,
          reason: 'NAVAL FORMATION',
        });
      }

      // Mixed proximity (ship near aircraft patrol)
      if (a.type !== b.type && dist < 50) {
        links.push({
          id: `${a.id}-${b.id}`,
          from: a, to: b, distance: dist,
          reason: 'CROSS-DOMAIN ACTIVITY',
        });
      }
    }

    // Entity near base
    for (const base of bases) {
      const dist = haversineDistance(movingEntities[i].lat, movingEntities[i].lng, base.lat, base.lng);
      if (dist < 60) {
        links.push({
          id: `${movingEntities[i].id}-${base.id}`,
          from: movingEntities[i], to: base, distance: dist,
          reason: 'BASE PROXIMITY',
        });
      }
    }
  }

  return links;
}

// ===== ENHANCED AI ALERTS =====

export function generateSmartAlerts(entities: MapEntity[], links: LinkConnection[]): {
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  type: 'cluster' | 'movement' | 'airspace' | 'proximity';
  entityIds: string[];
}[] {
  const alerts: ReturnType<typeof generateSmartAlerts> = [];

  // Aircraft clusters
  const aircraftLinks = links.filter(l => l.reason === 'AIRCRAFT CLUSTER');
  if (aircraftLinks.length >= 2) {
    alerts.push({
      severity: 'critical',
      title: 'Multi-Aircraft Formation Detected',
      description: `${aircraftLinks.length + 1} military aircraft operating in close proximity. Possible coordinated operation or exercise.`,
      type: 'cluster',
      entityIds: [...new Set(aircraftLinks.flatMap(l => [l.from.id, l.to.id]))],
    });
  }

  // Naval concentration
  const navalLinks = links.filter(l => l.reason === 'NAVAL FORMATION');
  if (navalLinks.length >= 1) {
    alerts.push({
      severity: 'high',
      title: 'Naval Concentration',
      description: `Multiple naval vessels operating in formation. ${navalLinks.map(l => l.from.name).join(', ')}.`,
      type: 'cluster',
      entityIds: [...new Set(navalLinks.flatMap(l => [l.from.id, l.to.id]))],
    });
  }

  // Unknown entities
  const unknowns = entities.filter(e => e.classification === 'unknown');
  unknowns.forEach(u => {
    alerts.push({
      severity: 'high',
      title: `Unidentified ${u.type === 'aircraft' ? 'Aircraft' : 'Vessel'}`,
      description: `${u.name} — ${u.details}. Threat assessment required.`,
      type: 'movement',
      entityIds: [u.id],
    });
  });

  // Base proximity alerts
  const baseProx = links.filter(l => l.reason === 'BASE PROXIMITY' && l.from.classification !== 'civilian');
  baseProx.forEach(l => {
    alerts.push({
      severity: 'medium',
      title: `Activity Near ${l.to.name}`,
      description: `${l.from.name} operating ${Math.round(l.distance)}km from ${l.to.name}.`,
      type: 'proximity',
      entityIds: [l.from.id, l.to.id],
    });
  });

  // Refueling operations
  const refuelLinks = links.filter(l => l.reason === 'AERIAL REFUELING PROXIMITY');
  refuelLinks.forEach(l => {
    alerts.push({
      severity: 'low',
      title: 'Aerial Refueling Operation',
      description: `${l.from.name} and ${l.to.name} in refueling proximity at ${Math.round(l.distance)}km separation.`,
      type: 'movement',
      entityIds: [l.from.id, l.to.id],
    });
  });

  return alerts;
}
