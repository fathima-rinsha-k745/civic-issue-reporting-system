import React from 'react';
import { Button } from 'react-bootstrap';
import { FaMapMarkerAlt, FaExternalLinkAlt, FaInfoCircle } from 'react-icons/fa';

const LocationDisplay = ({ location, latitude, longitude, inline = false }) => {
  const hasCoordinates =
    latitude !== null &&
    latitude !== undefined &&
    latitude !== '' &&
    longitude !== null &&
    longitude !== undefined &&
    longitude !== '' &&
    !isNaN(parseFloat(latitude)) &&
    !isNaN(parseFloat(longitude));

  const latNum = hasCoordinates ? parseFloat(latitude).toFixed(6) : null;
  const lonNum = hasCoordinates ? parseFloat(longitude).toFixed(6) : null;
  const osmUrl = hasCoordinates
    ? `https://www.openstreetmap.org/?mlat=${latNum}&mlon=${lonNum}#map=18/${latNum}/${lonNum}`
    : null;

  if (inline) {
    return (
      <div>
        <div className="text-dark fw-medium mb-1">{location || 'Not specified'}</div>
        {hasCoordinates ? (
          <div className="d-flex flex-wrap align-items-center gap-2 mt-1">
            <span className="font-monospace small bg-light border px-2 py-1 rounded text-dark">
              Lat: {latNum}, Lon: {lonNum}
            </span>
            <a
              href={osmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm py-0 px-2 d-inline-flex align-items-center"
              style={{ fontSize: '0.8rem', height: '26px' }}
            >
              <FaExternalLinkAlt className="me-1" style={{ fontSize: '0.7rem' }} /> View on Map
            </a>
          </div>
        ) : (
          <span className="text-muted small fst-italic d-inline-flex align-items-center mt-1">
            <FaInfoCircle className="me-1" /> Location coordinates not available.
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="location-display-block">
      <div className="d-flex align-items-start text-muted mb-2">
        <FaMapMarkerAlt className="mt-1 me-3 fs-5 text-danger flex-shrink-0" />
        <div className="flex-grow-1">
          <small className="d-block text-uppercase fw-bold text-muted">Location</small>
          <div className="text-dark fw-medium fs-6">{location || 'Not specified'}</div>

          {hasCoordinates ? (
            <div className="mt-2 p-2 bg-light rounded border">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div className="font-monospace small text-dark">
                  <span className="fw-semibold">Lat:</span> {latNum} &nbsp;|&nbsp;{' '}
                  <span className="fw-semibold">Lon:</span> {lonNum}
                </div>
                <a
                  href={osmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary btn-sm d-inline-flex align-items-center py-1 px-2"
                  style={{ fontSize: '0.8rem' }}
                >
                  <FaExternalLinkAlt className="me-1" /> View on Map
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-muted small d-flex align-items-center">
              <FaInfoCircle className="me-1 text-secondary" />
              <span>Location coordinates not available.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationDisplay;
