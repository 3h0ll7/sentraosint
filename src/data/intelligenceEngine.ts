import { MapEntity } from '@/data/mockData';
import { GlobalEvent } from '@/hooks/useGlobalEvents';
import { LinkConnection } from '@/data/threatEngine';

// ============ GLOBAL STABILITY INDEX ============
export interface StabilityIndex {
  score: number; // 0-100, higher = more stable
  trend: 'stable' | 'rising tension' | 'declining tension' | 'critical';
  factors: {
    military: number;
    disaster: number;
    economy: number;
    health: number;
    news: number;
  };
}

export function calculateStabilityIndex(
  entities: MapEntity[],
  events: GlobalEvent[],
): StabilityIndex {
  const milEntities = entities.filter(e => e.classification === 'military' || e.classification === 'unknown');
  const militaryPressure = Math.min(100, milEntities.length * 5 +
    milEntities.reduce((s, e) => s + (e.threatScore ?? 0), 0) / Math.max(1, milEntities.length));

  const disasterEvents = events.filter(e => e.category === 'disaster');
  const disasterPressure = Math.min(100, disasterEvents.length * 8 +
    disasterEvents.filter(e => e.severity === 'critical').length * 20);

  const econEvents = events.filter(e => e.category === 'economy' || e.category === 'trade');
  const econPressure = Math.min(100, econEvents.length * 10 +
    econEvents.filter(e => e.severity === 'critical').length * 25);

  const healthEvents = events.filter(e => e.category === 'health');
  const healthPressure = Math.min(100, healthEvents.length * 12 +
    healthEvents.filter(e => e.is_breaking).length * 20);

  const breakingCount = events.filter(e => e.is_breaking).length;
  const criticalCount = events.filter(e => e.severity === 'critical').length;
  const newsPressure = Math.min(100, breakingCount * 8 + criticalCount * 12);

  const instability =
    0.35 * militaryPressure +
    0.25 * disasterPressure +
    0.15 * econPressure +
    0.15 * healthPressure +
    0.10 * newsPressure;

  const score = Math.max(0, Math.min(100, Math.round(100 - instability)));

  const trend: StabilityIndex['trend'] =
    score < 25 ? 'critical' :
    score < 45 ? 'rising tension' :
    score < 70 ? 'stable' :
    'declining tension';

  return {
    score,
    trend,
    factors: {
      military: Math.round(militaryPressure),
      disaster: Math.round(disasterPressure),
      economy: Math.round(econPressure),
      health: Math.round(healthPressure),
      news: Math.round(newsPressure),
    },
  };
}

// ============ HOTTEST REGION ============
export interface HottestRegion {
  lat: number;
  lng: number;
  score: number;
  label: string;
}

export function findHottestRegion(
  entities: MapEntity[],
  events: GlobalEvent[],
): HottestRegion | null {
  const points: { lat: number; lng: number; weight: number }[] = [];

  entities.forEach(e => {
    const w = e.classification === 'military' ? 3 : e.classification === 'unknown' ? 4 : 1;
    points.push({ lat: e.lat, lng: e.lng, weight: w + (e.threatScore ?? 0) / 20 });
  });

  events.forEach(e => {
    if (e.lat == null || e.lng == null) return;
    const w = e.severity === 'critical' ? 8 : e.severity === 'high' ? 5 : e.severity === 'medium' ? 3 : 1;
    points.push({ lat: e.lat, lng: e.lng, weight: w * (e.is_breaking ? 2 : 1) });
  });

  if (points.length === 0) return null;

  // Grid-based density calculation
  const CELL = 3;
  const cells: Record<string, { lat: number; lng: number; total: number; count: number }> = {};

  points.forEach(p => {
    const key = `${Math.floor(p.lat / CELL)},${Math.floor(p.lng / CELL)}`;
    if (!cells[key]) cells[key] = { lat: 0, lng: 0, total: 0, count: 0 };
    cells[key].lat += p.lat;
    cells[key].lng += p.lng;
    cells[key].total += p.weight;
    cells[key].count++;
  });

  let best: { lat: number; lng: number; total: number; count: number } | null = null;
  for (const c of Object.values(cells)) {
    if (!best || c.total > best.total) best = c;
  }

  if (!best) return null;

  return {
    lat: best.lat / best.count,
    lng: best.lng / best.count,
    score: Math.round(best.total),
    label: `${best.count} signals detected`,
  };
}

// ============ GLOBAL CONCERNS ============
export interface GlobalConcern {
  topic: string;
  intensity: number;
  category: string;
  eventCount: number;
  sentiment: 'negative' | 'neutral' | 'critical';
}

const KEYWORD_CLUSTERS: Record<string, string[]> = {
  'Armed Conflict': ['military', 'war', 'conflict', 'attack', 'strike', 'bomb', 'missile', 'weapon', 'combat', 'troops'],
  'Naval Tensions': ['navy', 'naval', 'ship', 'strait', 'maritime', 'vessel', 'fleet', 'blockade', 'patrol'],
  'Earthquake': ['earthquake', 'seismic', 'quake', 'tremor', 'magnitude', 'richter'],
  'Natural Disaster': ['flood', 'hurricane', 'typhoon', 'tornado', 'wildfire', 'volcano', 'tsunami', 'storm'],
  'Economic Crisis': ['sanctions', 'crash', 'recession', 'inflation', 'debt', 'crisis', 'collapse', 'default'],
  'Trade Disruption': ['trade', 'supply chain', 'embargo', 'tariff', 'shortage', 'export', 'import'],
  'Pandemic': ['outbreak', 'virus', 'pandemic', 'epidemic', 'disease', 'infection', 'WHO', 'health emergency'],
  'Political Instability': ['coup', 'protest', 'election', 'regime', 'unrest', 'revolution', 'government'],
  'Energy Crisis': ['oil', 'gas', 'energy', 'pipeline', 'OPEC', 'fuel', 'power'],
  'Cyber Threat': ['cyber', 'hack', 'breach', 'ransomware', 'malware', 'infrastructure'],
};

export function analyzeGlobalConcerns(events: GlobalEvent[]): GlobalConcern[] {
  const concerns: GlobalConcern[] = [];

  for (const [topic, keywords] of Object.entries(KEYWORD_CLUSTERS)) {
    const matching = events.filter(e => {
      const text = `${e.title} ${e.description ?? ''}`.toLowerCase();
      return keywords.some(k => text.includes(k));
    });

    if (matching.length === 0) continue;

    const critCount = matching.filter(e => e.severity === 'critical').length;
    const highCount = matching.filter(e => e.severity === 'high').length;
    const breakingCount = matching.filter(e => e.is_breaking).length;

    const intensity = Math.min(100, matching.length * 8 + critCount * 15 + highCount * 8 + breakingCount * 10);

    concerns.push({
      topic,
      intensity,
      category: matching[0].category,
      eventCount: matching.length,
      sentiment: critCount > 0 ? 'critical' : highCount > 1 ? 'negative' : 'neutral',
    });
  }

  return concerns.sort((a, b) => b.intensity - a.intensity).slice(0, 10);
}

// ============ CORRELATION ENGINE ============
export interface CorrelationInsight {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  signals: string[];
  confidence: number;
}

export function detectCorrelations(
  entities: MapEntity[],
  events: GlobalEvent[],
  links: LinkConnection[],
): CorrelationInsight[] {
  const insights: CorrelationInsight[] = [];

  // Correlation 1: Naval movement + trade disruption near straits
  const navalMil = entities.filter(e => e.type === 'ship' && e.classification === 'military');
  const tradeEvents = events.filter(e => e.category === 'trade' || e.category === 'economy');
  const straits = entities.filter(e => e.type === 'strategic');

  if (navalMil.length >= 2 && tradeEvents.length > 0) {
    const nearStrait = straits.some(s =>
      navalMil.some(n => Math.abs(n.lat - s.lat) < 3 && Math.abs(n.lng - s.lng) < 3)
    );
    if (nearStrait) {
      insights.push({
        id: 'corr-naval-trade',
        title: 'Naval-Trade Correlation Detected',
        description: `${navalMil.length} military vessels near strategic chokepoints coinciding with ${tradeEvents.length} trade/economic events. Possible supply chain disruption risk.`,
        severity: 'high',
        signals: ['Naval deployment', 'Trade disruption', 'Chokepoint proximity'],
        confidence: 75,
      });
    }
  }

  // Correlation 2: Aircraft clustering + unknown entities
  const unknowns = entities.filter(e => e.classification === 'unknown');
  const milAircraft = entities.filter(e => e.type === 'aircraft' && e.classification === 'military');
  if (unknowns.length > 0 && milAircraft.length >= 3) {
    const nearUnknown = unknowns.some(u =>
      milAircraft.filter(a => Math.abs(a.lat - u.lat) < 2 && Math.abs(a.lng - u.lng) < 2).length >= 2
    );
    if (nearUnknown) {
      insights.push({
        id: 'corr-aircraft-unknown',
        title: 'Intercept Pattern Detected',
        description: `Military aircraft converging near unidentified entity. Possible intercept or identification operation.`,
        severity: 'critical',
        signals: ['Aircraft clustering', 'Unknown entity', 'Convergence pattern'],
        confidence: 82,
      });
    }
  }

  // Correlation 3: Disaster + military deployment
  const disasters = events.filter(e => e.category === 'disaster' && (e.severity === 'critical' || e.severity === 'high'));
  if (disasters.length > 0 && milAircraft.length >= 2) {
    insights.push({
      id: 'corr-disaster-mil',
      title: 'Disaster Response Mobilization',
      description: `${disasters.length} severe disaster events detected with ${milAircraft.length} military aircraft active. Possible humanitarian response deployment.`,
      severity: 'medium',
      signals: ['Disaster event', 'Military airlift', 'Response pattern'],
      confidence: 65,
    });
  }

  // Correlation 4: High link density = formation
  if (links.length >= 4) {
    insights.push({
      id: 'corr-formation',
      title: 'Coordinated Formation Detected',
      description: `${links.length} proximity links between military assets suggest coordinated deployment or exercise.`,
      severity: 'high',
      signals: ['Link density', 'Proximity clustering', 'Formation pattern'],
      confidence: 70,
    });
  }

  return insights;
}

// ============ AI PATTERN DETECTION ============
export interface PatternAlert {
  id: string;
  pattern: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  entities: string[];
}

export function detectPatterns(entities: MapEntity[], events: GlobalEvent[]): PatternAlert[] {
  const patterns: PatternAlert[] = [];

  // Pattern 1: Military clustering
  const milEntities = entities.filter(e => (e.type === 'aircraft' || e.type === 'ship') && e.classification === 'military');
  const clusters: Record<string, MapEntity[]> = {};

  milEntities.forEach(e => {
    const key = `${Math.floor(e.lat / 2)},${Math.floor(e.lng / 2)}`;
    if (!clusters[key]) clusters[key] = [];
    clusters[key].push(e);
  });

  for (const [, group] of Object.entries(clusters)) {
    if (group.length >= 3) {
      patterns.push({
        id: `pat-cluster-${group[0].id}`,
        pattern: 'Unusual Military Clustering',
        description: `${group.length} military assets detected in close proximity: ${group.map(g => g.name).slice(0, 3).join(', ')}`,
        severity: group.length >= 5 ? 'critical' : 'high',
        entities: group.map(g => g.id),
      });
    }
  }

  // Pattern 2: High-speed unknown
  const fastUnknowns = entities.filter(e => e.classification === 'unknown' && (e.speed ?? 0) > 400);
  if (fastUnknowns.length > 0) {
    patterns.push({
      id: 'pat-fast-unknown',
      pattern: 'High-Speed Unidentified Track',
      description: `${fastUnknowns.length} unidentified high-speed object(s) detected. Speed exceeds civilian norms.`,
      severity: 'critical',
      entities: fastUnknowns.map(e => e.id),
    });
  }

  // Pattern 3: Event surge
  const recentEvents = events.filter(e => {
    const age = Date.now() - new Date(e.created_at).getTime();
    return age < 3600000; // last hour
  });
  if (recentEvents.length >= 8) {
    patterns.push({
      id: 'pat-event-surge',
      pattern: 'Event Surge Detected',
      description: `${recentEvents.length} events in the last hour across ${new Set(recentEvents.map(e => e.category)).size} categories. Elevated global activity.`,
      severity: recentEvents.filter(e => e.severity === 'critical').length >= 2 ? 'critical' : 'medium',
      entities: [],
    });
  }

  return patterns;
}
