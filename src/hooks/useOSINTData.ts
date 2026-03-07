import { useEffect, useState, useCallback, useRef } from 'react';
import { MapEntity, Alert, ActivityEvent, getSimulatedEntities, getAlerts, getActivityFeed, getStats } from '@/data/mockData';
import { calculateThreatScore, findLinks, generateSmartAlerts, LinkConnection } from '@/data/threatEngine';

export type TrailPoint = { lat: number; lng: number; timestamp: number };
export type TrailHistory = Record<string, TrailPoint[]>;

const MAX_TRAIL_POINTS = 20;

export function useOSINTData(refreshInterval = 5000) {
  const [entities, setEntities] = useState<MapEntity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [stats, setStats] = useState(getStats());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLive, setIsLive] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showLinks, setShowLinks] = useState(true);
  const [links, setLinks] = useState<LinkConnection[]>([]);
  const trailsRef = useRef<TrailHistory>({});
  const [trails, setTrails] = useState<TrailHistory>({});

  // Timeline replay state
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);

  const refresh = useCallback(() => {
    const rawEntities = getSimulatedEntities();

    // Calculate threat scores
    const scoredEntities = rawEntities.map(e => ({
      ...e,
      threatScore: calculateThreatScore(e, rawEntities),
    }));

    // Find link connections
    const entityLinks = findLinks(scoredEntities);

    // Generate smart alerts
    const smartAlerts = generateSmartAlerts(scoredEntities, entityLinks);
    const baseAlerts = getAlerts();
    const mergedAlerts: Alert[] = [
      ...smartAlerts.map((a, i) => ({
        id: `smart-${i}`,
        ...a,
        timestamp: new Date().toISOString(),
      })),
      ...baseAlerts.filter(ba => !smartAlerts.some(sa => sa.title === ba.title)),
    ];

    // Record trails
    const now = Date.now();
    scoredEntities.forEach(e => {
      if (e.type === 'aircraft' || e.type === 'ship') {
        if (!trailsRef.current[e.id]) trailsRef.current[e.id] = [];
        trailsRef.current[e.id].push({ lat: e.lat, lng: e.lng, timestamp: now });
        if (trailsRef.current[e.id].length > MAX_TRAIL_POINTS) {
          trailsRef.current[e.id] = trailsRef.current[e.id].slice(-MAX_TRAIL_POINTS);
        }
      }
    });

    setEntities(scoredEntities);
    setLinks(entityLinks);
    setTrails({ ...trailsRef.current });
    setAlerts(mergedAlerts);
    setActivity(getActivityFeed());
    setStats(getStats());
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    refresh();
    if (!isLive) return;
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refresh, refreshInterval, isLive]);

  // Timeline replay
  useEffect(() => {
    if (!isReplayPlaying) return;
    const interval = setInterval(() => {
      setTimelinePosition(prev => {
        const next = prev + replaySpeed;
        if (next >= 1440) {
          setIsReplayPlaying(false);
          return 1440;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isReplayPlaying, replaySpeed]);

  return {
    entities, alerts, activity, stats, lastUpdate,
    isLive, setIsLive, refresh,
    trails, showTrails, setShowTrails,
    links, showLinks, setShowLinks,
    timelinePosition, setTimelinePosition,
    isReplayPlaying, setIsReplayPlaying,
    replaySpeed, setReplaySpeed,
  };
}
