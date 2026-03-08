import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { GlobalEvent } from '@/hooks/useGlobalEvents';

interface GlobalAlertBannerProps {
  alert: GlobalEvent | null;
  onDismiss: () => void;
}

export default function GlobalAlertBanner({ alert, onDismiss }: GlobalAlertBannerProps) {
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
          <div className="flex items-center gap-3 px-4 py-2 bg-destructive/15 border-b border-destructive/30">
            <AlertTriangle className="w-4 h-4 text-destructive blink flex-shrink-0" />
            <span className="text-[10px] font-mono font-bold text-destructive tracking-widest flex-shrink-0">
              BREAKING ALERT
            </span>
            <span className="text-xs font-mono text-foreground truncate flex-1">
              {alert.title}
            </span>
            {alert.country && (
              <span className="text-[9px] font-mono text-muted-foreground px-1.5 py-0.5 bg-secondary rounded flex-shrink-0">
                {alert.country}
              </span>
            )}
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
