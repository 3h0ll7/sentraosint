import { useState, useMemo } from 'react';
import { Search, X, Plane, Ship, Shield, Globe, Swords, TrendingDown, HeartPulse, CloudLightning, Landmark } from 'lucide-react';
import { MapEntity } from '@/data/mockData';
import { GlobalEvent, EventCategory } from '@/hooks/useGlobalEvents';
import { Alert } from '@/data/mockData';

interface SearchBarProps {
  entities: MapEntity[];
  globalEvents: GlobalEvent[];
  alerts: Alert[];
  onEntitySelect: (entity: MapEntity) => void;
}

const ENTITY_ICONS: Record<string, React.ElementType> = {
  aircraft: Plane,
  ship: Ship,
  base: Shield,
  strategic: Globe,
  alert: Shield,
};

const EVENT_ICONS: Record<EventCategory, React.ElementType> = {
  military: Swords,
  economy: TrendingDown,
  trade: Ship,
  health: HeartPulse,
  disaster: CloudLightning,
  political: Landmark,
};

export default function SearchBar({ entities, globalEvents, alerts, onEntitySelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const q = query.toLowerCase().trim();

  const results = useMemo(() => {
    if (!q) return { entities: [], events: [], alerts: [] };

    const matchedEntities = entities.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (e.callsign?.toLowerCase().includes(q)) ||
      (e.country?.toLowerCase().includes(q)) ||
      e.type.toLowerCase().includes(q) ||
      e.classification.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedEvents = globalEvents.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.description?.toLowerCase().includes(q)) ||
      (e.country?.toLowerCase().includes(q)) ||
      e.category.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedAlerts = alerts.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q)
    ).slice(0, 3);

    return { entities: matchedEntities, events: matchedEvents, alerts: matchedAlerts };
  }, [q, entities, globalEvents, alerts]);

  const hasResults = results.entities.length + results.events.length + results.alerts.length > 0;
  const showDropdown = focused && q.length > 0;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-2 py-1.5 rounded border border-border bg-secondary/50 focus-within:border-primary/40 transition-colors">
        <Search className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Search entities, events, alerts..."
          className="flex-1 bg-transparent text-[10px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-md shadow-lg max-h-[400px] overflow-y-auto">
          {!hasResults && (
            <div className="p-3 text-center text-[10px] font-mono text-muted-foreground">
              No results for "{query}"
            </div>
          )}

          {results.entities.length > 0 && (
            <ResultSection title="ENTITIES">
              {results.entities.map(entity => {
                const Icon = ENTITY_ICONS[entity.type] || Globe;
                return (
                  <button
                    key={entity.id}
                    onMouseDown={() => { onEntitySelect(entity); setQuery(''); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary/60 text-left transition-colors"
                  >
                    <Icon className="w-3 h-3 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono text-foreground truncate">{entity.name}</div>
                      <div className="text-[8px] font-mono text-muted-foreground">
                        {entity.type.toUpperCase()} • {entity.classification} {entity.country ? `• ${entity.country}` : ''}
                      </div>
                    </div>
                    {entity.callsign && (
                      <span className="text-[8px] font-mono text-primary/60">{entity.callsign}</span>
                    )}
                  </button>
                );
              })}
            </ResultSection>
          )}

          {results.events.length > 0 && (
            <ResultSection title="GLOBAL EVENTS">
              {results.events.map(event => {
                const Icon = EVENT_ICONS[event.category] || Globe;
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-secondary/60 transition-colors"
                  >
                    <Icon className="w-3 h-3 text-accent flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-mono text-foreground truncate">{event.title}</div>
                      <div className="text-[8px] font-mono text-muted-foreground">
                        {event.category.toUpperCase()} {event.country ? `• ${event.country}` : ''} • {event.severity}
                      </div>
                    </div>
                  </div>
                );
              })}
            </ResultSection>
          )}

          {results.alerts.length > 0 && (
            <ResultSection title="ALERTS">
              {results.alerts.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-secondary/60 transition-colors"
                >
                  <Shield className="w-3 h-3 text-alert flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono text-foreground truncate">{alert.title}</div>
                    <div className="text-[8px] font-mono text-muted-foreground">
                      {alert.severity.toUpperCase()} • {alert.type}
                    </div>
                  </div>
                </div>
              ))}
            </ResultSection>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-3 py-1.5 text-[8px] font-mono font-bold text-muted-foreground tracking-widest border-b border-border bg-secondary/30">
        {title}
      </div>
      {children}
    </div>
  );
}
