import { motion } from 'framer-motion';
import { Plane, Ship, Building2, AlertTriangle, Eye, Radio } from 'lucide-react';

interface StatsBarProps {
  stats: {
    totalAircraft: number;
    totalShips: number;
    totalBases: number;
    militaryAircraft: number;
    militaryShips: number;
    activeAlerts: number;
    unknownEntities: number;
  };
}

export default function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { label: 'Aircraft', value: stats.totalAircraft, icon: Plane, colorClass: 'text-aircraft' },
    { label: 'Naval', value: stats.totalShips, icon: Ship, colorClass: 'text-ship' },
    { label: 'Bases', value: stats.totalBases, icon: Building2, colorClass: 'text-base' },
    { label: 'Mil Track', value: stats.militaryAircraft + stats.militaryShips, icon: Eye, colorClass: 'text-warning' },
    { label: 'Alerts', value: stats.activeAlerts, icon: AlertTriangle, colorClass: 'text-alert' },
    { label: 'Unknown', value: stats.unknownEntities, icon: Radio, colorClass: 'text-strategic' },
  ];

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-card border-b border-border overflow-x-auto">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-1.5 flex-shrink-0"
        >
          <item.icon className={`w-3.5 h-3.5 ${item.colorClass}`} />
          <span className="text-[10px] font-mono text-muted-foreground">{item.label}</span>
          <span className={`text-xs font-mono font-bold ${item.colorClass}`}>{item.value}</span>
        </motion.div>
      ))}
    </div>
  );
}
