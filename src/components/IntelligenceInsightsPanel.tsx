import { motion } from 'framer-motion';
import { Zap, Link2, AlertTriangle } from 'lucide-react';
import { CorrelationInsight, PatternAlert } from '@/data/intelligenceEngine';

interface IntelligenceInsightsPanelProps {
  correlations: CorrelationInsight[];
  patterns: PatternAlert[];
}

export default function IntelligenceInsightsPanel({ correlations, patterns }: IntelligenceInsightsPanelProps) {
  const allInsights = [
    ...correlations.map(c => ({ type: 'correlation' as const, ...c })),
    ...patterns.map(p => ({ type: 'pattern' as const, id: p.id, title: p.pattern, description: p.description, severity: p.severity })),
  ];

  if (allInsights.length === 0) {
    return (
      <div className="text-[10px] font-mono text-muted-foreground text-center py-3">
        No correlations detected
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {allInsights.slice(0, 8).map((insight, i) => {
        const isCorrelation = insight.type === 'correlation';
        const severityColor = insight.severity === 'critical' ? 'text-alert border-alert/30' :
          insight.severity === 'high' ? 'text-destructive border-destructive/30' : 'text-warning border-warning/30';
        const Icon = isCorrelation ? Link2 : Zap;

        return (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`px-2 py-2 rounded bg-secondary/30 border ${severityColor.split(' ')[1]}`}
          >
            <div className="flex items-start gap-1.5">
              <Icon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${severityColor.split(' ')[0]}`} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-mono font-bold ${severityColor.split(' ')[0]}`}>
                    {insight.title}
                  </span>
                  <span className="text-[7px] font-mono text-muted-foreground uppercase px-1 bg-background rounded">
                    {isCorrelation ? 'CORR' : 'PATTERN'}
                  </span>
                </div>
                <div className="text-[8px] font-mono text-muted-foreground mt-0.5 leading-relaxed">
                  {insight.description}
                </div>
                {isCorrelation && 'signals' in insight && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(insight as CorrelationInsight).signals.map(s => (
                      <span key={s} className="text-[7px] font-mono px-1 py-0.5 rounded bg-background text-primary border border-border">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
