import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface BrazilMapProps {
  activeState: string | null;
  onStateClick: (uf: string) => void;
}

// NZ logo icon for markers
const nzIcon = L.icon({
  iconUrl: '/assets/logos/logo-simbolo-branco.svg',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

const nzIconSmall = L.icon({
  iconUrl: '/assets/logos/logo-simbolo-branco.svg',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
});

// 27 Capitals
const CAPITALS: { uf: string; name: string; lat: number; lng: number }[] = [
  { uf: 'AC', name: 'Rio Branco', lat: -9.975, lng: -67.81 },
  { uf: 'AL', name: 'Maceió', lat: -9.666, lng: -35.735 },
  { uf: 'AP', name: 'Macapá', lat: 0.034, lng: -51.066 },
  { uf: 'AM', name: 'Manaus', lat: -3.119, lng: -60.021 },
  { uf: 'BA', name: 'Salvador', lat: -12.971, lng: -38.511 },
  { uf: 'CE', name: 'Fortaleza', lat: -3.717, lng: -38.543 },
  { uf: 'DF', name: 'Brasília', lat: -15.794, lng: -47.882 },
  { uf: 'ES', name: 'Vitória', lat: -20.319, lng: -40.338 },
  { uf: 'GO', name: 'Goiânia', lat: -16.686, lng: -49.264 },
  { uf: 'MA', name: 'São Luís', lat: -2.530, lng: -44.282 },
  { uf: 'MT', name: 'Cuiabá', lat: -15.601, lng: -56.097 },
  { uf: 'MS', name: 'Campo Grande', lat: -20.443, lng: -54.646 },
  { uf: 'MG', name: 'Belo Horizonte', lat: -19.919, lng: -43.938 },
  { uf: 'PA', name: 'Belém', lat: -1.455, lng: -48.502 },
  { uf: 'PB', name: 'João Pessoa', lat: -7.115, lng: -34.863 },
  { uf: 'PR', name: 'Curitiba', lat: -25.429, lng: -49.271 },
  { uf: 'PE', name: 'Recife', lat: -8.054, lng: -34.871 },
  { uf: 'PI', name: 'Teresina', lat: -5.089, lng: -42.802 },
  { uf: 'RJ', name: 'Rio de Janeiro', lat: -22.907, lng: -43.172 },
  { uf: 'RN', name: 'Natal', lat: -5.795, lng: -35.209 },
  { uf: 'RS', name: 'Porto Alegre', lat: -30.027, lng: -51.228 },
  { uf: 'RO', name: 'Porto Velho', lat: -8.762, lng: -63.903 },
  { uf: 'RR', name: 'Boa Vista', lat: 2.820, lng: -60.673 },
  { uf: 'SC', name: 'Florianópolis', lat: -27.597, lng: -48.549 },
  { uf: 'SP', name: 'São Paulo', lat: -23.550, lng: -46.633 },
  { uf: 'SE', name: 'Aracaju', lat: -10.911, lng: -37.072 },
  { uf: 'TO', name: 'Palmas', lat: -10.184, lng: -48.333 },
];

// +300 spread cities across Brazil
const CITIES: { name: string; lat: number; lng: number }[] = [
  // SP interior
  { name: 'Campinas', lat: -22.905, lng: -47.061 },
  { name: 'Ribeirão Preto', lat: -21.177, lng: -47.810 },
  { name: 'São José dos Campos', lat: -23.179, lng: -45.887 },
  { name: 'Sorocaba', lat: -23.501, lng: -47.458 },
  { name: 'Santos', lat: -23.960, lng: -46.333 },
  { name: 'Piracicaba', lat: -22.725, lng: -47.649 },
  { name: 'Bauru', lat: -22.314, lng: -49.060 },
  { name: 'São José do Rio Preto', lat: -20.820, lng: -49.379 },
  { name: 'Jundiaí', lat: -23.186, lng: -46.884 },
  { name: 'Marília', lat: -22.214, lng: -49.946 },
  { name: 'Presidente Prudente', lat: -22.120, lng: -51.388 },
  { name: 'Araraquara', lat: -21.794, lng: -48.176 },
  // RJ
  { name: 'Niterói', lat: -22.883, lng: -43.103 },
  { name: 'Petrópolis', lat: -22.505, lng: -43.178 },
  { name: 'Volta Redonda', lat: -22.523, lng: -44.104 },
  { name: 'Campos dos Goytacazes', lat: -21.764, lng: -41.329 },
  // MG
  { name: 'Uberlândia', lat: -18.919, lng: -48.277 },
  { name: 'Juiz de Fora', lat: -21.764, lng: -43.349 },
  { name: 'Uberaba', lat: -19.748, lng: -47.931 },
  { name: 'Montes Claros', lat: -16.735, lng: -43.861 },
  { name: 'Poços de Caldas', lat: -21.788, lng: -46.562 },
  { name: 'Governador Valadares', lat: -18.851, lng: -41.949 },
  // PR
  { name: 'Londrina', lat: -23.304, lng: -51.169 },
  { name: 'Maringá', lat: -23.421, lng: -51.933 },
  { name: 'Foz do Iguaçu', lat: -25.516, lng: -54.585 },
  { name: 'Cascavel', lat: -24.957, lng: -53.459 },
  { name: 'Ponta Grossa', lat: -25.094, lng: -50.162 },
  // SC
  { name: 'Joinville', lat: -26.303, lng: -48.845 },
  { name: 'Blumenau', lat: -26.919, lng: -49.066 },
  { name: 'Balneário Camboriú', lat: -26.990, lng: -48.635 },
  { name: 'Chapecó', lat: -27.100, lng: -52.615 },
  // RS
  { name: 'Caxias do Sul', lat: -29.168, lng: -51.179 },
  { name: 'Pelotas', lat: -31.770, lng: -52.342 },
  { name: 'Canoas', lat: -29.917, lng: -51.174 },
  { name: 'Santa Maria', lat: -29.684, lng: -53.806 },
  { name: 'Gramado', lat: -29.379, lng: -50.876 },
  // BA
  { name: 'Feira de Santana', lat: -12.267, lng: -38.966 },
  { name: 'Ilhéus', lat: -14.789, lng: -39.046 },
  { name: 'Vitória da Conquista', lat: -14.866, lng: -40.844 },
  { name: 'Camaçari', lat: -12.696, lng: -38.323 },
  // CE
  { name: 'Juazeiro do Norte', lat: -7.213, lng: -39.315 },
  { name: 'Sobral', lat: -3.689, lng: -40.348 },
  // PE
  { name: 'Caruaru', lat: -8.283, lng: -35.976 },
  { name: 'Olinda', lat: -7.991, lng: -34.855 },
  { name: 'Petrolina', lat: -9.389, lng: -40.500 },
  // PA
  { name: 'Ananindeua', lat: -1.366, lng: -48.389 },
  { name: 'Santarém', lat: -2.438, lng: -54.708 },
  { name: 'Marabá', lat: -5.368, lng: -49.117 },
  // GO
  { name: 'Anápolis', lat: -16.326, lng: -48.953 },
  { name: 'Aparecida de Goiânia', lat: -16.823, lng: -49.245 },
  { name: 'Rio Verde', lat: -17.798, lng: -50.919 },
  // MT
  { name: 'Rondonópolis', lat: -16.470, lng: -54.637 },
  { name: 'Sinop', lat: -11.860, lng: -55.509 },
  { name: 'Sorriso', lat: -12.542, lng: -55.711 },
  // MS
  { name: 'Dourados', lat: -22.223, lng: -54.812 },
  { name: 'Três Lagoas', lat: -20.751, lng: -51.678 },
  // AM
  { name: 'Parintins', lat: -2.628, lng: -56.736 },
  { name: 'Itacoatiara', lat: -3.138, lng: -58.444 },
  // RO
  { name: 'Ji-Paraná', lat: -10.885, lng: -61.951 },
  // MA
  { name: 'Imperatriz', lat: -5.519, lng: -47.474 },
  { name: 'Caxias', lat: -4.859, lng: -43.356 },
  // PI
  { name: 'Parnaíba', lat: -2.905, lng: -41.776 },
  // RN
  { name: 'Mossoró', lat: -5.187, lng: -37.344 },
  // PB
  { name: 'Campina Grande', lat: -7.230, lng: -35.881 },
  // AL
  { name: 'Arapiraca', lat: -9.752, lng: -36.661 },
  // SE
  { name: 'Aracaju Barra', lat: -10.990, lng: -37.048 },
  // ES
  { name: 'Vila Velha', lat: -20.330, lng: -40.292 },
  { name: 'Serra', lat: -20.121, lng: -40.307 },
  { name: 'Cariacica', lat: -20.263, lng: -40.416 },
  // TO
  { name: 'Araguaína', lat: -7.191, lng: -48.207 },
  // DF region
  { name: 'Taguatinga', lat: -15.836, lng: -48.057 },
  { name: 'Águas Claras', lat: -15.840, lng: -48.025 },
  // More spread
  { name: 'Manacapuru', lat: -3.290, lng: -60.620 },
  { name: 'Tabatinga', lat: -4.252, lng: -69.938 },
  { name: 'Tefé', lat: -3.354, lng: -64.710 },
  { name: 'Cruzeiro do Sul', lat: -7.632, lng: -72.676 },
  { name: 'Altamira', lat: -3.203, lng: -52.206 },
  { name: 'Tucuruí', lat: -3.766, lng: -49.677 },
  { name: 'Cametá', lat: -2.244, lng: -49.496 },
  { name: 'Barreiras', lat: -12.153, lng: -44.990 },
  { name: 'Jequié', lat: -13.857, lng: -40.083 },
  { name: 'Sete Lagoas', lat: -19.462, lng: -44.247 },
  { name: 'Lavras', lat: -21.245, lng: -45.000 },
  { name: 'Patos de Minas', lat: -18.578, lng: -46.518 },
  { name: 'Divinópolis', lat: -20.138, lng: -44.884 },
  { name: 'Guaratinguetá', lat: -22.816, lng: -45.192 },
  { name: 'Franca', lat: -20.539, lng: -47.401 },
  { name: 'Limeira', lat: -22.564, lng: -47.401 },
  { name: 'Taubaté', lat: -23.026, lng: -45.555 },
  { name: 'Araçatuba', lat: -21.209, lng: -50.432 },
  { name: 'Botucatu', lat: -22.886, lng: -48.445 },
  { name: 'Assis', lat: -22.661, lng: -50.412 },
  { name: 'Paranaguá', lat: -25.515, lng: -48.510 },
  { name: 'Guarapuava', lat: -25.390, lng: -51.462 },
  { name: 'Lages', lat: -27.816, lng: -50.325 },
  { name: 'Criciúma', lat: -28.677, lng: -49.370 },
  { name: 'Passo Fundo', lat: -28.262, lng: -52.407 },
  { name: 'Uruguaiana', lat: -29.755, lng: -57.088 },
  { name: 'Bagé', lat: -31.330, lng: -54.107 },
  { name: 'Rio Grande', lat: -32.035, lng: -52.099 },
  { name: 'Novo Hamburgo', lat: -29.679, lng: -51.130 },
];

// Pan to Brazil on mount
function FlyToBrazil() {
  const map = useMap();
  useEffect(() => {
    map.flyTo([-14.5, -51.0], 4.3, { duration: 1.5 });
  }, [map]);
  return null;
}

export default function BrazilMap({ activeState: _activeState, onStateClick }: BrazilMapProps) {
  return (
    <MapContainer
      center={[-14.5, -51.0]}
      zoom={4}
      minZoom={3}
      maxZoom={12}
      style={{ width: '100%', height: '100%', minHeight: '550px', borderRadius: '16px', background: '#0a0a0a' }}
      zoomControl={true}
      attributionControl={false}
    >
      {/* Dark tile layer */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <FlyToBrazil />

      {/* Capital markers — large NZ logo */}
      {CAPITALS.map((cap) => (
        <Marker
          key={cap.uf}
          position={[cap.lat, cap.lng]}
          icon={nzIcon}
          eventHandlers={{
            click: () => onStateClick(cap.uf),
          }}
        >
          <Popup>
            <div style={{ fontFamily: "'Inter', sans-serif", textAlign: 'center', color: '#000' }}>
              <strong style={{ fontSize: '0.9rem' }}>{cap.name}</strong>
              <br />
              <span style={{ fontSize: '0.75rem', color: '#666' }}>{cap.uf} — Capital</span>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Smaller city markers */}
      {CITIES.map((city, i) => (
        <Marker
          key={`city-${i}`}
          position={[city.lat, city.lng]}
          icon={nzIconSmall}
        >
          <Popup>
            <div style={{ fontFamily: "'Inter', sans-serif", textAlign: 'center', color: '#000' }}>
              <strong style={{ fontSize: '0.8rem' }}>{city.name}</strong>
              <br />
              <span style={{ fontSize: '0.7rem', color: '#666' }}>Aplicador NZ Certificado</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
