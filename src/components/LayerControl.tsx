import { motion } from 'framer-motion';
import { Plane, Ship, Building2, MapPin, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { EntityType } from '@/data/mockData';

interface LayerControlProps {
  visibleLayers: Record<EntityType, boolean>;
  onToggle: (layer: EntityType) => void;
  counts: Record<EntityType, number>;
}

const LAYER_CONFIG: { type: EntityType; label: string; icon: React.ElementType; colorClass: string }[] = [
  { type: 'aircraft', label: 'Aircraft', icon: Plane, colorClass: 'text-aircraft' },
  { type: 'ship', label: 'Naval', icon: Ship, colorClass: 'text-ship' },
  { type: 'base', label: 'Bases', icon: Building2, colorClass: 'text-base' },
  { type: 'strategic', label: 'Strategic', icon: MapPin, colorClass: 'text-strategic' },
  { type: 'alert', label: 'Alerts', icon: AlertTriangle, colorClass: 'text-alert' },
];

export default function LayerControl({ visibleLayers, onToggle, counts }: LayerControlProps) {
  return (
    <div className="flex flex-col gap-1">
      {LAYER_CONFIG.map(({ type, label, icon: Icon, colorClass }) => {
        const visible = visibleLayers[type];
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
