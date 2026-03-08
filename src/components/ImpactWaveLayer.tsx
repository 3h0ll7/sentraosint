import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { GlobalEvent } from '@/hooks/useGlobalEvents';

interface ImpactWaveLayerProps {
  events: GlobalEvent[];
  visible: boolean;
}

export default function ImpactWaveLayer({ events, visible }: ImpactWaveLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!visible) return;

    const circles: L.Circle[] = [];

    // Only show waves for critical/high severity events
    const impactEvents = events.filter(
      e => e.lat != null && e.lng != null && (e.severity === 'critical' || e.severity === 'high')
    );

    impactEvents.forEach(event => {
      const color = event.category === 'disaster' ? '#ff6b35' :
        event.category === 'military' ? '#ff3333' :
        event.category === 'health' ? '#00ff41' : '#ffaa00';

      const maxRadius = event.severity === 'critical' ? 300000 : 200000; // meters

      // Create multiple expanding rings
      [0.3, 0.6, 1.0].forEach((scale, idx) => {
        const circle = L.circle([event.lat!, event.lng!], {
          radius: maxRadius * scale,
          color: color,
          fillColor: color,
          fillOpacity: 0.05 * (1 - scale),
          weight: 1,
          opacity: 0.3 * (1 - scale * 0.5),
          dashArray: idx === 0 ? undefined : '4 4',
          className: `impact-wave impact-wave-${idx}`,
        });

        circle.addTo(map);
        circles.push(circle);
      });
    });

    return () => {
      circles.forEach(c => map.removeLayer(c));
    };
  }, [map, events, visible]);

  return null;
}
