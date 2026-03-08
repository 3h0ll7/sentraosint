import { motion } from 'framer-motion';
import { Shield, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { StabilityIndex } from '@/data/intelligenceEngine';

interface StabilityIndicatorProps {
  stability: StabilityIndex;
}

export default function StabilityIndicator({ stability }: StabilityIndicatorProps) {
  const { score, trend } = stability;

  const color = score >= 70 ? 'text-primary' : score >= 45 ? 'text-warning' : score >= 25 ? 'text-destructive' : 'text-alert';
  const bgColor = score >= 70 ? 'bg-primary/10 border-primary/30' : score >= 45 ? 'bg-warning/10 border-warning/30' : score >= 25 ? 'bg-destructive/10 border-destructive/30' : 'bg-alert/10 border-alert/30';

  const TrendIcon = trend === 'rising tension' || trend === 'critical' ? TrendingUp :
    trend === 'declining tension' ? TrendingDown : Minus;

  return (
    <motion.div
      className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono ${bgColor}`}
      animate={score < 30 ? { opacity: [1, 0.6, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <Shield className={`w-3 h-3 ${color}`} />
      <span className={`font-bold ${color}`}>{score}</span>
      <span className="text-muted-foreground">/100</span>
      <TrendIcon className={`w-3 h-3 ${color}`} />
      <span className={`text-[8px] uppercase ${color}`}>{trend}</span>
    </motion.div>
  );
}
