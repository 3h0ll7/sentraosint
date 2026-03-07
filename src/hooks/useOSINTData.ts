import { useEffect, useState, useCallback } from 'react';
import { MapEntity, Alert, ActivityEvent, getSimulatedEntities, getAlerts, getActivityFeed, getStats } from '@/data/mockData';

export function useOSINTData(refreshInterval = 5000) {
  const [entities, setEntities] = useState<MapEntity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [stats, setStats] = useState(getStats());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLive, setIsLive] = useState(true);

  const refresh = useCallback(() => {
    setEntities(getSimulatedEntities());
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

  return { entities, alerts, activity, stats, lastUpdate, isLive, setIsLive, refresh };
}
