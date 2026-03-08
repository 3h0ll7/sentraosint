import { useState, useEffect, useRef, useCallback } from 'react';
import { MapEntity } from '@/data/mockData';

const EARTH_RADIUS_NM = 3440.065; // nautical miles
const ANIMATION_FPS = 20;
const FRAME_MS = 1000 / ANIMATION_FPS;

/**
 * Extrapolates entity position based on heading (degrees) and speed (knots).
 * Returns new lat/lng after `dtSeconds` seconds of travel.
 */
function extrapolatePosition(
  lat: number,
  lng: number,
  headingDeg: number | undefined,
  speedKnots: number | undefined,
  dtSeconds: number
): { lat: number; lng: number } {
  if (!headingDeg || !speedKnots || speedKnots <= 0 || dtSeconds <= 0) {
    return { lat, lng };
  }

  // Distance in nautical miles
  const distNm = (speedKnots / 3600) * dtSeconds;
  // Convert to radians
  const distRad = distNm / EARTH_RADIUS_NM;
  const hdgRad = (headingDeg * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(distRad) +
    Math.cos(latRad) * Math.sin(distRad) * Math.cos(hdgRad)
  );
  const newLngRad = lngRad + Math.atan2(
    Math.sin(hdgRad) * Math.sin(distRad) * Math.cos(latRad),
    Math.cos(distRad) - Math.sin(latRad) * Math.sin(newLatRad)
  );

  return {
    lat: (newLatRad * 180) / Math.PI,
    lng: (newLngRad * 180) / Math.PI,
  };
}

export interface InterpolatedEntity extends MapEntity {
  interpolatedLat: number;
  interpolatedLng: number;
}

/**
 * Takes raw entities from DB and smoothly interpolates aircraft/ship positions
 * between API updates using heading + velocity dead reckoning.
 */
export function useEntityInterpolation(entities: MapEntity[]): InterpolatedEntity[] {
  const [interpolated, setInterpolated] = useState<InterpolatedEntity[]>([]);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const baseEntitiesRef = useRef<MapEntity[]>([]);
  const rafRef = useRef<number | null>(null);

  // When new entities arrive from API, snapshot the base positions and reset timer
  useEffect(() => {
    baseEntitiesRef.current = entities;
    lastUpdateTimeRef.current = Date.now();
    // Immediately set interpolated to base positions (no lag on fresh data)
    setInterpolated(entities.map(e => ({
      ...e,
      interpolatedLat: e.lat,
      interpolatedLng: e.lng,
    })));
  }, [entities]);

  // Animation loop: extrapolate positions each frame
  useEffect(() => {
    let lastFrame = 0;

    const tick = (timestamp: number) => {
      if (timestamp - lastFrame < FRAME_MS) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastFrame = timestamp;

      const now = Date.now();
      const dtSeconds = (now - lastUpdateTimeRef.current) / 1000;
      const base = baseEntitiesRef.current;

      if (base.length === 0 || dtSeconds < 0.5) {
        // Don't interpolate within first 0.5s of an update
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Cap extrapolation to 90 seconds to prevent runaway positions
      const cappedDt = Math.min(dtSeconds, 90);

      const updated = base.map(e => {
        const isMovable = (e.type === 'aircraft' || e.type === 'ship') && e.speed && e.speed > 0;
        if (!isMovable) {
          return { ...e, interpolatedLat: e.lat, interpolatedLng: e.lng };
        }
        const { lat, lng } = extrapolatePosition(e.lat, e.lng, e.heading, e.speed, cappedDt);
        return { ...e, interpolatedLat: lat, interpolatedLng: lng };
      });

      setInterpolated(updated);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return interpolated;
}
