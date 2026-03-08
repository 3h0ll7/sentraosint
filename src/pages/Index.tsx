import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Radio, ChevronLeft, ChevronRight, RefreshCw, Wifi, WifiOff, Route, Link2, Grid3x3, Globe, Thermometer, Crosshair, Waves } from 'lucide-react';
import MissionControlBg from '@/components/MissionControlBg';
import OSINTMap from '@/components/OSINTMap';
import LayerControl from '@/components/LayerControl';
import EventLayerControl from '@/components/EventLayerControl';
import AlertsPanel from '@/components/AlertsPanel';
import ActivityFeed from '@/components/ActivityFeed';
import BreakingNewsPanel from '@/components/BreakingNewsPanel';
import GlobalAlertBanner from '@/components/GlobalAlertBanner';
import StatsBar from '@/components/StatsBar';
import SearchBar from '@/components/SearchBar';
import EntityDetail from '@/components/EntityDetail';
import TimelineControl from '@/components/TimelineControl';
import RiskLegend from '@/components/RiskLegend';
import StabilityIndicator from '@/components/StabilityIndicator';
import GlobalConcernsPanel from '@/components/GlobalConcernsPanel';
import IntelligenceInsightsPanel from '@/components/IntelligenceInsightsPanel';
import { useOSINTData } from '@/hooks/useOSINTData';
import { useGlobalEvents, EventCategory } from '@/hooks/useGlobalEvents';
import { useOSINTFeeds } from '@/hooks/useOSINTFeeds';
import LiveFeedsPanel from '@/components/LiveFeedsPanel';
import { EntityType, MapEntity } from '@/data/mockData';
import { calculateRiskHeatmap } from '@/data/riskEngine';
import {
  calculateStabilityIndex,
  findHottestRegion,
  analyzeGlobalConcerns,
  detectCorrelations,
  detectPatterns,
} from '@/data/intelligenceEngine';

export default function Index() {
  const {
    entities, alerts, activity, stats, lastUpdate,
    isLive, setIsLive, refresh,
    trails, showTrails, setShowTrails,
    links, showLinks, setShowLinks,
    timelinePosition, setTimelinePosition,
    isReplayPlaying, setIsReplayPlaying,
    replaySpeed, setReplaySpeed,
  } = useOSINTData(5000);

  const {
    events: globalEvents,
    allEvents,
    visibleCategories,
    toggleCategory,
    breakingAlert,
    dismissBreaking,
  } = useGlobalEvents(30000);

  const {
    feedStatus, fetchOpenSky, fetchEarthquakes, fetchFIRMS, fetchGDACS, fetchAll,
  } = useOSINTFeeds();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showGlobalEvents, setShowGlobalEvents] = useState(true);
  const [showRiskHeatmap, setShowRiskHeatmap] = useState(false);
  const [showImpactWaves, setShowImpactWaves] = useState(true);
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<Record<EntityType, boolean>>({
    aircraft: true, ship: true, base: true, strategic: true, alert: true,
  });

  const layerCounts = useMemo(() => {
    const counts: Record<EntityType, number> = { aircraft: 0, ship: 0, base: 0, strategic: 0, alert: 0 };
    entities.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
    return counts;
  }, [entities]);

  const eventCategoryCounts = useMemo(() => {
    const counts: Record<EventCategory, number> = { military: 0, economy: 0, trade: 0, health: 0, disaster: 0, political: 0 };
    allEvents.forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1; });
    return counts;
  }, [allEvents]);

  const riskPoints = useMemo(() => calculateRiskHeatmap(entities, allEvents), [entities, allEvents]);
  const stability = useMemo(() => calculateStabilityIndex(entities, allEvents), [entities, allEvents]);
  const concerns = useMemo(() => analyzeGlobalConcerns(allEvents), [allEvents]);
  const correlations = useMemo(() => detectCorrelations(entities, allEvents, links), [entities, allEvents, links]);
  const patterns = useMemo(() => detectPatterns(entities, allEvents), [entities, allEvents]);
  const hottestRegion = useMemo(() => findHottestRegion(entities, allEvents), [entities, allEvents]);

  const toggleLayer = (layer: EntityType) => {
    setVisibleLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const focusHottestRegion = useCallback(() => {
    if (hottestRegion) {
      setFlyToTarget({ lat: hottestRegion.lat, lng: hottestRegion.lng });
      setTimeout(() => setFlyToTarget(null), 3000);
    }
  }, [hottestRegion]);

  const uptime = useMemo(() => {
    const mins = Math.floor((Date.now() % 86400000) / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }, [lastUpdate]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background relative">
      <MissionControlBg />
      <GlobalAlertBanner alert={breakingAlert} onDismiss={dismissBreaking} />

      {/* Mission Control Header */}
      <header className="flex items-center justify-between px-5 py-2.5 bg-card/95 backdrop-blur-md border-b border-border flex-shrink-0 relative z-10 mc-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Radar className="w-5 h-5 text-primary animate-glow-pulse" />
              <div className="absolute inset-0 w-5 h-5 rounded-full bg-primary/10 animate-status-pulse" />
            </div>
            <div>
              <h1 className="text-xs font-display font-bold tracking-[0.25em] text-primary mc-glow leading-none">
                SENTRA OSINT
              </h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[8px] font-mono text-muted-foreground tracking-wider">MISSION CONTROL</span>
                <span className="text-[8px] font-mono text-muted-foreground">UPTIME {uptime}</span>
              </div>
            </div>
          </div>
          <div className="w-px h-8 bg-border" />
          <StabilityIndicator stability={stability} />
        </div>

        <div className="flex items-center gap-1.5">
          <OpsBtn active={isLive} onClick={() => setIsLive(!isLive)}
            icon={isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            label={isLive ? 'LIVE' : 'HOLD'} color="primary"
          />
          <OpsBtn active={showTrails} onClick={() => setShowTrails(!showTrails)}
            icon={<Route className="w-3 h-3" />} label="TRK" color="accent"
          />
          <OpsBtn active={showLinks} onClick={() => setShowLinks(!showLinks)}
            icon={<Link2 className="w-3 h-3" />} label="LNK" color="strategic"
          />
          <OpsBtn active={showGlobalEvents} onClick={() => setShowGlobalEvents(!showGlobalEvents)}
            icon={<Globe className="w-3 h-3" />} label="EVT" color="accent"
          />
          <OpsBtn active={showImpactWaves} onClick={() => setShowImpactWaves(!showImpactWaves)}
            icon={<Waves className="w-3 h-3" />} label="WAV" color="destructive"
          />
          <OpsBtn active={showRiskHeatmap} onClick={() => setShowRiskHeatmap(!showRiskHeatmap)}
            icon={<Thermometer className="w-3 h-3" />} label="RSK" color="alert"
          />
          <OpsBtn active={showGrid} onClick={() => setShowGrid(!showGrid)}
            icon={<Grid3x3 className="w-3 h-3" />} label="GRD" color="muted-foreground"
          />

          <div className="w-px h-5 bg-border mx-1" />

          <button
            onClick={focusHottestRegion}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-display font-bold tracking-wider text-alert bg-alert/10 border border-alert/25 hover:bg-alert/20 transition-all"
          >
            <Crosshair className="w-3 h-3" />
            HOTSPOT
          </button>
          <button
            onClick={refresh}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono text-muted-foreground hover:text-foreground bg-secondary border border-border transition-all"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <div className="flex items-center gap-1.5 ml-1">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-accent animate-status-pulse' : 'bg-muted-foreground'}`} />
            <span className="text-[9px] font-mono text-muted-foreground tabular-nums">
              {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </header>

      {/* Telemetry Bar */}
      <StatsBar stats={stats} globalEventCount={allEvents.length} />

      {/* Main Operations Display */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 relative">
          <OSINTMap
            entities={entities}
            visibleLayers={visibleLayers}
            onEntitySelect={setSelectedEntity}
            selectedEntity={selectedEntity}
            trails={trails}
            showTrails={showTrails}
            links={links}
            showLinks={showLinks}
            globalEvents={globalEvents}
            showGlobalEvents={showGlobalEvents}
            riskPoints={riskPoints}
            showRiskHeatmap={showRiskHeatmap}
            showImpactWaves={showImpactWaves}
            flyToTarget={flyToTarget}
          />
          {showGrid && <div className="absolute inset-0 grid-bg pointer-events-none z-[400] opacity-40" />}
          <div className="absolute inset-0 scanline pointer-events-none z-[401]" />

          <AnimatePresence>
            {selectedEntity && (
              <div className="absolute bottom-16 left-4 z-[500] w-80">
                <EntityDetail entity={selectedEntity} onClose={() => setSelectedEntity(null)} trails={trails} />
              </div>
            )}
          </AnimatePresence>

          <TimelineControl
            isPlaying={isReplayPlaying}
            onTogglePlay={() => setIsReplayPlaying(!isReplayPlaying)}
            playbackSpeed={replaySpeed}
            onSpeedChange={setReplaySpeed}
            currentTime={timelinePosition}
            onTimeChange={setTimelinePosition}
          />
        </div>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-[500] bg-card border border-border rounded-l-md p-1.5 text-muted-foreground hover:text-primary transition-colors"
          style={{ right: sidebarOpen ? '340px' : '0' }}
        >
          {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Intelligence Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="h-full border-l border-border bg-card/95 backdrop-blur-sm overflow-hidden flex-shrink-0"
            >
              <div className="w-[340px] h-full overflow-y-auto p-3 space-y-3">
                <SearchBar
                  entities={entities}
                  globalEvents={allEvents}
                  alerts={alerts}
                  onEntitySelect={setSelectedEntity}
                />

                <TelemetrySection title="LIVE OSINT FEEDS">
                  <LiveFeedsPanel
                    feedStatus={feedStatus}
                    onFetchOpenSky={fetchOpenSky}
                    onFetchEarthquakes={fetchEarthquakes}
                    onFetchFIRMS={fetchFIRMS}
                    onFetchGDACS={fetchGDACS}
                    onFetchAll={fetchAll}
                  />
                </TelemetrySection>

                <TelemetrySection title="ENTITY TRACKING">
                  <LayerControl visibleLayers={visibleLayers} onToggle={toggleLayer} counts={layerCounts} />
                </TelemetrySection>

                <TelemetrySection title="EVENT TELEMETRY" badge={allEvents.length}>
                  <EventLayerControl visibleCategories={visibleCategories} onToggle={toggleCategory} counts={eventCategoryCounts} />
                </TelemetrySection>

                {showRiskHeatmap && (
                  <TelemetrySection title="RISK ASSESSMENT" badge={riskPoints.filter(p => p.score >= 60).length}>
                    <RiskLegend riskPoints={riskPoints} />
                  </TelemetrySection>
                )}

                <TelemetrySection title="GLOBAL CONCERNS">
                  <GlobalConcernsPanel concerns={concerns} />
                </TelemetrySection>

                {(correlations.length > 0 || patterns.length > 0) && (
                  <TelemetrySection title="AI ANALYSIS" badge={correlations.length + patterns.length}>
                    <IntelligenceInsightsPanel correlations={correlations} patterns={patterns} />
                  </TelemetrySection>
                )}

                <TelemetrySection title="BREAKING INTEL" badge={allEvents.filter(e => e.is_breaking).length}>
                  <BreakingNewsPanel events={globalEvents} />
                </TelemetrySection>

                <TelemetrySection title="MISSION ALERTS" badge={alerts.filter(a => a.severity === 'critical').length}>
                  <AlertsPanel alerts={alerts} />
                </TelemetrySection>

                <TelemetrySection title="ACTIVITY LOG">
                  <ActivityFeed events={activity} />
                </TelemetrySection>

                {links.length > 0 && (
                  <TelemetrySection title="LINK ANALYSIS" badge={links.length}>
                    <div className="space-y-1">
                      {links.slice(0, 6).map(link => (
                        <div key={link.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-secondary/50 text-[9px] font-mono">
                          <Link2 className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                          <span className="text-foreground">{link.reason}</span>
                          <span className="text-muted-foreground ml-auto tabular-nums">{Math.round(link.distance)}km</span>
                        </div>
                      ))}
                    </div>
                  </TelemetrySection>
                )}

                {/* Wildfires — compact footer widget, auto-refreshes every 30s */}
                <div className="rounded-md px-3 py-2 bg-secondary/30 border border-border/40">
                  <div className="flex items-center gap-2">
                    <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />
                    <span className="text-[8px] font-display font-bold text-orange-400/80 tracking-wider">ACTIVE FIRES</span>
                    <span className="text-[8px] font-mono text-muted-foreground ml-auto tabular-nums">
                      {feedStatus.firms.count > 0 ? `${feedStatus.firms.count} detected` : '—'}
                    </span>
                    {feedStatus.firms.lastFetch && (
                      <span className="text-[7px] font-mono text-muted-foreground/60">
                        {feedStatus.firms.lastFetch.toLocaleTimeString()}
                      </span>
                    )}
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400/60 animate-pulse" />
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const OPS_COLOR_MAP: Record<string, string> = {
  primary: 'bg-primary/10 text-primary border-primary/25',
  accent: 'bg-accent/10 text-accent border-accent/25',
  strategic: 'bg-strategic/10 text-strategic border-strategic/25',
  destructive: 'bg-destructive/10 text-destructive border-destructive/25',
  alert: 'bg-alert/10 text-alert border-alert/25',
  'muted-foreground': 'bg-muted/20 text-muted-foreground border-muted-foreground/25',
};

function OpsBtn({ active, onClick, icon, label, color }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-display font-bold tracking-wider transition-all border ${
        active
          ? OPS_COLOR_MAP[color] || 'bg-primary/10 text-primary border-primary/25'
          : 'bg-secondary text-muted-foreground border-border'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function TelemetrySection({ title, badge, children }: { title: string; badge?: number; children: React.ReactNode }) {
  return (
    <div className="telemetry-panel rounded-md p-3">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-status-pulse" />
        <h2 className="text-[9px] font-display font-bold text-primary/80 tracking-[0.2em]">{title}</h2>
        {badge !== undefined && badge > 0 && (
          <span className="text-[9px] font-display font-bold bg-alert/15 text-alert px-1.5 py-0.5 rounded blink ml-auto tabular-nums">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
