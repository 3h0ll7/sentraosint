import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FeedStatus {
  opensky: { loading: boolean; lastFetch: Date | null; count: number };
  earthquakes: { loading: boolean; lastFetch: Date | null; count: number };
  firms: { loading: boolean; lastFetch: Date | null; count: number };
  gdacs: { loading: boolean; lastFetch: Date | null; count: number };
}

const initialStatus: FeedStatus = {
  opensky: { loading: false, lastFetch: null, count: 0 },
  earthquakes: { loading: false, lastFetch: null, count: 0 },
  firms: { loading: false, lastFetch: null, count: 0 },
  gdacs: { loading: false, lastFetch: null, count: 0 },
};

export function useOSINTFeeds() {
  const [feedStatus, setFeedStatus] = useState<FeedStatus>(initialStatus);

  const updateFeed = (key: keyof FeedStatus, update: Partial<FeedStatus[keyof FeedStatus]>) => {
    setFeedStatus(prev => ({ ...prev, [key]: { ...prev[key], ...update } }));
  };

  const fetchOpenSky = useCallback(async (bounds?: { lamin: number; lomin: number; lamax: number; lomax: number }) => {
    updateFeed('opensky', { loading: true });
    try {
      const { data, error } = await supabase.functions.invoke('fetch-opensky', {
        body: bounds || { lamin: 10, lomin: 25, lamax: 55, lomax: 75 }, // Default: Middle East + Mediterranean
      });
      if (error) throw error;
      updateFeed('opensky', { loading: false, lastFetch: new Date(), count: data.tracked || 0 });
      toast.success(`OpenSky: ${data.tracked} aircraft tracked`);
      return data;
    } catch (e: any) {
      updateFeed('opensky', { loading: false });
      toast.error(`OpenSky fetch failed: ${e.message}`);
      console.error('OpenSky error:', e);
    }
  }, []);

  const fetchEarthquakes = useCallback(async () => {
    updateFeed('earthquakes', { loading: true });
    try {
      const { data, error } = await supabase.functions.invoke('fetch-earthquakes');
      if (error) throw error;
      updateFeed('earthquakes', { loading: false, lastFetch: new Date(), count: data.inserted || 0 });
      toast.success(`USGS: ${data.inserted} earthquakes loaded`);
      return data;
    } catch (e: any) {
      updateFeed('earthquakes', { loading: false });
      toast.error(`USGS fetch failed: ${e.message}`);
      console.error('USGS error:', e);
    }
  }, []);

  const fetchFIRMS = useCallback(async () => {
    updateFeed('firms', { loading: true });
    try {
      const { data, error } = await supabase.functions.invoke('fetch-firms');
      if (error) throw error;
      updateFeed('firms', { loading: false, lastFetch: new Date(), count: data.fires_tracked || 0 });
      toast.success(`NASA FIRMS: ${data.fires_tracked} active fires`);
      return data;
    } catch (e: any) {
      updateFeed('firms', { loading: false });
      toast.error(`FIRMS fetch failed: ${e.message}`);
      console.error('FIRMS error:', e);
    }
  }, []);

  const fetchGDACS = useCallback(async () => {
    updateFeed('gdacs', { loading: true });
    try {
      const { data, error } = await supabase.functions.invoke('fetch-gdacs');
      if (error) throw error;
      updateFeed('gdacs', { loading: false, lastFetch: new Date(), count: data.alerts || 0 });
      toast.success(`GDACS: ${data.alerts} disaster alerts`);
      return data;
    } catch (e: any) {
      updateFeed('gdacs', { loading: false });
      toast.error(`GDACS fetch failed: ${e.message}`);
      console.error('GDACS error:', e);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.allSettled([fetchOpenSky(), fetchEarthquakes(), fetchFIRMS(), fetchGDACS()]);
  }, [fetchOpenSky, fetchEarthquakes, fetchFIRMS, fetchGDACS]);

  return {
    feedStatus,
    fetchOpenSky,
    fetchEarthquakes,
    fetchFIRMS,
    fetchGDACS,
    fetchAll,
  };
}
