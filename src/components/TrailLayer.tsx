import { useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { TrailHistory } from '@/hooks/useOSINTData';
import { EntityType } from '@/data/mockData';

interface TrailLayerProps {
  trails: TrailHistory;
  visible: boolean;
  entityTypes: Record<string, EntityType>;
}

const TRAIL_COLORS: Record<EntityType, string> = {
  aircraft: '#00cc80',
  ship: '#3b9be8',
  base: '#f59e0b',
  strategic: '#a855f7',
  alert: '#ef4444',
};

export default function TrailLayer({ trails, visible, entityTypes }: TrailLayerProps) {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    const group = layerGroupRef.current;
    group.clearLayers();

    if (!visible) return;

    Object.entries(trails).forEach(([entityId, points]) => {
      if (points.length < 2) return;

      const type = entityTypes[entityId] || 'aircraft';
      const color = TRAIL_COLORS[type];
      const coords = points.map(p => [p.lat, p.lng] as L.LatLngTuple);

      // Draw segments with fading opacity (older = more transparent)
      for (let i = 1; i < coords.length; i++) {
        const opacity = (i / coords.length) * 0.7;
        const weight = type === 'ship' ? 2 : 1.5;

        L.polyline([coords[i - 1], coords[i]], {
          color,
          weight,
          opacity,
          dashArray: type === 'ship' ? '6 4' : '3 3',
          className: 'trail-line',
        }).addTo(group);
      }

      // Glow dot at the trail origin (oldest point)
      if (points.length >= 3) {
        L.circleMarker([coords[0][0], coords[0][1]], {
          radius: 2,
          color,
          fillColor: color,
          fillOpacity: 0.2,
          weight: 0.5,
          opacity: 0.3,
        }).addTo(group);
      }
    });

    return () => {
      group.clearLayers();
    };
  }, [trails, visible, entityTypes, map]);

  useEffect(() => {
    return () => {
      if (layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
      }
    };
  }, [map]);

  return null;
}
