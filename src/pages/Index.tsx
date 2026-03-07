import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Radio, ChevronLeft, ChevronRight, RefreshCw, Wifi, WifiOff, Route } from 'lucide-react';
import OSINTMap from '@/components/OSINTMap';
import LayerControl from '@/components/LayerControl';
import AlertsPanel from '@/components/AlertsPanel';
import ActivityFeed from '@/components/ActivityFeed';
import StatsBar from '@/components/StatsBar';
import EntityDetail from '@/components/EntityDetail';
import { useOSINTData } from '@/hooks/useOSINTData';
import { EntityType, MapEntity } from '@/data/mockData';

export default function Index() {
  const { entities, alerts, activity, stats, lastUpdate, isLive, setIsLive, refresh, trails, showTrails, setShowTrails } = useOSINTData(5000);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<Record<EntityType, boolean>>({
    aircraft: true,
    ship: true,
    base: true,
    strategic: true,
    alert: true,
  });

  const layerCounts = useMemo(() => {
    const counts: Record<EntityType, number> = { aircraft: 0, ship: 0, base: 0, strategic: 0, alert: 0 };
    entities.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
    return counts;
  }, [entities]);

  const toggleLayer = (layer: EntityType) => {
    setVisibleLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-card border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-primary" />
            <h1 className="text-sm font-bold font-mono tracking-wider text-primary">OSINT OVERWATCH</h1>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-secondary">
            MIDDLE EAST THEATER
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono transition-all ${
              isLive ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-border'
            }`}
          >
            {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isLive ? 'LIVE' : 'PAUSED'}
          </button>
          <button
            onClick={() => setShowTrails(!showTrails)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono transition-all ${
              showTrails ? 'bg-accent/10 text-accent border border-accent/30' : 'bg-secondary text-muted-foreground border border-border'
            }`}
          >
            <Route className="w-3 h-3" />
            TRAILS
          </button>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono text-muted-foreground hover:text-foreground bg-secondary border border-border transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            REFRESH
          </button>
          <div className="flex items-center gap-1.5">
            <Radio className={`w-3 h-3 ${isLive ? 'text-primary blink' : 'text-muted-foreground'}`} />
            <span className="text-[9px] font-mono text-muted-foreground">
              UPD: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <StatsBar stats={stats} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Map */}
        <div className="flex-1 relative">
          <OSINTMap
            entities={entities}
            visibleLayers={visibleLayers}
            onEntitySelect={setSelectedEntity}
            selectedEntity={selectedEntity}
            trails={trails}
            showTrails={showTrails}
          />
          {/* Scanline overlay */}
          <div className="absolute inset-0 scanline pointer-events-none z-[400]" />

          {/* Entity Detail Overlay */}
          <AnimatePresence>
            {selectedEntity && (
              <div className="absolute bottom-4 left-4 z-[500] w-80">
                <EntityDetail entity={selectedEntity} onClose={() => setSelectedEntity(null)} />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-[500] bg-card border border-border rounded-l-md p-1 text-muted-foreground hover:text-foreground transition-colors"
          style={{ right: sidebarOpen ? '320px' : '0' }}
        >
          {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Intelligence Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full border-l border-border bg-card overflow-hidden flex-shrink-0"
            >
              <div className="w-[320px] h-full overflow-y-auto p-3 space-y-4">
                {/* Layers */}
                <Section title="MAP LAYERS">
                  <LayerControl visibleLayers={visibleLayers} onToggle={toggleLayer} counts={layerCounts} />
                </Section>

                {/* Alerts */}
                <Section title="ALERTS" badge={alerts.filter(a => a.severity === 'critical').length}>
                  <AlertsPanel alerts={alerts} />
                </Section>

                {/* Activity */}
                <Section title="ACTIVITY FEED">
                  <ActivityFeed events={activity} />
                </Section>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Section({ title, badge, children }: { title: string; badge?: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest">{title}</h2>
        {badge !== undefined && badge > 0 && (
          <span className="text-[9px] font-mono font-bold bg-alert/20 text-alert px-1.5 py-0.5 rounded blink">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
