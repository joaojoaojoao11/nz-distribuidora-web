import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GeoPoint {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  sessions: number;
}

interface WorldMapProps {
  data: GeoPoint[];
}

export default function WorldMap({ data }: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-15, -50], // Brazil centered
      zoom: 3,
      minZoom: 2,
      maxZoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark theme tiles (CartoDB Dark Matter - free, no API key)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Attribution small
    L.control.attribution({ position: 'bottomright', prefix: '' })
      .addAttribution('© <a href="https://carto.com/" style="color:#888">CARTO</a> © <a href="https://osm.org/" style="color:#888">OSM</a>')
      .addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    if (data.length === 0) return;

    const maxSessions = Math.max(...data.map(d => d.sessions), 1);

    data.forEach(point => {
      const intensity = point.sessions / maxSessions;
      const radius = 8 + intensity * 22;

      // Pulsing circle marker
      const marker = L.circleMarker([point.latitude, point.longitude], {
        radius,
        fillColor: '#D4A853',
        fillOpacity: 0.4 + intensity * 0.4,
        color: '#D4A853',
        weight: 2,
        opacity: 0.7,
      });

      // Custom popup
      marker.bindPopup(`
        <div style="
          background: #0a0a0c;
          color: #fff;
          padding: 12px 16px;
          border: 1px solid rgba(212,168,83,0.3);
          font-family: monospace;
          font-size: 12px;
          min-width: 150px;
        ">
          <div style="color: #D4A853; font-weight: bold; font-size: 13px; margin-bottom: 6px;">
            📍 ${point.city || 'Desconhecido'}
          </div>
          <div style="color: #ccc; margin-bottom: 4px;">
            ${point.country}
          </div>
          <div style="
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid rgba(255,255,255,0.1);
            color: #D4A853;
            font-size: 16px;
            font-weight: bold;
          ">
            ${point.sessions} ${point.sessions === 1 ? 'sessão' : 'sessões'}
          </div>
        </div>
      `, {
        className: 'nz-popup',
        closeButton: false,
      });

      marker.bindTooltip(`${point.city || point.country} (${point.sessions})`, {
        permanent: false,
        direction: 'top',
        offset: [0, -radius],
        className: 'nz-tooltip',
      });

      markersRef.current!.addLayer(marker);
    });

    // Fit bounds to all markers if multiple
    if (data.length > 1) {
      const bounds = L.latLngBounds(data.map(d => [d.latitude, d.longitude]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
    } else if (data.length === 1) {
      mapRef.current.setView([data[0].latitude, data[0].longitude], 5);
    }
  }, [data]);

  return (
    <>
      <style>{`
        .nz-popup .leaflet-popup-content-wrapper {
          background: transparent;
          border-radius: 0;
          box-shadow: none;
          padding: 0;
        }
        .nz-popup .leaflet-popup-content {
          margin: 0;
        }
        .nz-popup .leaflet-popup-tip {
          background: #0a0a0c;
          border: 1px solid rgba(212,168,83,0.3);
          box-shadow: none;
        }
        .nz-tooltip {
          background: rgba(10,10,12,0.9) !important;
          border: 1px solid rgba(212,168,83,0.3) !important;
          color: #D4A853 !important;
          font-family: monospace !important;
          font-size: 11px !important;
          border-radius: 0 !important;
          padding: 4px 8px !important;
          box-shadow: none !important;
        }
        .nz-tooltip::before {
          border-top-color: rgba(212,168,83,0.3) !important;
        }
        .leaflet-control-zoom a {
          background: rgba(15,15,18,0.9) !important;
          color: #D4A853 !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(30,30,35,0.95) !important;
        }
      `}</style>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '420px',
          borderRadius: '0',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      />
      {data.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '0.75rem',
          color: '#555',
          fontSize: '0.75rem',
          fontStyle: 'italic',
        }}>
          Os pontos de acesso aparecerão automaticamente conforme visitantes acessam o site
        </div>
      )}
    </>
  );
}
