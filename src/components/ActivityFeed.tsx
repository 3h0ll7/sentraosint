import { ActivityEvent } from '@/data/mockData';
import { Plane, Ship, AlertTriangle, MapPin, Building2 } from 'lucide-react';
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
            className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-secondary/50 transition-colors"
          >
            <Icon className={`w-3 h-3 mt-0.5 ${colorClass} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-mono font-semibold ${colorClass}`}>{event.action}</span>
                <span className="text-[9px] text-muted-foreground">{timeAgo(event.timestamp)}</span>
              </div>
              <p className="text-[10px] text-secondary-foreground truncate">{event.description}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
