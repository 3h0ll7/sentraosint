import { motion } from 'framer-motion';
import { Brain, AlertTriangle, Zap, TrendingUp } from 'lucide-react';
import { GlobalConcern } from '@/data/intelligenceEngine';

interface GlobalConcernsPanelProps {
  concerns: GlobalConcern[];
}

const SENTIMENT_STYLES: Record<string, string> = {
  critical: 'text-alert',
  negative: 'text-destructive',
  neutral: 'text-warning',
};

export default function GlobalConcernsPanel({ concerns }: GlobalConcernsPanelProps) {
  if (concerns.length === 0) {
    return (
      <div className="text-[10px] font-mono text-muted-foreground text-center py-4">
        Analyzing global signals...
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {concerns.map((concern, i) => (
        <motion.div
          key={concern.topic}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-2 px-2 py-2 rounded bg-secondary/40 border border-border"
        >
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-background border border-border text-[9px] font-mono font-bold text-muted-foreground">
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-mono font-bold ${SENTIMENT_STYLES[concern.sentiment]}`}>
                {concern.topic}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[8px] font-mono text-muted-foreground uppercase">{concern.category}</span>
              <span className="text-[8px] font-mono text-muted-foreground">•</span>
              <span className="text-[8px] font-mono text-muted-foreground">{concern.eventCount} signals</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <div className="w-12 h-1.5 bg-background rounded overflow-hidden">
              <motion.div
                className="h-full rounded"
                style={{
                  background: concern.intensity >= 70 ? 'hsl(var(--alert))' :
                    concern.intensity >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--primary))',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${concern.intensity}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
              />
            </div>
            <span className={`text-[8px] font-mono ${
              concern.intensity >= 70 ? 'text-alert' : concern.intensity >= 40 ? 'text-warning' : 'text-primary'
            }`}>
              {concern.intensity}%
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
