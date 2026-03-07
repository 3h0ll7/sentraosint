import { Alert as AlertType } from '@/data/mockData';
import { AlertTriangle, AlertCircle, Info, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

interface AlertsPanelProps {
  alerts: AlertType[];
}

const SEVERITY_CONFIG = {
  critical: { icon: AlertTriangle, borderClass: 'border-alert', bgClass: 'bg-alert/10', textClass: 'text-alert', label: 'CRITICAL' },
  high: { icon: AlertCircle, borderClass: 'border-warning', bgClass: 'bg-warning/10', textClass: 'text-warning', label: 'HIGH' },
  medium: { icon: Info, borderClass: 'border-accent', bgClass: 'bg-accent/10', textClass: 'text-accent', label: 'MEDIUM' },
  low: { icon: Bell, borderClass: 'border-muted-foreground', bgClass: 'bg-muted/50', textClass: 'text-muted-foreground', label: 'LOW' },
};

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  const sorted = [...alerts].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((alert, i) => {
        const config = SEVERITY_CONFIG[alert.severity];
        const Icon = config.icon;
        return (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-3 rounded-md border ${config.borderClass} ${config.bgClass}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-3.5 h-3.5 ${config.textClass} ${alert.severity === 'critical' ? 'blink' : ''}`} />
              <span className={`text-[10px] font-mono font-semibold ${config.textClass}`}>{config.label}</span>
            </div>
            <h4 className="text-xs font-semibold text-foreground">{alert.title}</h4>
            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{alert.description}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
