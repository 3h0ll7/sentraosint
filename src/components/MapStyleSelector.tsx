import { useState } from 'react';
import { motion } from 'framer-motion';
import { Map, Satellite, Layers } from 'lucide-react';

export type MapStyle = 'dark' | 'satellite' | 'hybrid';

interface MapStyleSelectorProps {
  currentStyle: MapStyle;
  onStyleChange: (style: MapStyle) => void;
}

const STYLES: { id: MapStyle; label: string; icon: React.ElementType }[] = [
  { id: 'dark', label: 'TACTICAL', icon: Map },
  { id: 'satellite', label: 'SATELLITE', icon: Satellite },
  { id: 'hybrid', label: 'HYBRID', icon: Layers },
];

export default function MapStyleSelector({ currentStyle, onStyleChange }: MapStyleSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute top-3 right-3 z-[500]">
      <button
        onClick={() => setOpen(!open)}
        className="bg-card/90 backdrop-blur-sm border border-border rounded-md p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Layers className="w-4 h-4" />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-10 right-0 bg-card/95 backdrop-blur-sm border border-border rounded-md overflow-hidden"
        >
          {STYLES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onStyleChange(id); setOpen(false); }}
              className={`flex items-center gap-2 px-3 py-2 w-full text-left text-[10px] font-mono transition-all ${
                currentStyle === id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export function getTileUrls(style: MapStyle): { base: string; labels?: string } {
  switch (style) {
    case 'satellite':
      return {
        base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      };
    case 'hybrid':
      return {
        base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        labels: 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
      };
    case 'dark':
    default:
      return {
        base: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
        labels: 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
      };
  }
}
