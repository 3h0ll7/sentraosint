import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapEntity, EntityType } from '@/data/mockData';
import { useEffect, useMemo, useState } from 'react';
import TrailLayer from '@/components/TrailLayer';
import LinkLayer from '@/components/LinkLayer';
import GlobalEventLayer from '@/components/GlobalEventLayer';
import { TrailHistory } from '@/hooks/useOSINTData';
import { getThreatColor, LinkConnection } from '@/data/threatEngine';
import MapStyleSelector, { MapStyle, getTileUrls } from '@/components/MapStyleSelector';
import { GlobalEvent } from '@/hooks/useGlobalEvents';

interface OSINTMapProps {
  entities: MapEntity[];
  visibleLayers: Record<EntityType, boolean>;
  onEntitySelect?: (entity: MapEntity) => void;
  selectedEntity?: MapEntity | null;
  trails: TrailHistory;
  showTrails: boolean;
  links: LinkConnection[];
  showLinks: boolean;
  globalEvents?: GlobalEvent[];
  showGlobalEvents?: boolean;
}

const ICON_SYMBOLS: Record<EntityType, string> = {
  aircraft: '✈',
  ship: '⚓',
  base: '⬟',
  strategic: '◆',
  alert: '⚠',
};

const ICON_COLORS_DEFAULT: Record<EntityType, string> = {
  aircraft: '#00ff41',
  ship: '#00cc33',
  base: '#ffaa00',
  strategic: '#00aa2a',
  alert: '#ff3333',
};

function createIcon(entity: MapEntity): L.DivIcon {
  const threatScore = entity.threatScore ?? 0;
  const hasThreat = (entity.type === 'aircraft' || entity.type === 'ship') && threatScore > 0;
  const color = hasThreat ? getThreatColor(threatScore) : ICON_COLORS_DEFAULT[entity.type];
  const symbol = ICON_SYMBOLS[entity.type];
  const isMilitary = entity.classification === 'military';
  const isUnknown = entity.classification === 'unknown';
  const rotation = entity.heading || 0;
  const size = entity.type === 'base' || entity.type === 'strategic' ? 28 : 22;

  const pulseRings = (isUnknown || isMilitary) ? `
    <div style="position:absolute;inset:-6px;border-radius:50%;border:1px solid ${color};opacity:0.6;animation:radar-pulse 2.5s ease-out infinite;"></div>
    <div style="position:absolute;inset:-4px;border-radius:50%;border:0.5px solid ${color};opacity:0.3;animation:radar-pulse 2.5s ease-out 0.8s infinite;"></div>
    ${threatScore >= 60 ? `<div style="position:absolute;inset:-8px;border-radius:50%;border:1px solid ${color};opacity:0.2;animation:radar-pulse 2.5s ease-out 1.6s infinite;"></div>` : ''}
  ` : '';

  const threatRing = hasThreat && threatScore >= 30 ? `
    <div style="position:absolute;inset:-2px;border-radius:50%;border:2px solid ${color};opacity:${Math.min(1, threatScore / 100)};"></div>
  ` : '';

  return L.divIcon({
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
        ${pulseRings}
        ${threatRing}
        <div style="
          width:${size}px;height:${size}px;
          border-radius:${entity.type === 'base' ? '4px' : '50%'};
          background:${color}22;
          border:1.5px solid ${color};
          display:flex;align-items:center;justify-content:center;
          font-size:${size * 0.5}px;
          transform:rotate(${entity.type === 'aircraft' ? rotation : 0}deg);
          box-shadow:0 0 12px ${color}55, 0 0 4px ${color}33;
          cursor:pointer;
          transition:all 0.3s ease;
        ">${symbol}</div>
      </div>
    `,
  });
}

function FlyToEntity({ entity }: { entity: MapEntity | null }) {
  const map = useMap();
  useEffect(() => {
    if (entity) {
      map.flyTo([entity.lat, entity.lng], 8, { duration: 1.2 });
    }
  }, [entity, map]);
  return null;
}

function MapTiles({ style }: { style: MapStyle }) {
  const urls = getTileUrls(style);
  return (
    <>
      <TileLayer key={`base-${style}`} url={urls.base} attribution='&copy; CARTO / Esri' />
      {urls.labels && <TileLayer key={`labels-${style}`} url={urls.labels} attribution="" />}
    </>
  );
}

export default function OSINTMap({
  entities, visibleLayers, onEntitySelect, selectedEntity,
  trails, showTrails, links, showLinks,
  globalEvents = [], showGlobalEvents = true,
}: OSINTMapProps) {
  const [mapStyle, setMapStyle] = useState<MapStyle>('dark');

  const filteredEntities = useMemo(
    () => entities.filter(e => visibleLayers[e.type]),
    [entities, visibleLayers]
  );

  const entityTypes = useMemo(() => {
    const map: Record<string, EntityType> = {};
    entities.forEach(e => { map[e.id] = e.type; });
    return map;
  }, [entities]);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[25.5, 50.0]}
        zoom={5}
        className="w-full h-full"
        zoomControl={true}
        attributionControl={true}
      >
        <MapTiles style={mapStyle} />
        <FlyToEntity entity={selectedEntity ?? null} />
        <TrailLayer trails={trails} visible={showTrails} entityTypes={entityTypes} />
        <LinkLayer links={links} visible={showLinks} />
        <GlobalEventLayer events={globalEvents} visible={showGlobalEvents} />
        {filteredEntities.map(entity => (
          <Marker
            key={entity.id}
            position={[entity.lat, entity.lng]}
            icon={createIcon(entity)}
            eventHandlers={{ click: () => onEntitySelect?.(entity) }}
          >
            <Popup className="osint-popup">
              <div style={{
                background: '#000800', color: '#00ff41', padding: '10px 14px', borderRadius: '4px',
                minWidth: '240px', fontFamily: "'Share Tech Mono', monospace", fontSize: '11px',
                border: `1px solid rgba(0,255,65,0.3)`,
                boxShadow: `0 0 20px rgba(0,255,65,0.1), inset 0 0 30px rgba(0,255,65,0.02)`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px' }}>{ICON_SYMBOLS[entity.type]}</span>
                  <strong style={{ color: '#00ff41', textShadow: '0 0 6px rgba(0,255,65,0.5)' }}>{entity.name}</strong>
                </div>
                {entity.callsign && <div><span style={{ color: '#006617' }}>CALLSIGN:</span> {entity.callsign}</div>}
                <div><span style={{ color: '#006617' }}>CLASS:</span> <span style={{ color: entity.classification === 'military' ? '#ffaa00' : entity.classification === 'unknown' ? '#ff3333' : '#006617' }}>{entity.classification.toUpperCase()}</span></div>
                {entity.altitude && <div><span style={{ color: '#006617' }}>ALT:</span> {entity.altitude.toLocaleString()} ft</div>}
                {entity.speed && <div><span style={{ color: '#006617' }}>SPD:</span> {entity.speed} kts</div>}
                {entity.heading !== undefined && <div><span style={{ color: '#006617' }}>HDG:</span> {Math.round(entity.heading)}°</div>}
                {entity.threatScore !== undefined && entity.threatScore > 0 && (
                  <div style={{ marginTop: '6px', padding: '4px 0', borderTop: '1px solid rgba(0,255,65,0.15)' }}>
                    <span style={{ color: '#006617' }}>THREAT:</span>{' '}
                    <span style={{ color: getThreatColor(entity.threatScore), fontWeight: 'bold' }}>{entity.threatScore}/100</span>
                  </div>
                )}
                <div style={{ marginTop: '4px', color: '#00aa2a', fontSize: '10px' }}>{entity.details}</div>
                <div style={{ marginTop: '4px', color: '#006617', fontSize: '9px' }}>SRC: {entity.source}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <MapStyleSelector currentStyle={mapStyle} onStyleChange={setMapStyle} />
    </div>
  );
}
