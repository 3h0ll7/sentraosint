import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { GlobalEvent, EventCategory } from '@/hooks/useGlobalEvents';

interface GlobalEventLayerProps {
  events: GlobalEvent[];
  visible: boolean;
}

const CATEGORY_ICONS: Record<EventCategory, string> = {
  military: '⚔',
  economy: '📉',
  trade: '🚢',
  health: '🏥',
  disaster: '🌋',
  political: '🏛',
};

const CATEGORY_COLORS: Record<EventCategory, string> = {
  military: '#ff3333',
  economy: '#ffaa00',
  trade: '#00cc33',
  health: '#00ff41',
  disaster: '#ff6b35',
  political: '#00aa2a',
};

const SEVERITY_SIZE: Record<string, number> = {
  critical: 28,
  high: 24,
  medium: 20,
  low: 16,
};

export default function GlobalEventLayer({ events, visible }: GlobalEventLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!visible) return;

    const markers: L.Marker[] = [];

    events.forEach(event => {
      if (!event.lat || !event.lng) return;

      const color = CATEGORY_COLORS[event.category];
      const icon = CATEGORY_ICONS[event.category];
      const size = SEVERITY_SIZE[event.severity] || 20;
      const isBreaking = event.is_breaking;

      const divIcon = L.divIcon({
        className: 'global-event-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
        html: `
          <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
            ${isBreaking ? `<div style="position:absolute;inset:-6px;border-radius:50%;border:1.5px solid ${color};opacity:0.6;animation:radar-pulse 2s ease-out infinite;"></div>` : ''}
            ${event.severity === 'critical' ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:1px solid ${color};opacity:0.3;animation:radar-pulse 2s ease-out 0.7s infinite;"></div>` : ''}
            <div style="
              width:${size}px;height:${size}px;
              border-radius:50%;
              background:${color}33;
              border:1.5px solid ${color};
              display:flex;align-items:center;justify-content:center;
              font-size:${size * 0.5}px;
              box-shadow:0 0 10px ${color}44;
              cursor:pointer;
            ">${icon}</div>
          </div>
        `,
      });

      const marker = L.marker([event.lat, event.lng], { icon: divIcon });

      const popupContent = `
        <div style="background:#000800;color:#00ff41;padding:10px 14px;border-radius:4px;min-width:220px;font-family:'Share Tech Mono',monospace;font-size:11px;border:1px solid rgba(0,255,65,0.3);box-shadow:0 0 20px rgba(0,255,65,0.1);">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="font-size:14px;">${icon}</span>
            <span style="color:${color};font-weight:bold;font-size:9px;letter-spacing:2px;text-shadow:0 0 6px ${color}88;">${event.category.toUpperCase()}</span>
            <span style="margin-left:auto;font-size:9px;color:#006617;text-transform:uppercase;">${event.severity}</span>
          </div>
          <div style="font-weight:600;margin-bottom:4px;text-shadow:0 0 4px rgba(0,255,65,0.3);">${event.title}</div>
          ${event.description ? `<div style="color:#00aa2a;font-size:10px;margin-bottom:4px;">${event.description}</div>` : ''}
          ${event.country ? `<div style="color:#006617;font-size:9px;">📍 ${event.country}</div>` : ''}
          ${event.source ? `<div style="color:#006617;font-size:9px;">SRC: ${event.source}</div>` : ''}
        </div>
      `;
      marker.bindPopup(popupContent, { className: 'osint-popup' });
      marker.addTo(map);
      markers.push(marker);
    });

    return () => {
      markers.forEach(m => map.removeLayer(m));
    };
  }, [map, events, visible]);

  return null;
}
