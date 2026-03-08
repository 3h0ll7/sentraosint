import { motion } from 'framer-motion';
import { Plane, Flame, AlertTriangle, Activity, RefreshCw, Loader2, Database, Newspaper, Rss } from 'lucide-react';
import { FeedStatus } from '@/hooks/useOSINTFeeds';

interface LiveFeedsPanelProps {
  feedStatus: FeedStatus;
  onFetchOpenSky: () => void;
  onFetchEarthquakes: () => void;
  onFetchFIRMS: () => void;
  onFetchGDACS: () => void;
  onFetchOSINTNews: () => void;
  onFetchGoogleNews: () => void;
  onFetchAll: () => void;
}

const FEED_CONFIG = [
  { key: 'opensky' as const, label: 'OpenSky Aircraft', icon: Plane, source: 'ADS-B / OpenSky Network' },
  { key: 'earthquakes' as const, label: 'USGS Earthquakes', icon: Activity, source: 'USGS Real-time Feed' },
  { key: 'firms' as const, label: 'NASA Wildfires', icon: Flame, source: 'MODIS Active Fire Data' },
  { key: 'gdacs' as const, label: 'GDACS Disasters', icon: AlertTriangle, source: 'Global Disaster Alert System' },
  { key: 'news' as const, label: 'OSINT News Intel', icon: Newspaper, source: 'GDELT Global News Analysis' },
];

export default function LiveFeedsPanel({
  feedStatus, onFetchOpenSky, onFetchEarthquakes, onFetchFIRMS, onFetchGDACS, onFetchOSINTNews, onFetchAll,
}: LiveFeedsPanelProps) {
  const handlers: Record<string, () => void> = {
    opensky: onFetchOpenSky,
    earthquakes: onFetchEarthquakes,
    firms: onFetchFIRMS,
    gdacs: onFetchGDACS,
    news: onFetchOSINTNews,
  };

  return (
    <div className="space-y-2">
      <button
        onClick={onFetchAll}
        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded text-[9px] font-display font-bold tracking-wider text-primary bg-primary/10 border border-primary/25 hover:bg-primary/20 transition-all"
      >
        <Database className="w-3 h-3" />
        FETCH ALL LIVE FEEDS
      </button>

      <div className="space-y-1.5">
        {FEED_CONFIG.map(({ key, label, icon: Icon, source }) => {
          const status = feedStatus[key];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-2 py-1.5 rounded bg-secondary/50 border border-border/50"
            >
              <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-display font-bold text-foreground tracking-wider">{label}</div>
                <div className="text-[8px] font-mono text-muted-foreground truncate">{source}</div>
                {status.lastFetch && (
                  <div className="text-[8px] font-mono text-accent">
                    {status.count} items • {status.lastFetch.toLocaleTimeString()}
                  </div>
                )}
              </div>
              <button
                onClick={handlers[key]}
                disabled={status.loading}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-display font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all disabled:opacity-50"
              >
                {status.loading ? (
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-2.5 h-2.5" />
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
