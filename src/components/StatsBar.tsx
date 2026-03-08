import { motion } from 'framer-motion';
import { Plane, Ship, Building2, AlertTriangle, Eye, Radio, Globe } from 'lucide-react';

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
  globalEventCount?: number;
}

export default function StatsBar({ stats, globalEventCount = 0 }: StatsBarProps) {
  const items = [
    { label: 'AIRCRAFT', value: stats.totalAircraft, icon: Plane, colorClass: 'text-aircraft' },
    { label: 'NAVAL', value: stats.totalShips, icon: Ship, colorClass: 'text-ship' },
    { label: 'BASES', value: stats.totalBases, icon: Building2, colorClass: 'text-base' },
    { label: 'MIL TRACK', value: stats.militaryAircraft + stats.militaryShips, icon: Eye, colorClass: 'text-warning' },
    { label: 'ALERTS', value: stats.activeAlerts, icon: AlertTriangle, colorClass: 'text-alert' },
    { label: 'UNKNOWN', value: stats.unknownEntities, icon: Radio, colorClass: 'text-primary' },
    { label: 'EVENTS', value: globalEventCount, icon: Globe, colorClass: 'text-accent' },
  ];

  return (
    <div className="flex items-center gap-0 px-0 py-0 bg-card/80 border-b border-border overflow-x-auto">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center gap-2 px-4 py-2 border-r border-border last:border-r-0 flex-shrink-0"
        >
          <item.icon className={`w-3.5 h-3.5 ${item.colorClass}`} />
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-muted-foreground tracking-widest leading-none">{item.label}</span>
            <span className={`text-sm font-display font-bold ${item.colorClass} leading-none mt-0.5`}>{item.value}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
