import { useEffect, useState, useCallback, useRef } from 'react';
import { MapEntity, Alert, ActivityEvent, getSimulatedEntities, getAlerts, getActivityFeed, getStats } from '@/data/mockData';
import { calculateThreatScore, findLinks, generateSmartAlerts, LinkConnection } from '@/data/threatEngine';
import { supabase } from '@/integrations/supabase/client';

export type TrailPoint = { lat: number; lng: number; timestamp: number };
export type TrailHistory = Record<string, TrailPoint[]>;

const MAX_TRAIL_POINTS = 20;

// Convert MapEntity to DB row format
function entityToRow(e: MapEntity) {
  return {
    id: e.id,
    type: e.type as 'aircraft' | 'ship' | 'base' | 'strategic' | 'alert',
    classification: e.classification as 'military' | 'civilian' | 'unknown',
    name: e.name,
    callsign: e.callsign ?? null,
    lat: e.lat,
    lng: e.lng,
    heading: e.heading ?? null,
    speed: e.speed ?? null,
    altitude: e.altitude ?? null,
    source: e.source,
    details: e.details ?? null,
    country: e.country ?? null,
    flag_code: e.flagCode ?? null,
    threat_score: e.threatScore ?? 0,
    origin: e.origin ?? null,
    updated_at: new Date().toISOString(),
  };
}

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

function alertToRow(a: Alert) {
  return {
    id: a.id,
    severity: a.severity as 'critical' | 'high' | 'medium' | 'low',
    title: a.title,
    description: a.description,
    entity_ids: a.entityIds,
    type: a.type as 'cluster' | 'movement' | 'airspace' | 'proximity',
    created_at: a.timestamp,
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
  const [dbReady, setDbReady] = useState(false);

  // Timeline replay state
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);

  // Seed database and persist on each refresh
  const persistToDb = useCallback(async (scoredEntities: MapEntity[], mergedAlerts: Alert[]) => {
    try {
      // Upsert entities
      const rows = scoredEntities.map(entityToRow);
      await supabase.from('entities').upsert(rows, { onConflict: 'id' });

      // Insert trail points for moving entities
      const trailRows = scoredEntities
        .filter(e => e.type === 'aircraft' || e.type === 'ship')
        .map(e => ({ entity_id: e.id, lat: e.lat, lng: e.lng }));
      if (trailRows.length > 0) {
        await supabase.from('trail_points').insert(trailRows);
      }

      // Upsert alerts
      const alertRows = mergedAlerts.map(alertToRow);
      await supabase.from('alerts').upsert(alertRows, { onConflict: 'id' });
    } catch (err) {
      console.error('DB persist error:', err);
    }
  }, []);

  // Load initial data from DB
  useEffect(() => {
    async function loadFromDb() {
      const { data: dbEntities } = await supabase.from('entities').select('*');
      if (dbEntities && dbEntities.length > 0) {
        setEntities(dbEntities.map(rowToEntity));
      }

      const { data: dbAlerts } = await supabase.from('alerts').select('*');
      if (dbAlerts && dbAlerts.length > 0) {
        setAlerts(dbAlerts.map(rowToAlert));
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
        // Keep only last MAX_TRAIL_POINTS per entity
        Object.keys(history).forEach(k => {
          if (history[k].length > MAX_TRAIL_POINTS) {
            history[k] = history[k].slice(-MAX_TRAIL_POINTS);
          }
        });
        trailsRef.current = history;
        setTrails({ ...history });
      }

      setDbReady(true);
    }
    loadFromDb();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const entityChannel = supabase
      .channel('entities-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entities' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updated = rowToEntity(payload.new);
          setEntities(prev => {
            const idx = prev.findIndex(e => e.id === updated.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = updated;
              return copy;
            }
            return [...prev, updated];
          });
        } else if (payload.eventType === 'DELETE') {
          setEntities(prev => prev.filter(e => e.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    const alertChannel = supabase
      .channel('alerts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updated = rowToAlert(payload.new);
          setAlerts(prev => {
            const idx = prev.findIndex(a => a.id === updated.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = updated;
              return copy;
            }
            return [...prev, updated];
          });
        } else if (payload.eventType === 'DELETE') {
          setAlerts(prev => prev.filter(a => a.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(entityChannel);
      supabase.removeChannel(alertChannel);
    };
  }, []);

  const refresh = useCallback(() => {
    const rawEntities = getSimulatedEntities();

    const scoredEntities = rawEntities.map(e => ({
      ...e,
      threatScore: calculateThreatScore(e, rawEntities),
    }));

    const entityLinks = findLinks(scoredEntities);
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

    // Record trails locally
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

    // Persist to database
    if (dbReady) {
      persistToDb(scoredEntities, mergedAlerts);
    }
  }, [dbReady, persistToDb]);

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
