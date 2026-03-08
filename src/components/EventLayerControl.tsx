import { motion } from 'framer-motion';
import { Swords, TrendingDown, Ship, HeartPulse, CloudLightning, Landmark, Eye, EyeOff } from 'lucide-react';
import { EventCategory } from '@/hooks/useGlobalEvents';

interface EventLayerControlProps {
  visibleCategories: Record<EventCategory, boolean>;
  onToggle: (category: EventCategory) => void;
  counts: Record<EventCategory, number>;
}

const CATEGORY_LAYERS: { type: EventCategory; label: string; icon: React.ElementType; colorClass: string }[] = [
  { type: 'military', label: 'Conflict', icon: Swords, colorClass: 'text-alert' },
  { type: 'disaster', label: 'Disasters', icon: CloudLightning, colorClass: 'text-destructive' },
  { type: 'trade', label: 'Trade', icon: Ship, colorClass: 'text-ship' },
  { type: 'economy', label: 'Economy', icon: TrendingDown, colorClass: 'text-warning' },
  { type: 'health', label: 'Health', icon: HeartPulse, colorClass: 'text-primary' },
  { type: 'political', label: 'Political', icon: Landmark, colorClass: 'text-strategic' },
];

export default function EventLayerControl({ visibleCategories, onToggle, counts }: EventLayerControlProps) {
  return (
    <div className="flex flex-col gap-1">
      {CATEGORY_LAYERS.map(({ type, label, icon: Icon, colorClass }) => {
        const visible = visibleCategories[type];
        return (
          <motion.button
            key={type}
            onClick={() => onToggle(type)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono transition-all border ${
              visible
                ? 'bg-secondary border-border'
                : 'bg-background border-transparent opacity-50'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
            <span className="text-foreground flex-1 text-left">{label}</span>
            <span className={`text-[10px] ${colorClass}`}>{counts[type] || 0}</span>
            {visible ? (
              <Eye className="w-3 h-3 text-muted-foreground" />
            ) : (
              <EyeOff className="w-3 h-3 text-muted-foreground" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
