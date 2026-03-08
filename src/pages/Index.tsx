import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Radio, ChevronLeft, ChevronRight, RefreshCw, Wifi, WifiOff, Route, Link2, Grid3x3, Globe, Thermometer, Crosshair, Brain, Waves } from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';
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

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showGlobalEvents, setShowGlobalEvents] = useState(true);
  const [showRiskHeatmap, setShowRiskHeatmap] = useState(false);
  const [showImpactWaves, setShowImpactWaves] = useState(true);
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number } | null>(null);
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
      // Reset after animation
      setTimeout(() => setFlyToTarget(null), 3000);
    }
  }, [hottestRegion]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background relative">
      <MatrixRain />
      <GlobalAlertBanner alert={breakingAlert} onDismiss={dismissBreaking} />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-card/90 backdrop-blur-sm border-b border-border flex-shrink-0 relative z-10 matrix-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-primary animate-glow-pulse" />
            <h1 className="text-sm font-bold font-mono tracking-[0.2em] text-primary matrix-glow">OSINT OVERWATCH</h1>
          </div>
          <StabilityIndicator stability={stability} />
        </div>
        <div className="flex items-center gap-1.5">
          <HeaderBtn active={isLive} onClick={() => setIsLive(!isLive)}
            icon={isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            label={isLive ? 'LIVE' : 'PAUSED'} activeClass="bg-primary/10 text-primary border-primary/30"
          />
          <HeaderBtn active={showTrails} onClick={() => setShowTrails(!showTrails)}
            icon={<Route className="w-3 h-3" />} label="TRAILS"
            activeClass="bg-accent/10 text-accent border-accent/30"
          />
          <HeaderBtn active={showLinks} onClick={() => setShowLinks(!showLinks)}
            icon={<Link2 className="w-3 h-3" />} label="LINKS"
            activeClass="bg-strategic/10 text-strategic border-strategic/30"
          />
          <HeaderBtn active={showGlobalEvents} onClick={() => setShowGlobalEvents(!showGlobalEvents)}
            icon={<Globe className="w-3 h-3" />} label="EVENTS"
            activeClass="bg-accent/10 text-accent border-accent/30"
          />
          <HeaderBtn active={showImpactWaves} onClick={() => setShowImpactWaves(!showImpactWaves)}
            icon={<Waves className="w-3 h-3" />} label="WAVES"
            activeClass="bg-destructive/10 text-destructive border-destructive/30"
          />
          <HeaderBtn active={showRiskHeatmap} onClick={() => setShowRiskHeatmap(!showRiskHeatmap)}
            icon={<Thermometer className="w-3 h-3" />} label="RISK"
            activeClass="bg-alert/10 text-alert border-alert/30"
          />
          <HeaderBtn active={showGrid} onClick={() => setShowGrid(!showGrid)}
            icon={<Grid3x3 className="w-3 h-3" />} label="GRID"
            activeClass="bg-muted-foreground/10 text-muted-foreground border-muted-foreground/30"
          />
          <button
            onClick={focusHottestRegion}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono text-alert bg-alert/10 border border-alert/30 hover:bg-alert/20 transition-all"
            title="Focus on hottest region"
          >
            <Crosshair className="w-3 h-3" />
            HOTSPOT
          </button>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono text-muted-foreground hover:text-foreground bg-secondary border border-border transition-all"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <div className="flex items-center gap-1.5">
            <Radio className={`w-3 h-3 ${isLive ? 'text-primary blink' : 'text-muted-foreground'}`} />
            <span className="text-[9px] font-mono text-muted-foreground">
              {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </header>

      <StatsBar stats={stats} globalEventCount={allEvents.length} />

      {/* Main Content */}
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
          {showGrid && <div className="absolute inset-0 grid-bg pointer-events-none z-[400] opacity-30" />}
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
                <SearchBar
                  entities={entities}
                  globalEvents={allEvents}
                  alerts={alerts}
                  onEntitySelect={setSelectedEntity}
                />

                <Section title="ENTITY LAYERS">
                  <LayerControl visibleLayers={visibleLayers} onToggle={toggleLayer} counts={layerCounts} />
                </Section>

                <Section title="GLOBAL EVENT LAYERS" badge={allEvents.length}>
                  <EventLayerControl visibleCategories={visibleCategories} onToggle={toggleCategory} counts={eventCategoryCounts} />
                </Section>

                {showRiskHeatmap && (
                  <Section title="RISK HEATMAP" badge={riskPoints.filter(p => p.score >= 60).length}>
                    <RiskLegend riskPoints={riskPoints} />
                  </Section>
                )}

                <Section title="🌍 GLOBAL CONCERNS">
                  <GlobalConcernsPanel concerns={concerns} />
                </Section>

                {(correlations.length > 0 || patterns.length > 0) && (
                  <Section title="🧠 AI INSIGHTS" badge={correlations.length + patterns.length}>
                    <IntelligenceInsightsPanel correlations={correlations} patterns={patterns} />
                  </Section>
                )}

                <Section title="BREAKING NEWS" badge={allEvents.filter(e => e.is_breaking).length}>
                  <BreakingNewsPanel events={globalEvents} />
                </Section>

                <Section title="THREAT ALERTS" badge={alerts.filter(a => a.severity === 'critical').length}>
                  <AlertsPanel alerts={alerts} />
                </Section>

                <Section title="ACTIVITY FEED">
                  <ActivityFeed events={activity} />
                </Section>

                {links.length > 0 && (
                  <Section title="LINK ANALYSIS" badge={links.length}>
                    <div className="space-y-1">
                      {links.slice(0, 6).map(link => (
                        <div key={link.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-secondary/30 text-[9px] font-mono">
                          <Link2 className="w-2.5 h-2.5 text-strategic flex-shrink-0" />
                          <span className="text-strategic">{link.reason}</span>
                          <span className="text-muted-foreground ml-auto">{Math.round(link.distance)}km</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HeaderBtn({ active, onClick, icon, label, activeClass }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; activeClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono transition-all border ${
        active ? activeClass : 'bg-secondary text-muted-foreground border-border'
      }`}
    >
      {icon}
      {label}
    </button>
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
