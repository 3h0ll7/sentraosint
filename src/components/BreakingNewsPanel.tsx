import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Swords, TrendingDown, Ship, HeartPulse, Landmark, ExternalLink, ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import { GlobalEvent, EventCategory } from '@/hooks/useGlobalEvents';
import { getTopIntelEvents, ScoredEvent } from '@/data/eventPriorityEngine';

interface BreakingNewsPanelProps {
  events: GlobalEvent[];
}

const CATEGORY_CONFIG: Record<Exclude<EventCategory, 'disaster'>, { icon: React.ElementType; colorClass: string; label: string }> = {
  military: { icon: Swords, colorClass: 'text-alert', label: 'MILITARY' },
  economy: { icon: TrendingDown, colorClass: 'text-warning', label: 'ECONOMY' },
  trade: { icon: Ship, colorClass: 'text-ship', label: 'TRADE' },
  health: { icon: HeartPulse, colorClass: 'text-primary', label: 'HEALTH' },
  political: { icon: Landmark, colorClass: 'text-strategic', label: 'POLITICAL' },
};

const PRIORITY_CONFIG: Record<ScoredEvent['priorityLevel'], { icon: React.ElementType; label: string; className: string; barColor: string }> = {
  critical: { icon: ShieldAlert, label: 'CRITICAL GLOBAL ALERT', className: 'text-destructive border-l-destructive bg-destructive/5', barColor: 'bg-destructive' },
  high: { icon: AlertTriangle, label: 'HIGH PRIORITY INTEL', className: 'text-warning border-l-warning bg-warning/5', barColor: 'bg-warning' },
  normal: { icon: Info, label: 'INTEL', className: 'text-muted-foreground border-l-border bg-secondary/30', barColor: 'bg-accent' },
};

export default function BreakingNewsPanel({ events }: BreakingNewsPanelProps) {
  const scoredEvents = useMemo(() => getTopIntelEvents(events), [events]);

  if (scoredEvents.length === 0) {
    return (
      <div className="text-center py-4 text-[10px] font-mono text-muted-foreground">
        No significant intel events detected
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 max-h-[350px] overflow-y-auto">
      {scoredEvents.map((event, i) => {
        const catConfig = CATEGORY_CONFIG[event.category as Exclude<EventCategory, 'disaster'>];
        if (!catConfig) return null;
        const Icon = catConfig.icon;
        const priority = PRIORITY_CONFIG[event.priorityLevel];
        const PriorityIcon = priority.icon;
        const timeAgo = getTimeAgo(event.created_at);

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`p-2.5 rounded-md border border-l-2 ${priority.className} hover:brightness-110 transition-all`}
          >
            {/* Priority badge */}
            <div className="flex items-center gap-1 mb-1">
              <PriorityIcon className="w-2.5 h-2.5" />
              <span className="text-[7px] font-display font-bold tracking-widest opacity-70">
                {priority.label}
              </span>
              <span className="text-[8px] font-mono font-bold ml-auto tabular-nums">
                {event.priorityScore}
              </span>
            </div>

            {/* Category + Country */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <Icon className={`w-3 h-3 ${catConfig.colorClass}`} />
              <span className={`text-[9px] font-mono font-bold ${catConfig.colorClass}`}>{catConfig.label}</span>
              {event.country && (
                <span className="text-[8px] font-mono text-muted-foreground ml-auto">{event.country}</span>
              )}
            </div>

            {/* Title */}
            <h4 className="text-[11px] font-semibold text-foreground leading-tight">{event.title}</h4>
            {event.description && (
              <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{event.description}</p>
            )}

            {/* Priority bar */}
            <div className="mt-1.5 h-1 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full ${priority.barColor} transition-all`}
                style={{ width: `${event.priorityScore}%` }}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 mt-1">
              {event.source && (
                <span className="text-[8px] font-mono text-muted-foreground">{event.source}</span>
              )}
              <span className="text-[8px] font-mono text-muted-foreground ml-auto">{timeAgo}</span>
              {event.url && (
                <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
