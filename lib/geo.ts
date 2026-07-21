import { query } from "@/lib/db";

interface WorkLocation {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  radius_meters: number;
}

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type GeofenceResult =
  | { ok: true; locationName: string | null }
  | { ok: false; nearestName: string | null; nearestDistance: number | null };

export async function checkGeofence(lat: number, lng: number): Promise<GeofenceResult> {
  const res = await query("SELECT * FROM hr_work_locations");
  const locations = res.rows as WorkLocation[];

  // No sites configured yet — don't block clock-in/out, just don't attribute a location.
  if (locations.length === 0) return { ok: true, locationName: null };

  let nearest: { name: string; distance: number } | null = null;
  for (const loc of locations) {
    const d = distanceMeters(lat, lng, parseFloat(loc.latitude), parseFloat(loc.longitude));
    if (d <= loc.radius_meters) return { ok: true, locationName: loc.name };
    if (!nearest || d < nearest.distance) nearest = { name: loc.name, distance: d };
  }

  return { ok: false, nearestName: nearest?.name ?? null, nearestDistance: nearest ? Math.round(nearest.distance) : null };
}
