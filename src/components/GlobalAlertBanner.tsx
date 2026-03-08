import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, Volume2, VolumeX } from 'lucide-react';
import { GlobalEvent } from '@/hooks/useGlobalEvents';
import { calculateEventPriority, ScoredEvent } from '@/data/eventPriorityEngine';
import { useCriticalAlertSound } from '@/hooks/useCriticalAlertSound';

interface GlobalAlertBannerProps {
  alert: GlobalEvent | null;
  onDismiss: () => void;
}

export default function GlobalAlertBanner({ alert, onDismiss }: GlobalAlertBannerProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const playAlert = useCriticalAlertSound();
  const lastAlertId = useRef<string | null>(null);

  const scored: ScoredEvent | null = useMemo(
    () => (alert ? calculateEventPriority(alert) : null),
    [alert]
  );

  const isCritical = scored && scored.priorityScore >= 80;

  // Play sound on new critical alert
  useEffect(() => {
    if (scored && scored.priorityScore >= 80 && soundEnabled && scored.id !== lastAlertId.current) {
      lastAlertId.current = scored.id;
      playAlert();
    }
  }, [scored, soundEnabled, playAlert]);

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden flex-shrink-0"
        >
          <div
            className={`flex items-center gap-3 px-4 py-2 border-b transition-colors ${
              isCritical
                ? 'bg-destructive/20 border-destructive/40 critical-alert-flash'
                : 'bg-destructive/15 border-destructive/30'
            }`}
          >
            <ShieldAlert className={`w-4 h-4 text-destructive flex-shrink-0 ${isCritical ? 'animate-pulse' : 'blink'}`} />
            <span className="text-[10px] font-mono font-bold text-destructive tracking-widest flex-shrink-0">
              {isCritical ? '⚠ CRITICAL GLOBAL ALERT' : 'BREAKING ALERT'}
            </span>
            {scored && (
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                isCritical
                  ? 'bg-destructive/25 text-destructive'
                  : 'bg-warning/20 text-warning'
              }`}>
                PRI {scored.priorityScore}
              </span>
            )}
            <span className="text-xs font-mono text-foreground truncate flex-1">
              {alert.title}
            </span>
            {alert.country && (
              <span className="text-[9px] font-mono text-muted-foreground px-1.5 py-0.5 bg-secondary rounded flex-shrink-0">
                {alert.country}
              </span>
            )}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              title={soundEnabled ? 'Mute alerts' : 'Unmute alerts'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
