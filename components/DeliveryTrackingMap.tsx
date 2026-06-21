import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Store, MapPin, Truck } from 'lucide-react';

// Custom colored marker icons
function createCustomIcon(color: string, label: string) {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background: ${color};
        width: 36px; height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        position: relative;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-size: 14px;
          font-weight: 900;
        ">${label}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

const storeIcon = createCustomIcon('#059669', '🏪');
const customerIcon = createCustomIcon('#3b82f6', '📍');
const volunteerIcon = createCustomIcon('#ef4444', '🚚');

interface DeliveryTrackingMapProps {
  storeLocation?: { lat: number; lng: number; name?: string } | null;
  customerLocation?: { lat: number; lng: number; name?: string } | null;
  volunteerLocation?: { lat: number; lng: number; name?: string } | null;
  status?: string;
  height?: number | string;
  className?: string;
}

export const DeliveryTrackingMap: React.FC<DeliveryTrackingMapProps> = ({
  storeLocation,
  customerLocation,
  volunteerLocation,
  status,
  height = 300,
  className = '',
}) => {
  // Calculate center and bounds
  const { center, zoom } = useMemo(() => {
    const points: [number, number][] = [];
    if (storeLocation) points.push([storeLocation.lat, storeLocation.lng]);
    if (customerLocation) points.push([customerLocation.lat, customerLocation.lng]);
    if (volunteerLocation) points.push([volunteerLocation.lat, volunteerLocation.lng]);

    if (points.length === 0) {
      return { center: [20.5937, 78.9629] as [number, number], zoom: 5 };
    }
    if (points.length === 1) {
      return { center: points[0], zoom: 15 };
    }

    const lats = points.map((p) => p[0]);
    const lngs = points.map((p) => p[1]);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const latDiff = Math.max(...lats) - Math.min(...lats);
    const lngDiff = Math.max(...lngs) - Math.min(...lngs);
    const maxDiff = Math.max(latDiff, lngDiff);
    let z = 15;
    if (maxDiff > 0.5) z = 10;
    else if (maxDiff > 0.1) z = 12;
    else if (maxDiff > 0.01) z = 14;

    return { center: [centerLat, centerLng] as [number, number], zoom: z };
  }, [storeLocation, customerLocation, volunteerLocation]);

  // Route line
  const routePositions = useMemo(() => {
    const positions: [number, number][] = [];
    if (storeLocation) positions.push([storeLocation.lat, storeLocation.lng]);
    if (volunteerLocation) positions.push([volunteerLocation.lat, volunteerLocation.lng]);
    if (customerLocation) positions.push([customerLocation.lat, customerLocation.lng]);
    return positions.length >= 2 ? positions : [];
  }, [storeLocation, customerLocation, volunteerLocation]);

  const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: '#94a3b8', label: 'Order Placed' },
    received: { color: '#8b5cf6', label: 'Received by Store' },
    packed: { color: '#f59e0b', label: 'Being Packed' },
    ready: { color: '#3b82f6', label: 'Ready for Pickup' },
    accepted: { color: '#06b6d4', label: 'Volunteer Assigned' },
    picked_up: { color: '#f97316', label: 'Out for Delivery' },
    completed: { color: '#10b981', label: 'Delivered' },
    cancelled: { color: '#ef4444', label: 'Cancelled' },
  };

  const currentStatus = statusConfig[status || 'pending'] || statusConfig.pending;

  const hasAnyLocation = storeLocation || customerLocation || volunteerLocation;

  if (!hasAnyLocation) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 ${className}`}
        style={{ height }}
      >
        <div className="text-center space-y-2">
          <MapPin size={32} className="text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
            Location data not available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative z-0 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm ${className}`}>
      {/* Status Badge */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-slate-200 dark:border-slate-700">
        <div
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ background: currentStatus.color }}
        />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
          {currentStatus.label}
        </span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-slate-200 dark:border-slate-700 space-y-1">
        {storeLocation && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
            <div className="w-3 h-3 rounded-full bg-emerald-500" /> Store
          </div>
        )}
        {customerLocation && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
            <div className="w-3 h-3 rounded-full bg-blue-500" /> Customer
          </div>
        )}
        {volunteerLocation && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
            <div className="w-3 h-3 rounded-full bg-red-500" /> Volunteer
          </div>
        )}
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route line */}
        {routePositions.length >= 2 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: '#059669',
              weight: 3,
              dashArray: '8, 12',
              opacity: 0.7,
            }}
          />
        )}

        {/* Store marker */}
        {storeLocation && (
          <Marker position={[storeLocation.lat, storeLocation.lng]} icon={storeIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-sm">{storeLocation.name || 'Store'}</p>
                <p className="text-xs text-slate-500">Pickup Point</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Customer marker */}
        {customerLocation && (
          <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-sm">{customerLocation.name || 'Delivery'}</p>
                <p className="text-xs text-slate-500">Delivery Address</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Volunteer marker */}
        {volunteerLocation && (
          <Marker position={[volunteerLocation.lat, volunteerLocation.lng]} icon={volunteerIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-sm">{volunteerLocation.name || 'Volunteer'}</p>
                <p className="text-xs text-slate-500">Current Position</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
