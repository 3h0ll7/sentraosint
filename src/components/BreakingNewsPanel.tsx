import { motion } from 'framer-motion';
import { Swords, TrendingDown, Ship, HeartPulse, CloudLightning, Landmark, ExternalLink } from 'lucide-react';
import { GlobalEvent, EventCategory } from '@/hooks/useGlobalEvents';

interface BreakingNewsPanelProps {
  events: GlobalEvent[];
}

const CATEGORY_CONFIG: Record<EventCategory, { icon: React.ElementType; colorClass: string; label: string }> = {
  military: { icon: Swords, colorClass: 'text-alert', label: 'MILITARY' },
  economy: { icon: TrendingDown, colorClass: 'text-warning', label: 'ECONOMY' },
  trade: { icon: Ship, colorClass: 'text-ship', label: 'TRADE' },
  health: { icon: HeartPulse, colorClass: 'text-primary', label: 'HEALTH' },
  disaster: { icon: CloudLightning, colorClass: 'text-destructive', label: 'DISASTER' },
  political: { icon: Landmark, colorClass: 'text-strategic', label: 'POLITICAL' },
};

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-destructive',
  high: 'bg-warning',
  medium: 'bg-accent',
  low: 'bg-muted-foreground',
};

export default function BreakingNewsPanel({ events }: BreakingNewsPanelProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-4 text-[10px] font-mono text-muted-foreground">
        No events in selected categories
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
      {events.slice(0, 20).map((event, i) => {
        const config = CATEGORY_CONFIG[event.category];
        const Icon = config.icon;
        const timeAgo = getTimeAgo(event.created_at);

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`p-2.5 rounded-md border bg-secondary/30 border-border hover:bg-secondary/60 transition-colors ${
              event.is_breaking ? 'border-l-2 border-l-destructive' : ''
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[event.severity]} ${event.severity === 'critical' ? 'blink' : ''}`} />
              <Icon className={`w-3 h-3 ${config.colorClass}`} />
              <span className={`text-[9px] font-mono font-bold ${config.colorClass}`}>{config.label}</span>
              {event.country && (
                <span className="text-[8px] font-mono text-muted-foreground ml-auto">{event.country}</span>
              )}
            </div>
            <h4 className="text-[11px] font-semibold text-foreground leading-tight">{event.title}</h4>
            {event.description && (
              <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{event.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
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
