import { MapEntity } from '@/data/mockData';
import { motion } from 'framer-motion';
import { X, Plane, Ship, Building2, MapPin, AlertTriangle } from 'lucide-react';

interface EntityDetailProps {
  entity: MapEntity;
  onClose: () => void;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  aircraft: Plane,
  ship: Ship,
  base: Building2,
  strategic: MapPin,
  alert: AlertTriangle,
};

const TYPE_COLORS: Record<string, string> = {
  aircraft: 'text-aircraft border-aircraft',
  ship: 'text-ship border-ship',
  base: 'text-base border-base',
  strategic: 'text-strategic border-strategic',
  alert: 'text-alert border-alert',
};

export default function EntityDetail({ entity, onClose }: EntityDetailProps) {
  const Icon = TYPE_ICONS[entity.type] || MapPin;
  const colorClass = TYPE_COLORS[entity.type] || 'text-foreground border-border';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`p-4 rounded-lg border bg-card ${colorClass.split(' ')[1]}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colorClass.split(' ')[0]}`} />
          <h3 className="text-sm font-semibold text-foreground">{entity.name}</h3>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 font-mono text-[11px]">
        {entity.callsign && (
          <Row label="CALLSIGN" value={entity.callsign} />
        )}
        <Row label="TYPE" value={entity.type.toUpperCase()} />
        <Row
          label="CLASS"
          value={entity.classification.toUpperCase()}
          valueClass={
            entity.classification === 'military' ? 'text-warning' :
            entity.classification === 'unknown' ? 'text-alert' : 'text-muted-foreground'
          }
        />
        <Row label="POSITION" value={`${entity.lat.toFixed(4)}°N, ${entity.lng.toFixed(4)}°E`} />
        {entity.altitude && <Row label="ALTITUDE" value={`${entity.altitude.toLocaleString()} ft`} />}
        {entity.speed && <Row label="SPEED" value={`${entity.speed} kts`} />}
        {entity.heading !== undefined && <Row label="HEADING" value={`${Math.round(entity.heading)}°`} />}
        <Row label="SOURCE" value={entity.source} />
        {entity.country && <Row label="COUNTRY" value={entity.country} />}
        <div className="pt-2 border-t border-border">
          <p className="text-muted-foreground leading-relaxed">{entity.details}</p>
        </div>
      </div>
    </motion.div>
  );
}

function Row({ label, value, valueClass = 'text-foreground' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
