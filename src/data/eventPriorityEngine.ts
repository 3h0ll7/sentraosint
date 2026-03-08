import { GlobalEvent } from '@/hooks/useGlobalEvents';

// ============ STRATEGIC REGIONS ============
const STRATEGIC_REGIONS = [
  { name: 'Strait of Hormuz', lat: 26.5, lng: 56.3, radius: 3 },
  { name: 'Taiwan Strait', lat: 24.0, lng: 119.5, radius: 3 },
  { name: 'Suez Canal', lat: 30.5, lng: 32.3, radius: 2 },
  { name: 'South China Sea', lat: 14.0, lng: 114.0, radius: 8 },
  { name: 'Bab el-Mandeb', lat: 12.6, lng: 43.3, radius: 2 },
  { name: 'Malacca Strait', lat: 2.5, lng: 101.5, radius: 3 },
  { name: 'Black Sea', lat: 43.5, lng: 34.0, radius: 5 },
  { name: 'Baltic Sea', lat: 58.0, lng: 20.0, radius: 4 },
  { name: 'Persian Gulf', lat: 27.0, lng: 51.0, radius: 5 },
  { name: 'Korean Peninsula', lat: 37.5, lng: 127.0, radius: 3 },
];

// ============ KEYWORD DICTIONARIES ============
const MILITARY_KEYWORDS = [
  'military', 'troops', 'naval', 'missile', 'weapon', 'strike', 'deploy',
  'warship', 'fighter jet', 'bomber', 'nuclear', 'army', 'airforce', 'navy',
  'escalation', 'conflict', 'war', 'invasion', 'drone strike', 'airstrike',
  'artillery', 'tank', 'combat', 'battalion', 'carrier', 'submarine',
  'ballistic', 'intercept', 'defense system', 'nato', 'mobilization',
];

const ECONOMIC_KEYWORDS = [
  'oil', 'crude', 'market crash', 'recession', 'inflation', 'sanctions',
  'trade war', 'supply chain', 'shortage', 'embargo', 'tariff', 'default',
  'stock', 'currency', 'gdp', 'central bank', 'interest rate', 'commodity',
  'energy crisis', 'gas price', 'opec', 'pipeline', 'export ban',
];

const HEALTH_KEYWORDS = [
  'pandemic', 'outbreak', 'virus', 'who', 'epidemic', 'disease',
  'infection', 'quarantine', 'vaccine', 'health emergency', 'mortality',
  'transmission', 'pathogen', 'biosecurity', 'contagion',
];

const MEDIA_BOOST_KEYWORDS = [
  'breaking', 'urgent', 'alert', 'emergency', 'unprecedented', 'crisis',
  'major', 'global', 'critical', 'massive', 'catastrophic', 'historic',
];

// ============ SCORING FUNCTIONS ============

function scoreMediaCoverage(event: GlobalEvent): number {
  const text = `${event.title} ${event.description ?? ''}`.toLowerCase();
  let score = 0;

  // Breaking flag = high media coverage signal
  if (event.is_breaking) score += 35;

  // Severity as proxy for media attention
  if (event.severity === 'critical') score += 30;
  else if (event.severity === 'high') score += 20;
  else if (event.severity === 'medium') score += 10;

  // Urgency keywords
  const boostCount = MEDIA_BOOST_KEYWORDS.filter(k => text.includes(k)).length;
  score += Math.min(35, boostCount * 12);

  return Math.min(100, score);
}

function scoreGeographicImportance(event: GlobalEvent): number {
  if (event.lat == null || event.lng == null) return 10;

  let maxScore = 0;
  for (const region of STRATEGIC_REGIONS) {
    const dist = Math.sqrt(
      Math.pow(event.lat - region.lat, 2) + Math.pow(event.lng - region.lng, 2)
    );
    if (dist <= region.radius) {
      maxScore = 100;
      break;
    } else if (dist <= region.radius * 2) {
      maxScore = Math.max(maxScore, 60);
    } else if (dist <= region.radius * 3) {
      maxScore = Math.max(maxScore, 30);
    }
  }

  return maxScore;
}

function scoreEconomicImpact(event: GlobalEvent): number {
  const text = `${event.title} ${event.description ?? ''}`.toLowerCase();
  let score = 0;

  if (event.category === 'economy' || event.category === 'trade') score += 30;

  const matchCount = ECONOMIC_KEYWORDS.filter(k => text.includes(k)).length;
  score += Math.min(70, matchCount * 15);

  return Math.min(100, score);
}

function scoreMilitarySignificance(event: GlobalEvent): number {
  const text = `${event.title} ${event.description ?? ''}`.toLowerCase();
  let score = 0;

  if (event.category === 'military') score += 40;

  const matchCount = MILITARY_KEYWORDS.filter(k => text.includes(k)).length;
  score += Math.min(60, matchCount * 12);

  return Math.min(100, score);
}

function scoreHealthRisk(event: GlobalEvent): number {
  const text = `${event.title} ${event.description ?? ''}`.toLowerCase();
  let score = 0;

  if (event.category === 'health') score += 40;

  const matchCount = HEALTH_KEYWORDS.filter(k => text.includes(k)).length;
  score += Math.min(60, matchCount * 15);

  return Math.min(100, score);
}

// ============ MAIN PRIORITY CALCULATOR ============

export interface ScoredEvent extends GlobalEvent {
  priorityScore: number;
  priorityLevel: 'critical' | 'high' | 'normal';
  signals: {
    media: number;
    geographic: number;
    economic: number;
    military: number;
    health: number;
  };
}

const WEIGHTS = {
  media: 0.30,
  geographic: 0.25,
  economic: 0.20,
  military: 0.15,
  health: 0.10,
};

export function calculateEventPriority(event: GlobalEvent): ScoredEvent {
  const signals = {
    media: scoreMediaCoverage(event),
    geographic: scoreGeographicImportance(event),
    economic: scoreEconomicImpact(event),
    military: scoreMilitarySignificance(event),
    health: scoreHealthRisk(event),
  };

  const priorityScore = Math.round(
    signals.media * WEIGHTS.media +
    signals.geographic * WEIGHTS.geographic +
    signals.economic * WEIGHTS.economic +
    signals.military * WEIGHTS.military +
    signals.health * WEIGHTS.health
  );

  const priorityLevel: ScoredEvent['priorityLevel'] =
    priorityScore >= 80 ? 'critical' :
    priorityScore >= 60 ? 'high' :
    'normal';

  return { ...event, priorityScore, priorityLevel, signals };
}

/**
 * Filter and rank global events for the Breaking Intel panel.
 * - Excludes disaster category (earthquakes, wildfires, etc.)
 * - Only shows events with priority score >= 40
 * - Returns top 10 sorted by priority score descending
 */
export function getTopIntelEvents(events: GlobalEvent[]): ScoredEvent[] {
  return events
    .filter(e => e.category !== 'disaster') // No natural disasters in Breaking Intel
    .map(calculateEventPriority)
    .filter(e => e.priorityScore >= 40)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 10);
}
