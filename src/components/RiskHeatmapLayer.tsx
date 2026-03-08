import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { RiskPoint } from '@/data/riskEngine';

interface RiskHeatmapLayerProps {
  riskPoints: RiskPoint[];
  visible: boolean;
}

// Extend L to include heatLayer
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: Record<string, unknown>
  ): L.Layer;
}

export default function RiskHeatmapLayer({ riskPoints, visible }: RiskHeatmapLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    // Remove existing layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!visible || riskPoints.length === 0) return;

    const heatData: [number, number, number][] = riskPoints.map(p => [
      p.lat,
      p.lng,
      p.intensity,
    ]);

    const heat = L.heatLayer(heatData, {
      radius: 35,
      blur: 25,
      maxZoom: 10,
      max: 1.0,
      minOpacity: 0.3,
      gradient: {
        0.0: '#0044cc',
        0.2: '#0066ff',
        0.35: '#00cc33',
        0.5: '#ffcc00',
        0.7: '#ff6600',
        0.85: '#ff3300',
        1.0: '#ff0000',
      },
    });

    heat.addTo(map);
    layerRef.current = heat;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, riskPoints, visible]);

  return null;
}
