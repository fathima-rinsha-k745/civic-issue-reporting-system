import React, { useState, useEffect, useRef } from 'react';
import { Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaMapMarkerAlt, FaCrosshairs, FaSearch, FaCheckCircle, FaInfoCircle, FaTimes, FaListUl } from 'react-icons/fa';

// Import marker images directly to avoid 404 in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Configure default Leaflet icon properly
const defaultMarkerIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

// Default center in Kerala, India (Kochi / Central Kerala)
const DEFAULT_KERALA_CENTER = { lat: 9.931233, lng: 76.267304 };
const DEFAULT_ZOOM = 12;

// Sub-component to manage map instance, flyTo, and auto-invalidation
const MapController = ({ onMapInstance, flyTarget }) => {
  const map = useMap();

  useEffect(() => {
    if (onMapInstance) {
      onMapInstance(map);
    }
  }, [map, onMapInstance]);

  useEffect(() => {
    if (flyTarget && flyTarget.lat && flyTarget.lng) {
      map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom || 17, { duration: 1.2 });
    }
  }, [flyTarget, map]);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
};

// Sub-component to handle click-to-place and marker dragging
const LocationMarker = ({ position, onPositionChange }) => {
  const markerRef = useRef(null);

  useMapEvents({
    click(e) {
      const newPos = {
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6)),
      };
      onPositionChange(newPos);
    },
  });

  return position ? (
    <Marker
      position={[position.lat, position.lng]}
      icon={defaultMarkerIcon}
      draggable={true}
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            const latlng = marker.getLatLng();
            const newPos = {
              lat: Number(latlng.lat.toFixed(6)),
              lng: Number(latlng.lng.toFixed(6)),
            };
            onPositionChange(newPos);
          }
        },
      }}
    />
  ) : null;
};

const LocationPicker = ({
  latitude,
  longitude,
  onLocationSelect,
}) => {
  const [position, setPosition] = useState(
    latitude && longitude ? { lat: Number(latitude), lng: Number(longitude) } : null
  );
  const [flyTarget, setFlyTarget] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchFeedback, setSearchFeedback] = useState({ type: '', text: '' });
  const [isConfirmed, setIsConfirmed] = useState(Boolean(latitude && longitude));

  const mapInstanceRef = useRef(null);

  // Sync external props if they change
  useEffect(() => {
    if (latitude && longitude) {
      const newPos = { lat: Number(latitude), lng: Number(longitude) };
      setPosition(newPos);
      setIsConfirmed(true);
    }
  }, [latitude, longitude]);

  // Invalidate map size whenever map container expands
  useEffect(() => {
    if (isMapExpanded && mapInstanceRef.current) {
      const timer = setTimeout(() => {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch (_e) {}
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isMapExpanded]);

  const handlePositionChange = (newPos, suggestedAddress = null) => {
    setPosition(newPos);
    setIsConfirmed(true);
    onLocationSelect({
      latitude: newPos.lat,
      longitude: newPos.lng,
      address: suggestedAddress,
    });
  };

  const handleSelectSearchResult = (result) => {
    if (!result || !result.lat || !result.lon) return;

    const lat = Number(parseFloat(result.lat).toFixed(6));
    const lon = Number(parseFloat(result.lon).toFixed(6));

    if (isNaN(lat) || isNaN(lon)) return;

    const newPos = { lat, lng: lon };
    setPosition(newPos);
    setIsConfirmed(true);

    // Zoom and recenter map to selected result
    setFlyTarget({ lat, lng: lon, zoom: 17, timestamp: Date.now() });
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.flyTo([lat, lon], 17, { duration: 1.2 });
      } catch (_e) {}
    }

    // Update form location with display_name and coordinates
    onLocationSelect({
      latitude: lat,
      longitude: lon,
      address: result.display_name,
    });

    setSearchResults([]);
    setSearchFeedback({
      type: 'success',
      text: `Selected: ${result.display_name.split(',').slice(0, 3).join(', ')}`,
    });
  };

  const handleSearchSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const query = searchQuery.trim();
    if (!query) return;

    setSearchFeedback({ type: '', text: '' });
    setSearchResults([]);
    setSearching(true);

    try {
      // Explicit search using Nominatim endpoint with countrycodes=in and limit=5
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        query
      )}&countrycodes=in&limit=5`;

      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data && Array.isArray(data) && data.length > 0) {
        if (data.length === 1) {
          // Exactly 1 match found: immediately select it and zoom
          handleSelectSearchResult(data[0]);
        } else {
          // Multiple matches found: display results list for citizen selection
          setSearchResults(data);
          setSearchFeedback({
            type: 'info',
            text: `Found ${data.length} locations matching "${query}". Please select the exact place:`,
          });
        }
      } else {
        setSearchResults([]);
        setSearchFeedback({
          type: 'warning',
          text: `No places found matching "${query}". Please check the spelling or click directly on the map to pin the location.`,
        });
      }
    } catch (_err) {
      setSearchResults([]);
      setSearchFeedback({
        type: 'danger',
        text: 'Address search request failed. Please check your internet connection or click directly on the map.',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleGetCurrentLocation = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Browser Geolocation is not supported by your current browser.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const newPos = { lat, lng };

        setPosition(newPos);
        setIsConfirmed(true);

        setFlyTarget({ lat, lng, zoom: 17, timestamp: Date.now() });
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
          } catch (_e) {}
        }

        handlePositionChange(newPos);
      },
      (err) => {
        setGeoLoading(false);
        let message = 'Unable to access your location.';
        if (err.code === 1) {
          message =
            'Location permission denied. You can still select the issue location manually by clicking on the map or dragging the pin.';
        } else if (err.code === 2) {
          message = 'Location information is unavailable. Please click on the map to place the pin manually.';
        } else if (err.code === 3) {
          message = 'Location request timed out. Please select your location manually on the map.';
        }
        setGeoError(message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirmLocation = () => {
    if (position) {
      setIsConfirmed(true);
      onLocationSelect({
        latitude: position.lat,
        longitude: position.lng,
      });
    }
  };

  const handleResetLocation = () => {
    setPosition(null);
    setIsConfirmed(false);
    setSearchResults([]);
    setSearchFeedback({ type: '', text: '' });
    setGeoError('');
    onLocationSelect({
      latitude: null,
      longitude: null,
    });
  };

  return (
    <div className="location-picker-card border rounded p-3 mb-4 bg-white shadow-sm">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h6 className="fw-bold mb-1 d-flex align-items-center text-dark">
            <FaMapMarkerAlt className="text-danger me-2" />
            Select Issue Location on Map
          </h6>
          <small className="text-muted">
            Pin the exact spot of the issue. You can search places, click on the map, drag the marker, or use your current location.
          </small>
        </div>
        <div className="d-flex gap-2">
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            onClick={() => setIsMapExpanded((prev) => !prev)}
            aria-expanded={isMapExpanded}
          >
            {isMapExpanded ? 'Hide Map' : 'Choose Location on Map'}
          </Button>
          {position && (
            <Button
              type="button"
              variant="outline-danger"
              size="sm"
              onClick={handleResetLocation}
              title="Clear selected coordinates"
            >
              <FaTimes className="me-1" /> Clear Pin
            </Button>
          )}
        </div>
      </div>

      {/* Geolocation & Search toolbar */}
      {isMapExpanded && (
        <div className="mb-3">
          <div className="row g-2 align-items-center mb-2">
            <div className="col-12 col-md-auto">
              <Button
                type="button"
                variant="outline-primary"
                size="sm"
                className="w-100 d-inline-flex align-items-center justify-content-center"
                onClick={handleGetCurrentLocation}
                disabled={geoLoading}
              >
                {geoLoading ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" />
                    Detecting location...
                  </>
                ) : (
                  <>
                    <FaCrosshairs className="me-2 text-primary" />
                    Use My Current Location
                  </>
                )}
              </Button>
            </div>

            {/* Address Search Field - NOT wrapped in form tag to prevent parent form submission */}
            <div className="col-12 col-md">
              <div className="input-group input-group-sm">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search place in Kerala (e.g., MG Road Kochi, Kakkanad)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSearchSubmit(e);
                    }
                  }}
                  disabled={searching}
                />
                <Button
                  type="button"
                  variant="outline-secondary"
                  disabled={searching || !searchQuery.trim()}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSearchSubmit(e);
                  }}
                >
                  {searching ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-1" /> Searching...
                    </>
                  ) : (
                    <>
                      <FaSearch className="me-1" /> Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Feedback & Alerts */}
          {geoError && (
            <Alert
              variant="warning"
              dismissible
              onClose={() => setGeoError('')}
              className="py-2 px-3 mb-2 small"
            >
              <FaInfoCircle className="me-1" />
              {geoError}
            </Alert>
          )}

          {searchFeedback.text && (
            <Alert
              variant={searchFeedback.type}
              dismissible
              onClose={() => setSearchFeedback({ type: '', text: '' })}
              className="py-2 px-3 mb-2 small"
            >
              <FaInfoCircle className="me-1" />
              {searchFeedback.text}
            </Alert>
          )}

          {/* Multiple Search Results List */}
          {searchResults.length > 0 && (
            <div className="border rounded bg-light p-2 mb-3 shadow-sm">
              <div className="d-flex align-items-center justify-content-between mb-2 px-1">
                <small className="fw-bold text-dark d-flex align-items-center">
                  <FaListUl className="me-1 text-primary" /> Matching Places ({searchResults.length}):
                </small>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                  onClick={() => setSearchResults([])}
                  style={{ fontSize: '0.75rem' }}
                >
                  Dismiss
                </button>
              </div>
              <div className="list-group list-group-flush border rounded bg-white overflow-auto" style={{ maxHeight: '200px' }}>
                {searchResults.map((item, index) => {
                  const placeTitle = item.display_name.split(',')[0] || item.name || 'Location Match';
                  return (
                    <button
                      key={item.place_id || index}
                      type="button"
                      className="list-group-item list-group-item-action py-2 px-3 text-start d-flex justify-content-between align-items-center"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectSearchResult(item);
                      }}
                    >
                      <div className="me-2 overflow-hidden">
                        <div className="fw-semibold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>
                          <FaMapMarkerAlt className="text-danger me-1" />
                          {placeTitle}
                        </div>
                        <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                          {item.display_name}
                        </div>
                      </div>
                      <span className="badge bg-primary rounded-pill px-2 py-1 flex-shrink-0" style={{ fontSize: '0.75rem' }}>
                        Select
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Leaflet Map Container */}
      {isMapExpanded && (
        <div
          className="map-wrapper position-relative rounded overflow-hidden border mb-3"
          style={{ height: '340px', width: '100%', zIndex: 1 }}
        >
          <MapContainer
            center={position ? [position.lat, position.lng] : [DEFAULT_KERALA_CENTER.lat, DEFAULT_KERALA_CENTER.lng]}
            zoom={position ? 16 : DEFAULT_ZOOM}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController
              onMapInstance={(map) => {
                mapInstanceRef.current = map;
              }}
              flyTarget={flyTarget}
            />
            <LocationMarker position={position} onPositionChange={handlePositionChange} />
          </MapContainer>

          <div
            className="position-absolute bottom-0 start-0 bg-dark bg-opacity-75 text-white px-2 py-1 small rounded-top-end"
            style={{ zIndex: 1000, fontSize: '0.75rem' }}
          >
            {position
              ? '💡 Drag the marker or click anywhere on the map to adjust coordinates'
              : '👆 Click anywhere on the map or search a location above to place the pin'}
          </div>
        </div>
      )}

      {/* Selected Coordinates Status & Action */}
      <div className="bg-light p-3 rounded border">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <span className="text-muted small d-block text-uppercase fw-semibold">
              Selected Geographic Coordinates
            </span>
            {position && position.lat && position.lng ? (
              <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
                <span className="font-monospace text-dark fw-bold">
                  Lat: {position.lat.toFixed(6)}
                </span>
                <span className="text-muted">|</span>
                <span className="font-monospace text-dark fw-bold">
                  Lon: {position.lng.toFixed(6)}
                </span>
                {isConfirmed ? (
                  <Badge bg="success" className="d-inline-flex align-items-center ms-1">
                    <FaCheckCircle className="me-1" /> Location Confirmed
                  </Badge>
                ) : (
                  <Badge bg="info" className="text-dark ms-1">
                    Ready to Confirm
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-muted fst-italic small">
                No map coordinates selected yet. Click on the map, use search, or choose current location.
              </span>
            )}
          </div>

          <div className="d-flex gap-2">
            {position && !isConfirmed && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmLocation}
                className="d-inline-flex align-items-center"
              >
                <FaCheckCircle className="me-1" /> Confirm Location
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
