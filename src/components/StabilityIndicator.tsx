import { motion } from 'framer-motion';
import { Shield, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { StabilityIndex } from '@/data/intelligenceEngine';

interface StabilityIndicatorProps {
  stability: StabilityIndex;
}

export default function StabilityIndicator({ stability }: StabilityIndicatorProps) {
  const { score, trend } = stability;

  const color = score >= 70 ? 'text-accent' : score >= 45 ? 'text-warning' : score >= 25 ? 'text-destructive' : 'text-alert';
  const bgColor = score >= 70 ? 'bg-accent/10 border-accent/30' : score >= 45 ? 'bg-warning/10 border-warning/30' : score >= 25 ? 'bg-destructive/10 border-destructive/30' : 'bg-alert/10 border-alert/30';

  const TrendIcon = trend === 'rising tension' || trend === 'critical' ? TrendingUp :
    trend === 'declining tension' ? TrendingDown : Minus;

  return (
    <motion.div
      className={`flex items-center gap-2 px-3 py-1.5 rounded border ${bgColor}`}
      animate={score < 30 ? { opacity: [1, 0.6, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <Shield className={`w-3.5 h-3.5 ${color}`} />
      <div className="flex items-baseline gap-1">
        <span className={`text-base font-display font-bold ${color}`}>{score}</span>
        <span className="text-[9px] font-mono text-muted-foreground">/100</span>
      </div>
      <div className="w-px h-4 bg-border" />
      <TrendIcon className={`w-3 h-3 ${color}`} />
      <span className={`text-[9px] font-mono uppercase tracking-wider ${color}`}>{trend}</span>
    </motion.div>
  );
}
