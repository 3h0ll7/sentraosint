import { useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LinkConnection } from '@/data/threatEngine';

interface LinkLayerProps {
  links: LinkConnection[];
  visible: boolean;
}

export default function LinkLayer({ links, visible }: LinkLayerProps) {
  const map = useMap();
  const groupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!groupRef.current) {
      groupRef.current = L.layerGroup().addTo(map);
    }
    const group = groupRef.current;
    group.clearLayers();

    if (!visible) return;

    links.forEach(link => {
      const color = link.reason === 'AERIAL REFUELING PROXIMITY' ? '#22c55e'
        : link.reason === 'NAVAL FORMATION' ? '#3b9be8'
        : link.reason === 'BASE PROXIMITY' ? '#f59e0b'
        : link.reason === 'CROSS-DOMAIN ACTIVITY' ? '#a855f7'
        : '#ef4444';

      L.polyline(
        [[link.from.lat, link.from.lng], [link.to.lat, link.to.lng]],
        {
          color,
          weight: 1,
          opacity: 0.4,
          dashArray: '8 6',
          className: 'link-line',
        }
      ).addTo(group);

      // Midpoint label
      const midLat = (link.from.lat + link.to.lat) / 2;
      const midLng = (link.from.lng + link.to.lng) / 2;
      const label = L.divIcon({
        className: 'link-label',
        iconSize: [100, 16],
        iconAnchor: [50, 8],
        html: `<div style="font-family:'JetBrains Mono',monospace;font-size:8px;color:${color};text-align:center;opacity:0.6;white-space:nowrap;text-shadow:0 0 4px ${color}44;">${Math.round(link.distance)}km</div>`,
      });
      L.marker([midLat, midLng], { icon: label, interactive: false }).addTo(group);
    });

    return () => { group.clearLayers(); };
  }, [links, visible, map]);

  useEffect(() => {
    return () => {
      if (groupRef.current) map.removeLayer(groupRef.current);
    };
  }, [map]);

  return null;
}
