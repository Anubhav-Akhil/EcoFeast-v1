import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { ModalShell, ModalHeader, primaryButtonClassName, secondaryButtonClassName } from './ui';
import { MapPin, Search, Navigation, Loader2, Check } from 'lucide-react';
import { api } from '../services/api';

// Fix Leaflet default marker icon issue with bundlers
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface AddressMapModalProps {
  open: boolean;
  onAddressSaved: (user: any) => void;
  onClose?: () => void;
  mandatory?: boolean;
  initialLocation?: { lat: number; lng: number; address?: string } | null;
}

// Component to handle map clicks
const MapClickHandler: React.FC<{
  onLocationSelect: (lat: number, lng: number) => void;
}> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to fly to a position
const FlyToPosition: React.FC<{ position: [number, number] | null; }> = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
};

export const AddressMapModal: React.FC<AddressMapModalProps> = ({
  open, onAddressSaved, onClose, mandatory = false, initialLocation,
}) => {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : null
  );
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  // Default center (India)
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const defaultZoom = 5;

  useEffect(() => {
    if (open) {
      setSaved(false);
      setError(null);
      if (initialLocation) {
        setPosition([initialLocation.lat, initialLocation.lng]);
        setAddress(initialLocation.address || '');
      }
    }
  }, [open, initialLocation]);

  // Reverse geocode: lat/lng → address
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setGeocoding(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { 
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.display_name) {
        setAddress(data.display_name);
      }
    } catch (err) {
      console.warn("Reverse geocoding timed out or failed:", err);
      // Silently fail — user can still type address manually
    } finally {
      clearTimeout(timeoutId);
      setGeocoding(false);
    }
  }, []);

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng]);
    setFlyTarget([lat, lng]);
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  // Search location by text
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=in`,
        { 
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);
      const results = await res.json();
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const newPos: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setPosition(newPos);
        setFlyTarget(newPos);
        setAddress(display_name);
      } else {
        setError('Location not found. Try a different search.');
      }
    } catch (err) {
      console.warn("Geocoding search timed out or failed:", err);
      setError('Search timed out or failed. Please try again or click directly on the map.');
    } finally {
      clearTimeout(timeoutId);
      setSearching(false);
    }
  };

  // Use browser geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        setFlyTarget([latitude, longitude]);
        reverseGeocode(latitude, longitude);
        setLocating(false);
      },
      (err) => {
        setError('Could not get your location. Please allow location access or search manually.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Save address
  const handleSave = async () => {
    if (!address.trim()) {
      setError('Please enter or select an address.');
      return;
    }
    if (!position) {
      setError('Please pin your location on the map to set your coordinates.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const lat = position[0];
      const lng = position[1];
      const updatedUser = await api.saveAddress(address.trim(), lat, lng);
      setSaved(true);
      setTimeout(() => onAddressSaved(updatedUser), 600);
    } catch (err: any) {
      setError(err?.message || 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose || (() => {})}
      showCloseButton={!mandatory}
      closeOnBackdropClick={!mandatory}
      maxWidthClassName="max-w-3xl"
      panelClassName="max-h-[95vh]"
      contentClassName="max-h-[95vh] overflow-y-auto p-0"
    >
      <div className="p-6 space-y-5">
        <ModalHeader
          title={mandatory ? 'Set Your Address' : 'Update Address'}
          description={mandatory
            ? 'Pin your location on the map for accurate deliveries and pickups.'
            : 'Update your delivery address by clicking on the map or searching.'}
          icon={<MapPin size={22} />}
          tone="info"
          eyebrow={mandatory ? 'Required' : 'Address'}
          align="center"
        />

        {saved ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="mx-auto w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
            >
              <Check size={40} className="text-emerald-500" />
            </motion.div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Address Saved!</h3>
            <p className="text-sm text-slate-500">Redirecting to your dashboard...</p>
          </motion.div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Search
              </button>
              <button
                onClick={handleUseMyLocation}
                disabled={locating}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {locating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                <span className="hidden sm:inline">My Location</span>
              </button>
            </div>

            {/* Map */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm" style={{ height: 350 }}>
              <MapContainer
                center={position || defaultCenter}
                zoom={position ? 16 : defaultZoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onLocationSelect={handleLocationSelect} />
                <FlyToPosition position={flyTarget} />
                {position && (
                  <Marker position={position} />
                )}
              </MapContainer>
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
              Click on the map to pin your exact location, or use the search bar.
            </p>

            {/* Address Input */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">
                Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Your full address will appear here..."
                rows={2}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all resize-none"
              />
            </div>

            {/* Coordinates display */}
            {position && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <MapPin size={12} className="text-emerald-500" />
                <span>
                  {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 px-4 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300"
              >
                {error}
              </motion.div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleSave}
                disabled={saving || geocoding || !address.trim()}
                className={`${primaryButtonClassName} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {saving || geocoding ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {geocoding ? 'Resolving location...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    {mandatory ? 'Confirm Address' : 'Update Address'}
                  </>
                )}
              </button>
              {mandatory ? (
                onClose && (
                  <button onClick={onClose} className={secondaryButtonClassName}>
                    Cancel and Sign Out
                  </button>
                )
              ) : (
                onClose && (
                  <button onClick={onClose} className={secondaryButtonClassName}>
                    Cancel
                  </button>
                )
              )}
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
};
