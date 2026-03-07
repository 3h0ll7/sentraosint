import { MapEntity } from '@/data/mockData';
import { TrailHistory } from '@/hooks/useOSINTData';
import { motion } from 'framer-motion';
import { X, Plane, Ship, Building2, MapPin, AlertTriangle, Shield } from 'lucide-react';
import { getThreatColor, getThreatLabel, getThreatTailwindClass } from '@/data/threatEngine';

interface EntityDetailProps {
  entity: MapEntity;
  onClose: () => void;
  trails?: TrailHistory;
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

export default function EntityDetail({ entity, onClose, trails }: EntityDetailProps) {
  const Icon = TYPE_ICONS[entity.type] || MapPin;
  const colorClass = TYPE_COLORS[entity.type] || 'text-foreground border-border';
  const threatScore = entity.threatScore ?? 0;
  const threatColor = getThreatColor(threatScore);
  const threatLabel = getThreatLabel(threatScore);
  const threatTwClass = getThreatTailwindClass(threatScore);
  const trailPoints = trails?.[entity.id]?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={`p-4 rounded-lg border bg-card/95 backdrop-blur-sm ${colorClass.split(' ')[1]}`}
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

      {/* Threat Score Bar */}
      {(entity.type === 'aircraft' || entity.type === 'ship') && (
        <div className="mb-3 p-2 rounded-md bg-background border border-border">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Shield className={`w-3 h-3 ${threatTwClass}`} />
              <span className="text-[10px] font-mono text-muted-foreground">THREAT SCORE</span>
            </div>
            <span className={`text-[10px] font-mono font-bold ${threatTwClass}`}>{threatLabel}</span>
          </div>
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${threatScore}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: threatColor, boxShadow: `0 0 8px ${threatColor}66` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] font-mono text-muted-foreground">0</span>
            <span className={`text-[10px] font-mono font-bold ${threatTwClass}`}>{threatScore}</span>
            <span className="text-[8px] font-mono text-muted-foreground">100</span>
          </div>
        </div>
      )}

      <div className="space-y-2 font-mono text-[11px]">
        {entity.callsign && <Row label="CALLSIGN" value={entity.callsign} />}
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
        {entity.origin && <Row label="ORIGIN" value={entity.origin} />}
        <Row label="SOURCE" value={entity.source} />
        {entity.country && <Row label="COUNTRY" value={entity.country} />}
        {trailPoints > 0 && <Row label="TRACK PTS" value={`${trailPoints} recorded`} />}
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
