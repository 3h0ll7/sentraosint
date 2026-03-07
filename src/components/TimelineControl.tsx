import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';

interface TimelineControlProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  currentTime: number;
  onTimeChange: (time: number) => void;
}

const SPEEDS = [0.5, 1, 2, 5, 10];

export default function TimelineControl({
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onSpeedChange,
  currentTime,
  onTimeChange,
}: TimelineControlProps) {
  const [expanded, setExpanded] = useState(false);

  const hours = Math.floor(currentTime / 60);
  const minutes = currentTime % 60;
  const timeLabel = `T-${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500]"
    >
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-4 py-2 flex items-center gap-3 shadow-lg">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Clock className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onTimeChange(Math.max(0, currentTime - 60))}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <SkipBack className="w-3 h-3" />
        </button>

        <button
          onClick={onTogglePlay}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            isPlaying ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground border border-border'
          }`}
        >
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
        </button>

        <button
          onClick={() => onTimeChange(Math.min(1440, currentTime + 60))}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <SkipForward className="w-3 h-3" />
        </button>

        {/* Timeline slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={1440}
            step={5}
            value={currentTime}
            onChange={(e) => onTimeChange(Number(e.target.value))}
            className="w-40 h-1 appearance-none bg-border rounded-full outline-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_6px_hsl(160_100%_40%/0.5)]
              [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0"
          />
          <span className="text-[10px] font-mono text-primary min-w-[52px]">{timeLabel}</span>
        </div>

        {/* Speed control */}
        {expanded && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            className="flex items-center gap-1 border-l border-border pl-3"
          >
            <span className="text-[9px] font-mono text-muted-foreground">SPD</span>
            {SPEEDS.map(s => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-all ${
                  playbackSpeed === s
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}x
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
