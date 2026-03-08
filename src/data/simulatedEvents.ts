// Simulated global events for categories where we don't have real APIs
export interface SimulatedGlobalEvent {
  category: 'military' | 'economy' | 'trade' | 'health' | 'disaster' | 'political';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  source: string;
  country: string;
  lat: number;
  lng: number;
  is_breaking: boolean;
}

const SIMULATED_EVENTS: SimulatedGlobalEvent[] = [
  // Military / Conflict
  { category: 'military', severity: 'critical', title: 'Large-Scale Military Exercise — Eastern Mediterranean', description: 'NATO conducts multinational naval exercise involving 12 warships and 40 aircraft in eastern Mediterranean waters.', source: 'GDELT', country: 'International', lat: 34.5, lng: 28.0, is_breaking: true },
  { category: 'military', severity: 'high', title: 'Airspace Restriction — Black Sea Region', description: 'Multiple NOTAMs issued for Black Sea airspace. Commercial flights rerouted.', source: 'NOTAM Feed', country: 'Ukraine', lat: 44.0, lng: 34.0, is_breaking: false },
  { category: 'military', severity: 'medium', title: 'Troop Movements Reported — Korean DMZ', description: 'Satellite imagery shows increased military vehicle activity near the demilitarized zone.', source: 'Sentinel Hub', country: 'South Korea', lat: 37.95, lng: 126.95, is_breaking: false },
  { category: 'military', severity: 'high', title: 'Naval Buildup — South China Sea', description: 'AIS data shows unusual concentration of 8 naval vessels near Spratly Islands.', source: 'AIS Data', country: 'China', lat: 10.0, lng: 114.0, is_breaking: true },

  // Economy
  { category: 'economy', severity: 'high', title: 'New Sanctions Package — Russian Energy Sector', description: 'EU announces 14th sanctions package targeting Russian LNG exports and shipping insurance.', source: 'Reuters', country: 'Russia', lat: 55.75, lng: 37.62, is_breaking: true },
  { category: 'economy', severity: 'medium', title: 'Currency Crisis — Argentine Peso Falls 12%', description: 'Argentine peso drops sharply amid central bank reserve depletion.', source: 'Bloomberg', country: 'Argentina', lat: -34.6, lng: -58.38, is_breaking: false },
  { category: 'economy', severity: 'low', title: 'Fed Rate Decision — Hold at 5.25%', description: 'US Federal Reserve holds interest rates steady, signals potential cut in Q3.', source: 'Federal Reserve', country: 'United States', lat: 38.89, lng: -77.03, is_breaking: false },

  // Trade
  { category: 'trade', severity: 'critical', title: 'Suez Canal Blockage — Container Ship Grounded', description: 'Major container vessel runs aground in Suez Canal. 40+ ships waiting for transit.', source: 'MarineTraffic', country: 'Egypt', lat: 30.58, lng: 32.33, is_breaking: true },
  { category: 'trade', severity: 'high', title: 'Port Congestion — Shanghai', description: 'Shanghai port reports 15-day delay for container processing. Supply chain impact expected.', source: 'Port Authority', country: 'China', lat: 31.23, lng: 121.47, is_breaking: false },
  { category: 'trade', severity: 'medium', title: 'Panama Canal Drought Restrictions', description: 'Daily transit slots reduced to 24 due to low water levels. Shipping costs rising.', source: 'Panama Canal Authority', country: 'Panama', lat: 9.08, lng: -79.68, is_breaking: false },

  // Health
  { category: 'health', severity: 'high', title: 'WHO Declares H5N1 Public Health Emergency', description: 'World Health Organization raises alert level for avian influenza following human transmission cases.', source: 'WHO', country: 'International', lat: 46.23, lng: 6.14, is_breaking: true },
  { category: 'health', severity: 'medium', title: 'Cholera Outbreak — Sub-Saharan Africa', description: 'Multiple countries report spike in cholera cases. 12,000+ cases in past month.', source: 'WHO AFRO', country: 'Mozambique', lat: -25.97, lng: 32.58, is_breaking: false },
  { category: 'health', severity: 'low', title: 'Dengue Surge — Southeast Asia', description: 'Thailand and Vietnam report above-average dengue cases for the season.', source: 'ProMED', country: 'Thailand', lat: 13.75, lng: 100.5, is_breaking: false },

  // Political
  { category: 'political', severity: 'high', title: 'Coup Attempt Reported — West Africa', description: 'Military forces seize state broadcaster and government buildings in capital city.', source: 'Al Jazeera', country: 'Niger', lat: 13.51, lng: 2.11, is_breaking: true },
  { category: 'political', severity: 'medium', title: 'Mass Protests — Tbilisi', description: 'Over 100,000 protesters rally against foreign agents law in Georgian capital.', source: 'Reuters', country: 'Georgia', lat: 41.72, lng: 44.79, is_breaking: false },
  { category: 'political', severity: 'low', title: 'UN Security Council Emergency Session', description: 'Emergency UNSC session called to discuss escalation in Middle East conflict.', source: 'UN News', country: 'International', lat: 40.75, lng: -73.97, is_breaking: false },

  // More disasters (supplement USGS)
  { category: 'disaster', severity: 'critical', title: 'Category 4 Hurricane — Caribbean', description: 'Hurricane with 150mph winds approaching Lesser Antilles. Evacuation orders issued.', source: 'NOAA NHC', country: 'Caribbean', lat: 16.0, lng: -61.5, is_breaking: true },
  { category: 'disaster', severity: 'high', title: 'Wildfire Complex — Southern California', description: 'Multiple wildfires burning across 50,000 acres. 20,000 homes under evacuation.', source: 'NASA FIRMS', country: 'United States', lat: 34.05, lng: -118.24, is_breaking: true },
  { category: 'disaster', severity: 'medium', title: 'Flooding — Yangtze River Basin', description: 'Heavy rainfall causes severe flooding. Three Gorges Dam at near capacity.', source: 'GDACS', country: 'China', lat: 30.58, lng: 114.27, is_breaking: false },
];

function jitter(val: number, amount = 0.1): number {
  return val + (Math.random() - 0.5) * amount * 2;
}

export function getSimulatedGlobalEvents(): SimulatedGlobalEvent[] {
  // Return a random subset with slight coordinate jitter
  const shuffled = [...SIMULATED_EVENTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 12 + Math.floor(Math.random() * 6)).map(e => ({
    ...e,
    lat: jitter(e.lat),
    lng: jitter(e.lng),
  }));
}
