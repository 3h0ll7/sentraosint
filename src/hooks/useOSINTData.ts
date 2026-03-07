import { useEffect, useState, useCallback, useRef } from 'react';
import { MapEntity, Alert, ActivityEvent, getSimulatedEntities, getAlerts, getActivityFeed, getStats } from '@/data/mockData';

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
  const trailsRef = useRef<TrailHistory>({});
  const [trails, setTrails] = useState<TrailHistory>({});

  const refresh = useCallback(() => {
    const newEntities = getSimulatedEntities();

    // Record trail points for moving entities (aircraft + ships)
    const now = Date.now();
    newEntities.forEach(e => {
      if (e.type === 'aircraft' || e.type === 'ship') {
        if (!trailsRef.current[e.id]) {
          trailsRef.current[e.id] = [];
        }
        trailsRef.current[e.id].push({ lat: e.lat, lng: e.lng, timestamp: now });
        if (trailsRef.current[e.id].length > MAX_TRAIL_POINTS) {
          trailsRef.current[e.id] = trailsRef.current[e.id].slice(-MAX_TRAIL_POINTS);
        }
      }
    });

    setEntities(newEntities);
    setTrails({ ...trailsRef.current });
    setAlerts(getAlerts());
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

  return { entities, alerts, activity, stats, lastUpdate, isLive, setIsLive, refresh, trails, showTrails, setShowTrails };
}
