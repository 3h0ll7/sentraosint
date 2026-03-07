import { ActivityEvent } from '@/data/mockData';
import { Plane, Ship, AlertTriangle, MapPin, Building2, Compass, Gauge, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActivityFeedProps {
  events: ActivityEvent[];
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  aircraft: Plane,
  ship: Ship,
  alert: AlertTriangle,
  strategic: MapPin,
  base: Building2,
};

const TYPE_COLORS: Record<string, string> = {
  aircraft: 'text-aircraft',
  ship: 'text-ship',
  alert: 'text-alert',
  strategic: 'text-strategic',
  base: 'text-base',
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <div className="flex flex-col gap-1">
      {events.map((event, i) => {
        const Icon = TYPE_ICONS[event.type] || MapPin;
        const colorClass = TYPE_COLORS[event.type] || 'text-foreground';
        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="px-2 py-2 rounded-md hover:bg-secondary/50 transition-colors border border-transparent hover:border-border"
          >
            {/* Header row */}
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-3.5 h-3.5 ${colorClass} flex-shrink-0`} />
              <span className={`text-[10px] font-mono font-bold ${colorClass}`}>
                {event.callsign || event.action}
              </span>
              <span className={`text-[9px] font-mono font-semibold px-1 py-0.5 rounded ${colorClass} bg-secondary`}>
                {event.action}
              </span>
              <span className="text-[9px] text-muted-foreground ml-auto">{timeAgo(event.timestamp)}</span>
            </div>

            {/* Description */}
            <p className="text-[10px] text-secondary-foreground mb-1.5 pl-5">{event.description}</p>

            {/* Detailed operational data */}
            <div className="flex items-center gap-3 pl-5 flex-wrap">
              {event.origin && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-muted-foreground" />
                  <span className="text-[9px] font-mono text-muted-foreground">{event.origin}</span>
                </div>
              )}
              {event.heading !== undefined && (
                <div className="flex items-center gap-1">
                  <Compass className="w-2.5 h-2.5 text-muted-foreground" />
                  <span className="text-[9px] font-mono text-muted-foreground">{Math.round(event.heading)}°</span>
                </div>
              )}
              {event.speed !== undefined && (
                <div className="flex items-center gap-1">
                  <Gauge className="w-2.5 h-2.5 text-muted-foreground" />
                  <span className="text-[9px] font-mono text-muted-foreground">{event.speed} kts</span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
