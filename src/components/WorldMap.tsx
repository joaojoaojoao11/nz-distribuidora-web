import { useEffect, useMemo, useRef, useState } from 'react';
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
  /** O mapa só responde a zoom e arrasto depois de um clique dentro dele. */
  const [ativo, setAtivo] = useState(false);

  /** As cidades com mais sessões, para a lista embaixo do mapa. */
  const MAX_CIDADES = 12;
  const ordenadas = useMemo(() => [...data].sort((a, b) => b.sessions - a.sessions), [data]);
  const cidades = ordenadas.slice(0, MAX_CIDADES);
  const restantes = Math.max(0, ordenadas.length - MAX_CIDADES);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // O mapa nasce INERTE: passar o mouse por cima não mexe em nada.
    //
    // Com a roda do mouse ligada, quem rolava a página e passava por cima do
    // mapa via o mapa engolir a rolagem e dar zoom — a página parava e o mapa
    // saía do lugar sozinho. Agora só o clique (ou o toque) liga o zoom e o
    // arrasto; sair com o cursor desliga de novo. As dicas de cidade continuam
    // aparecendo no hover, porque essas não atrapalham.
    const map = L.map(containerRef.current, {
      center: [-15, -50], // Brazil centered
      zoom: 3,
      minZoom: 2,
      maxZoom: 12,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    // Ladrilhos do OpenStreetMap, escurecidos por filtro CSS (ver `.leaflet-tile`
    // mais abaixo).
    //
    // Antes era o "Dark Matter" do CARTO, que era escuro de origem — mas o CARTO
    // passou a exigir chave e agora devolve o ladrilho com "API KEY REQUIRED"
    // carimbado por cima. O mapa aparecia, e aparecia quebrado.
    //
    // O OSM é livre e sem chave. O uso aqui é uma tela de admin com meia dúzia
    // de aberturas por dia, bem dentro da política de uso deles, e a atribuição
    // fica no canto como eles pedem.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Attribution small
    L.control.attribution({ position: 'bottomright', prefix: '' })
      .addAttribution('© <a href="https://www.openstreetmap.org/copyright" style="color:#888">OpenStreetMap</a>')
      .addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const ligar = () => setAtivo(true);
    const desligar = () => setAtivo(false);
    map.on('click', ligar);
    const el = containerRef.current;
    el.addEventListener('mouseleave', desligar);

    return () => {
      map.off('click', ligar);
      el.removeEventListener('mouseleave', desligar);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Liga e desliga o que mexe no mapa. Fora da criação porque depende do estado.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const nome of ['scrollWheelZoom', 'dragging', 'touchZoom', 'doubleClickZoom', 'boxZoom', 'keyboard'] as const) {
      const h = map[nome];
      if (ativo) h?.enable();
      else h?.disable();
    }
  }, [ativo]);

  // Update markers when data changes
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    if (data.length === 0) return;

    const maxSessions = Math.max(...data.map(d => d.sessions), 1);

    data.forEach(point => {
      const intensity = point.sessions / maxSessions;
      // Ponto pequeno de propósito: com 8–30px de raio, duas cidades vizinhas
      // viravam uma bolha só e não dava para saber de onde vinha o acesso.
      // 4–11px mantém a diferença de tamanho legível e separa cidade de cidade.
      const radius = 4 + intensity * 7;

      // Pulsing circle marker
      const marker = L.circleMarker([point.latitude, point.longitude], {
        radius,
        fillColor: '#D4A853',
        fillOpacity: 0.55 + intensity * 0.35,
        color: '#D4A853',
        weight: 1.5,
        opacity: 0.85,
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
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    } else if (data.length === 1) {
      mapRef.current.setView([data[0].latitude, data[0].longitude], 7);
    }
  }, [data]);

  return (
    <>
      <style>{`
        /* O OSM é um mapa claro; o painel é escuro. Inverter e girar a matiz
           devolve um mapa escuro com a água e a terra nas cores certas. O filtro
           vale SÓ para o painel de ladrilhos — marcadores, dicas e controles
           ficam de fora e mantêm o dourado da casa. */
        .nz-mapa .leaflet-tile-pane {
          filter: invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.86) saturate(0.55);
        }
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
      <div style={{ position: 'relative' }}>
        <div
          ref={containerRef}
          className="nz-mapa"
          style={{
            width: '100%',
            height: '420px',
            borderRadius: '0',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        />
        {/* Diz em que estado o mapa está. Sem isto, "não dá zoom" pareceria
            defeito em vez de escolha. */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '0.6rem',
            transform: 'translateX(-50%)',
            zIndex: 500,
            pointerEvents: 'none',
            padding: '0.3rem 0.7rem',
            background: 'rgba(10,10,12,0.82)',
            border: `1px solid ${ativo ? 'rgba(212,168,83,0.45)' : 'rgba(255,255,255,0.12)'}`,
            color: ativo ? '#D4A853' : '#888',
            fontFamily: 'monospace',
            fontSize: '11px',
            letterSpacing: '0.3px',
            whiteSpace: 'nowrap',
          }}
        >
          {ativo ? 'Mapa ativo — tire o cursor para liberar a rolagem' : 'Clique no mapa para mover e dar zoom'}
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '0.75rem',
          color: '#555',
          fontSize: '0.75rem',
          fontStyle: 'italic',
        }}>
          Os pontos de acesso aparecerão automaticamente conforme visitantes acessam o site
        </div>
      ) : (
        // As cidades por escrito: é o que responde "de onde estão acessando"
        // sem obrigar a caçar ponto no mapa.
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.75rem 0 0' }}>
          {cidades.map((c) => (
            <span
              key={`${c.country}_${c.city}`}
              title={c.country}
              style={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: '0.4rem',
                padding: '0.25rem 0.6rem',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
                fontSize: '0.72rem',
                color: '#bbb',
              }}
            >
              {c.city || c.country}
              <strong style={{ color: '#D4A853', fontVariantNumeric: 'tabular-nums' }}>{c.sessions}</strong>
            </span>
          ))}
          {restantes > 0 && (
            <span style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', color: '#666' }}>
              e mais {restantes}
            </span>
          )}
        </div>
      )}
    </>
  );
}
