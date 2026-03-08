import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GlobalEvent {
  id: string;
  category: 'military' | 'economy' | 'trade' | 'health' | 'disaster' | 'political';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string | null;
  source: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  url: string | null;
  is_breaking: boolean;
  created_at: string;
}

export type EventCategory = GlobalEvent['category'];

export function useGlobalEvents(refreshInterval = 30000) {
  const [events, setEvents] = useState<GlobalEvent[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<Record<EventCategory, boolean>>({
    military: true,
    economy: true,
    trade: true,
    health: true,
    disaster: true,
    political: true,
  });
  const [breakingAlert, setBreakingAlert] = useState<GlobalEvent | null>(null);
  const seenBreakingIds = useRef(new Set<string>());

  const toggleCategory = useCallback((cat: EventCategory) => {
    setVisibleCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  const dismissBreaking = useCallback(() => setBreakingAlert(null), []);

  // Load all events from DB — only real, verified data
  const loadEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('global_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data && !error) {
      const mapped: GlobalEvent[] = data.map((r: any) => ({
        id: r.id,
        category: r.category,
        severity: r.severity,
        title: r.title,
        description: r.description,
        source: r.source,
        country: r.country,
        lat: r.lat,
        lng: r.lng,
        url: r.url,
        is_breaking: r.is_breaking ?? false,
        created_at: r.created_at,
      }));
      setEvents(mapped);

      // Check for new breaking events
      const breaking = mapped.filter(e => e.is_breaking && !seenBreakingIds.current.has(e.id));
      if (breaking.length > 0) {
        setBreakingAlert(breaking[0]);
        breaking.forEach(b => seenBreakingIds.current.add(b.id));
      }
    }
  }, []);

  // Fetch USGS earthquakes via edge function
  const fetchEarthquakes = useCallback(async () => {
    try {
      await supabase.functions.invoke('fetch-earthquakes');
    } catch (err) {
      console.error('Fetch earthquakes error:', err);
    }
  }, []);

  // Initial load — no simulated data, only DB
  useEffect(() => {
    loadEvents();

    const interval = setInterval(loadEvents, refreshInterval);
    return () => clearInterval(interval);
  }, [loadEvents, refreshInterval]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('global-events-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_events' }, (payload) => {
        const r = payload.new as any;
        const newEvent: GlobalEvent = {
          id: r.id,
          category: r.category,
          severity: r.severity,
          title: r.title,
          description: r.description,
          source: r.source,
          country: r.country,
          lat: r.lat,
          lng: r.lng,
          url: r.url,
          is_breaking: r.is_breaking ?? false,
          created_at: r.created_at,
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 100));
        if (newEvent.is_breaking && !seenBreakingIds.current.has(newEvent.id)) {
          setBreakingAlert(newEvent);
          seenBreakingIds.current.add(newEvent.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredEvents = events.filter(e => visibleCategories[e.category]);

  return {
    events: filteredEvents,
    allEvents: events,
    visibleCategories,
    toggleCategory,
    breakingAlert,
    dismissBreaking,
    fetchEarthquakes,
  };
}
