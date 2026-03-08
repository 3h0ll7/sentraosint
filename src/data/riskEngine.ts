import { MapEntity } from '@/data/mockData';
import { GlobalEvent } from '@/hooks/useGlobalEvents';

export interface RiskPoint {
  lat: number;
  lng: number;
  intensity: number; // 0-1
  score: number; // 0-100
  breakdown: {
    military: number;
    disaster: number;
    economy: number;
    health: number;
    news: number;
  };
}

// Grid cell size in degrees (~50km at equator)
const CELL_SIZE = 2;
const INFLUENCE_RADIUS = 5; // degrees

// Weights for risk formula
const WEIGHTS = {
  military: 0.35,
  disaster: 0.25,
  economy: 0.15,
  health: 0.15,
  news: 0.10,
};

function gaussianInfluence(distance: number, radius: number): number {
  return Math.exp(-(distance * distance) / (2 * (radius / 2.5) ** 2));
}

function distance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return Math.sqrt((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2);
}

interface GridCell {
  lat: number;
  lng: number;
  military: number;
  disaster: number;
  economy: number;
  health: number;
  news: number;
}

export function calculateRiskHeatmap(
  entities: MapEntity[],
  globalEvents: GlobalEvent[],
): RiskPoint[] {
  // Build grid covering active data regions
  const allLats = [
    ...entities.map(e => e.lat),
    ...globalEvents.filter(e => e.lat != null).map(e => e.lat!),
  ];
  const allLngs = [
    ...entities.map(e => e.lng),
    ...globalEvents.filter(e => e.lng != null).map(e => e.lng!),
  ];

  if (allLats.length === 0) return [];

  const minLat = Math.floor(Math.min(...allLats) - 5);
  const maxLat = Math.ceil(Math.max(...allLats) + 5);
  const minLng = Math.floor(Math.min(...allLngs) - 5);
  const maxLng = Math.ceil(Math.max(...allLngs) + 5);

  // Initialize grid
  const cells: GridCell[] = [];
  for (let lat = minLat; lat <= maxLat; lat += CELL_SIZE) {
    for (let lng = minLng; lng <= maxLng; lng += CELL_SIZE) {
      cells.push({ lat, lng, military: 0, disaster: 0, economy: 0, health: 0, news: 0 });
    }
  }

  // Accumulate military signals from entities
  const militaryEntities = entities.filter(
    e => e.classification === 'military' || e.classification === 'unknown'
  );
  const bases = entities.filter(e => e.type === 'base');

  for (const cell of cells) {
    // Military activity
    for (const e of militaryEntities) {
      const d = distance(cell.lat, cell.lng, e.lat, e.lng);
      if (d > INFLUENCE_RADIUS) continue;
      const influence = gaussianInfluence(d, INFLUENCE_RADIUS);
      const entityWeight = e.type === 'aircraft' ? 15 : e.type === 'ship' ? 12 : e.type === 'base' ? 20 : 8;
      const threatBonus = (e.threatScore ?? 0) / 100 * 15;
      const classBonus = e.classification === 'unknown' ? 10 : e.classification === 'military' ? 5 : 0;
      cell.military += (entityWeight + threatBonus + classBonus) * influence;
    }

    // Base proximity amplifier
    for (const b of bases) {
      const d = distance(cell.lat, cell.lng, b.lat, b.lng);
      if (d < 3) {
        cell.military += 15 * gaussianInfluence(d, 3);
      }
    }

    // Global events
    for (const ev of globalEvents) {
      if (ev.lat == null || ev.lng == null) continue;
      const d = distance(cell.lat, cell.lng, ev.lat, ev.lng);
      if (d > INFLUENCE_RADIUS) continue;
      const influence = gaussianInfluence(d, INFLUENCE_RADIUS);
      const severityWeight = ev.severity === 'critical' ? 25 : ev.severity === 'high' ? 18 : ev.severity === 'medium' ? 10 : 5;
      const breakingBonus = ev.is_breaking ? 10 : 0;

      switch (ev.category) {
        case 'military':
          cell.military += (severityWeight + breakingBonus) * influence;
          break;
        case 'disaster':
          cell.disaster += (severityWeight + breakingBonus) * influence;
          break;
        case 'economy':
        case 'trade':
          cell.economy += (severityWeight + breakingBonus) * influence;
          break;
        case 'health':
          cell.health += (severityWeight + breakingBonus) * influence;
          break;
        case 'political':
          cell.news += (severityWeight + breakingBonus) * influence;
          break;
      }

      // All events contribute to news intensity
      cell.news += 3 * influence;
    }
  }

  // Normalize each dimension and compute final score
  const maxMil = Math.max(1, ...cells.map(c => c.military));
  const maxDis = Math.max(1, ...cells.map(c => c.disaster));
  const maxEco = Math.max(1, ...cells.map(c => c.economy));
  const maxHea = Math.max(1, ...cells.map(c => c.health));
  const maxNew = Math.max(1, ...cells.map(c => c.news));

  const riskPoints: RiskPoint[] = [];

  for (const cell of cells) {
    const normMil = Math.min(100, (cell.military / maxMil) * 100);
    const normDis = Math.min(100, (cell.disaster / maxDis) * 100);
    const normEco = Math.min(100, (cell.economy / maxEco) * 100);
    const normHea = Math.min(100, (cell.health / maxHea) * 100);
    const normNew = Math.min(100, (cell.news / maxNew) * 100);

    const score = Math.min(100, Math.round(
      WEIGHTS.military * normMil +
      WEIGHTS.disaster * normDis +
      WEIGHTS.economy * normEco +
      WEIGHTS.health * normHea +
      WEIGHTS.news * normNew
    ));

    if (score < 5) continue; // Skip very low risk cells

    riskPoints.push({
      lat: cell.lat,
      lng: cell.lng,
      intensity: score / 100,
      score,
      breakdown: {
        military: Math.round(normMil),
        disaster: Math.round(normDis),
        economy: Math.round(normEco),
        health: Math.round(normHea),
        news: Math.round(normNew),
      },
    });
  }

  return riskPoints;
}

export function getRiskColor(score: number): string {
  if (score >= 80) return '#ff0000';
  if (score >= 60) return '#ff6600';
  if (score >= 40) return '#ffcc00';
  if (score >= 20) return '#00cc33';
  return '#0066ff';
}

export function getRiskLabel(score: number): string {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MODERATE';
  if (score >= 20) return 'LOW';
  return 'VERY LOW';
}
