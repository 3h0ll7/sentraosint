import { motion } from 'framer-motion';
import { RiskPoint, getRiskColor, getRiskLabel } from '@/data/riskEngine';
import { Shield, Flame, TrendingDown, HeartPulse, Newspaper } from 'lucide-react';

interface RiskLegendProps {
  riskPoints: RiskPoint[];
}

const RISK_LEVELS = [
  { min: 80, label: 'CRITICAL', color: '#ff0000' },
  { min: 60, label: 'HIGH', color: '#ff6600' },
  { min: 40, label: 'MODERATE', color: '#ffcc00' },
  { min: 20, label: 'LOW', color: '#00cc33' },
  { min: 0, label: 'VERY LOW', color: '#0066ff' },
];

export default function RiskLegend({ riskPoints }: RiskLegendProps) {
  const maxPoint = riskPoints.reduce((max, p) => (p.score > max.score ? p : max), riskPoints[0]);
  const avgScore = riskPoints.length > 0
    ? Math.round(riskPoints.reduce((s, p) => s + p.score, 0) / riskPoints.length)
    : 0;

  const criticalCount = riskPoints.filter(p => p.score >= 80).length;
  const highCount = riskPoints.filter(p => p.score >= 60 && p.score < 80).length;

  return (
    <div className="space-y-3">
      {/* Risk Scale */}
      <div className="space-y-1">
        <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-1">RISK SCALE</div>
        <div className="flex rounded overflow-hidden h-2">
          {RISK_LEVELS.slice().reverse().map(level => (
            <div
              key={level.label}
              className="flex-1"
              style={{ background: level.color }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[8px] font-mono text-muted-foreground">
          <span>0</span>
          <span>20</span>
          <span>40</span>
          <span>60</span>
          <span>80</span>
          <span>100</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div
          className="bg-secondary/50 rounded p-2 border border-border"
          animate={{ borderColor: avgScore >= 60 ? 'hsl(var(--alert))' : 'hsl(var(--border))' }}
        >
          <div className="text-[8px] font-mono text-muted-foreground">AVG RISK</div>
          <div className="text-sm font-mono font-bold" style={{ color: getRiskColor(avgScore) }}>
            {avgScore}
          </div>
          <div className="text-[8px] font-mono" style={{ color: getRiskColor(avgScore) }}>
            {getRiskLabel(avgScore)}
          </div>
        </motion.div>
        <div className="bg-secondary/50 rounded p-2 border border-border">
          <div className="text-[8px] font-mono text-muted-foreground">ZONES</div>
          <div className="text-[9px] font-mono space-y-0.5 mt-1">
            <div className="flex justify-between">
              <span className="text-alert">CRITICAL</span>
              <span className="text-alert font-bold">{criticalCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-warning">HIGH</span>
              <span className="text-warning font-bold">{highCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Risk Breakdown */}
      {maxPoint && (
        <div className="bg-secondary/30 rounded p-2 border border-border">
          <div className="text-[8px] font-mono text-muted-foreground mb-1">HIGHEST RISK ZONE</div>
          <div className="text-[10px] font-mono text-foreground mb-1">
            {maxPoint.lat.toFixed(1)}°, {maxPoint.lng.toFixed(1)}° — <span style={{ color: getRiskColor(maxPoint.score) }}>{maxPoint.score}/100</span>
          </div>
          <div className="space-y-1">
            <BreakdownBar icon={Shield} label="MIL" value={maxPoint.breakdown.military} color="#ff3333" />
            <BreakdownBar icon={Flame} label="DIS" value={maxPoint.breakdown.disaster} color="#ff6b35" />
            <BreakdownBar icon={TrendingDown} label="ECO" value={maxPoint.breakdown.economy} color="#ffaa00" />
            <BreakdownBar icon={HeartPulse} label="HLT" value={maxPoint.breakdown.health} color="#00ff41" />
            <BreakdownBar icon={Newspaper} label="NEW" value={maxPoint.breakdown.news} color="#00aa2a" />
          </div>
        </div>
      )}
    </div>
  );
}

function BreakdownBar({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number; color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-2.5 h-2.5 flex-shrink-0" style={{ color }} />
      <span className="text-[8px] font-mono text-muted-foreground w-6">{label}</span>
      <div className="flex-1 h-1.5 bg-background rounded overflow-hidden">
        <motion.div
          className="h-full rounded"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[8px] font-mono w-5 text-right" style={{ color }}>{value}</span>
    </div>
  );
}
