import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapEntity, EntityType } from '@/data/mockData';
import { useEffect, useMemo } from 'react';

interface OSINTMapProps {
  entities: MapEntity[];
  visibleLayers: Record<EntityType, boolean>;
  onEntitySelect?: (entity: MapEntity) => void;
  selectedEntity?: MapEntity | null;
}

const ICON_COLORS: Record<EntityType, string> = {
  aircraft: '#00cc80',
  ship: '#3b9be8',
  base: '#f59e0b',
  strategic: '#a855f7',
  alert: '#ef4444',
};

const ICON_SYMBOLS: Record<EntityType, string> = {
  aircraft: '✈',
  ship: '⚓',
  base: '⬟',
  strategic: '◆',
  alert: '⚠',
};

function createIcon(entity: MapEntity): L.DivIcon {
  const color = ICON_COLORS[entity.type];
  const symbol = ICON_SYMBOLS[entity.type];
  const isMilitary = entity.classification === 'military';
  const isUnknown = entity.classification === 'unknown';
  const pulseColor = isUnknown ? '#ef4444' : color;
  const rotation = entity.heading || 0;
  const size = entity.type === 'base' || entity.type === 'strategic' ? 28 : 22;

  return L.divIcon({
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
        ${isUnknown || isMilitary ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:1px solid ${pulseColor};opacity:0.5;animation:radar-pulse 3s ease-out infinite;"></div>` : ''}
        <div style="
          width:${size}px;height:${size}px;
          border-radius:${entity.type === 'base' ? '4px' : '50%'};
          background:${color}22;
          border:1.5px solid ${color};
          display:flex;align-items:center;justify-content:center;
          font-size:${size * 0.5}px;
          transform:rotate(${entity.type === 'aircraft' ? rotation : 0}deg);
          box-shadow:0 0 8px ${color}66;
          cursor:pointer;
          transition:transform 0.3s ease;
        ">${symbol}</div>
      </div>
    `,
  });
}

function FlyToEntity({ entity }: { entity: MapEntity | null }) {
  const map = useMap();
  useEffect(() => {
    if (entity) {
      map.flyTo([entity.lat, entity.lng], 8, { duration: 1 });
    }
  }, [entity, map]);
  return null;
}

export default function OSINTMap({ entities, visibleLayers, onEntitySelect, selectedEntity }: OSINTMapProps) {
  const filteredEntities = useMemo(
    () => entities.filter(e => visibleLayers[e.type]),
    [entities, visibleLayers]
  );

  return (
    <MapContainer
      center={[25.5, 50.0]}
      zoom={5}
      className="w-full h-full"
      zoomControl={true}
      attributionControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
        attribution=""
      />
      <FlyToEntity entity={selectedEntity ?? null} />
      {filteredEntities.map(entity => (
        <Marker
          key={entity.id}
          position={[entity.lat, entity.lng]}
          icon={createIcon(entity)}
          eventHandlers={{
            click: () => onEntitySelect?.(entity),
          }}
        >
          <Popup className="osint-popup">
            <div style={{ background: '#111827', color: '#e5e7eb', padding: '8px 12px', borderRadius: '6px', minWidth: '220px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', border: `1px solid ${ICON_COLORS[entity.type]}44` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ color: ICON_COLORS[entity.type], fontSize: '14px' }}>{ICON_SYMBOLS[entity.type]}</span>
                <strong style={{ color: ICON_COLORS[entity.type] }}>{entity.name}</strong>
              </div>
              {entity.callsign && <div><span style={{ color: '#6b7280' }}>CALLSIGN:</span> {entity.callsign}</div>}
              <div><span style={{ color: '#6b7280' }}>CLASS:</span> <span style={{ color: entity.classification === 'military' ? '#f59e0b' : entity.classification === 'unknown' ? '#ef4444' : '#6b7280' }}>{entity.classification.toUpperCase()}</span></div>
              {entity.altitude && <div><span style={{ color: '#6b7280' }}>ALT:</span> {entity.altitude.toLocaleString()} ft</div>}
              {entity.speed && <div><span style={{ color: '#6b7280' }}>SPD:</span> {entity.speed} kts</div>}
              {entity.heading !== undefined && <div><span style={{ color: '#6b7280' }}>HDG:</span> {Math.round(entity.heading)}°</div>}
              <div style={{ marginTop: '4px', color: '#9ca3af', fontSize: '10px' }}>{entity.details}</div>
              <div style={{ marginTop: '4px', color: '#6b7280', fontSize: '9px' }}>SRC: {entity.source}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
