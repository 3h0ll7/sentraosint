import { useEffect, useState, useCallback, useRef } from 'react';
import { MapEntity, Alert, ActivityEvent, EntityType } from '@/data/mockData';
import { calculateThreatScore, findLinks, generateSmartAlerts, LinkConnection } from '@/data/threatEngine';
import { supabase } from '@/integrations/supabase/client';

export type TrailPoint = { lat: number; lng: number; timestamp: number };
export type TrailHistory = Record<string, TrailPoint[]>;

const MAX_TRAIL_POINTS = 20;

// Convert DB row to MapEntity
function rowToEntity(r: any): MapEntity {
  return {
    id: r.id,
    type: r.type,
    classification: r.classification,
    name: r.name,
    callsign: r.callsign ?? undefined,
    lat: r.lat,
    lng: r.lng,
    heading: r.heading ?? undefined,
    speed: r.speed ?? undefined,
    altitude: r.altitude ?? undefined,
    source: r.source,
    timestamp: r.updated_at,
    details: r.details ?? '',
    country: r.country ?? undefined,
    flagCode: r.flag_code ?? undefined,
    threatScore: r.threat_score ?? undefined,
    origin: r.origin ?? undefined,
  };
}

function rowToAlert(r: any): Alert {
  return {
    id: r.id,
    severity: r.severity,
    title: r.title,
    description: r.description,
    timestamp: r.created_at,
    entityIds: r.entity_ids ?? [],
    type: r.type,
  };
}

export function useOSINTData(refreshInterval = 10000) {
  const [entities, setEntities] = useState<MapEntity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
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

  // Compute stats from actual data
  const stats = {
    totalAircraft: entities.filter(e => e.type === 'aircraft').length,
    totalShips: entities.filter(e => e.type === 'ship').length,
    totalBases: entities.filter(e => e.type === 'base').length,
    militaryAircraft: entities.filter(e => e.type === 'aircraft' && e.classification === 'military').length,
    militaryShips: entities.filter(e => e.type === 'ship' && e.classification === 'military').length,
    activeAlerts: alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length,
    unknownEntities: entities.filter(e => e.classification === 'unknown').length,
  };

  // Load entities from DB, compute threat scores and links
  const loadFromDb = useCallback(async () => {
    const { data: dbEntities } = await supabase.from('entities').select('*');
    if (dbEntities && dbEntities.length > 0) {
      const mapped = dbEntities.map(rowToEntity);
      // Recompute threat scores
      const scored = mapped.map(e => ({
        ...e,
        threatScore: calculateThreatScore(e, mapped),
      }));
      setEntities(scored);

      // Compute links and smart alerts
      const entityLinks = findLinks(scored);
      setLinks(entityLinks);

      const smartAlerts = generateSmartAlerts(scored, entityLinks);
      const alertObjects: Alert[] = smartAlerts.map((a, i) => ({
        id: `smart-${i}`,
        ...a,
        timestamp: new Date().toISOString(),
      }));

      // Also load DB alerts
      const { data: dbAlerts } = await supabase.from('alerts').select('*');
      const dbMapped = dbAlerts ? dbAlerts.map(rowToAlert) : [];
      const merged = [
        ...alertObjects,
        ...dbMapped.filter(da => !alertObjects.some(sa => sa.title === da.title)),
      ];
      setAlerts(merged);

      // Build activity from recent entity movements
      const recentActivity: ActivityEvent[] = scored
        .filter(e => e.type === 'aircraft' || e.type === 'ship')
        .slice(0, 10)
        .map(e => ({
          id: `act-${e.id}`,
          type: e.type as EntityType,
          action: e.type === 'aircraft' ? 'TRACKING' : 'MONITORING',
          description: `${e.name} — ${e.source}`,
          timestamp: e.timestamp,
          lat: e.lat,
          lng: e.lng,
          heading: e.heading,
          speed: e.speed,
          origin: e.origin,
          callsign: e.callsign,
        }));
      setActivity(recentActivity);
    } else {
      setEntities([]);
      setLinks([]);
      setAlerts([]);
      setActivity([]);
    }

    // Load trail history
    const { data: dbTrails } = await supabase
      .from('trail_points')
      .select('*')
      .order('recorded_at', { ascending: true })
      .limit(1000);
    if (dbTrails && dbTrails.length > 0) {
      const history: TrailHistory = {};
      dbTrails.forEach((tp: any) => {
        if (!history[tp.entity_id]) history[tp.entity_id] = [];
        history[tp.entity_id].push({
          lat: tp.lat,
          lng: tp.lng,
          timestamp: new Date(tp.recorded_at).getTime(),
        });
      });
      Object.keys(history).forEach(k => {
        if (history[k].length > MAX_TRAIL_POINTS) {
          history[k] = history[k].slice(-MAX_TRAIL_POINTS);
        }
      });
      trailsRef.current = history;
      setTrails({ ...history });
    }

    setLastUpdate(new Date());
  }, []);

  // Initial load + periodic refresh
  useEffect(() => {
    loadFromDb();
    if (!isLive) return;
    const interval = setInterval(loadFromDb, refreshInterval);
    return () => clearInterval(interval);
  }, [loadFromDb, refreshInterval, isLive]);

  // Real-time subscriptions
  useEffect(() => {
    const entityChannel = supabase
      .channel('entities-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entities' }, () => {
        loadFromDb();
      })
      .subscribe();

    const alertChannel = supabase
      .channel('alerts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        loadFromDb();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(entityChannel);
      supabase.removeChannel(alertChannel);
    };
  }, [loadFromDb]);

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
    isLive, setIsLive, refresh: loadFromDb,
    trails, showTrails, setShowTrails,
    links, showLinks, setShowLinks,
    timelinePosition, setTimelinePosition,
    isReplayPlaying, setIsReplayPlaying,
    replaySpeed, setReplaySpeed,
  };
}
