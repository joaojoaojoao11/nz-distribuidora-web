import { motion } from 'framer-motion';

interface BrazilMapProps {
  activeState: string | null;
  onStateClick: (uf: string) => void;
}

const CAPITALS: Record<string, { x: number; y: number; name: string }> = {
  AC: { x: 115, y: 340, name: 'Rio Branco' },
  AL: { x: 620, y: 345, name: 'Maceió' },
  AP: { x: 370, y: 120, name: 'Macapá' },
  AM: { x: 200, y: 220, name: 'Manaus' },
  BA: { x: 570, y: 380, name: 'Salvador' },
  CE: { x: 590, y: 260, name: 'Fortaleza' },
  DF: { x: 470, y: 410, name: 'Brasília' },
  ES: { x: 560, y: 460, name: 'Vitória' },
  GO: { x: 440, y: 420, name: 'Goiânia' },
  MA: { x: 490, y: 240, name: 'São Luís' },
  MT: { x: 330, y: 390, name: 'Cuiabá' },
  MS: { x: 350, y: 470, name: 'Campo Grande' },
  MG: { x: 510, y: 450, name: 'Belo Horizonte' },
  PA: { x: 350, y: 210, name: 'Belém' },
  PB: { x: 620, y: 290, name: 'João Pessoa' },
  PR: { x: 420, y: 520, name: 'Curitiba' },
  PE: { x: 610, y: 310, name: 'Recife' },
  PI: { x: 540, y: 280, name: 'Teresina' },
  RJ: { x: 530, y: 490, name: 'Rio de Janeiro' },
  RN: { x: 620, y: 270, name: 'Natal' },
  RS: { x: 400, y: 580, name: 'Porto Alegre' },
  RO: { x: 190, y: 350, name: 'Porto Velho' },
  RR: { x: 210, y: 120, name: 'Boa Vista' },
  SC: { x: 420, y: 550, name: 'Florianópolis' },
  SP: { x: 460, y: 490, name: 'São Paulo' },
  SE: { x: 600, y: 355, name: 'Aracaju' },
  TO: { x: 440, y: 340, name: 'Palmas' },
};

// Smaller cities spread across Brazil for visual density
const CITIES: { x: number; y: number }[] = [
  // Norte
  { x: 160, y: 180 }, { x: 240, y: 260 }, { x: 300, y: 190 }, { x: 270, y: 300 },
  { x: 150, y: 280 }, { x: 320, y: 150 }, { x: 250, y: 170 }, { x: 180, y: 310 },
  { x: 230, y: 140 }, { x: 140, y: 240 }, { x: 290, y: 230 }, { x: 350, y: 170 },
  { x: 130, y: 310 }, { x: 200, y: 150 }, { x: 260, y: 200 },
  // Nordeste
  { x: 520, y: 250 }, { x: 560, y: 300 }, { x: 540, y: 330 }, { x: 580, y: 280 },
  { x: 610, y: 320 }, { x: 550, y: 360 }, { x: 530, y: 310 }, { x: 600, y: 250 },
  { x: 570, y: 340 }, { x: 500, y: 270 }, { x: 590, y: 370 }, { x: 530, y: 290 },
  { x: 560, y: 245 }, { x: 510, y: 260 }, { x: 545, y: 315 }, { x: 575, y: 355 },
  { x: 605, y: 330 }, { x: 495, y: 250 }, { x: 580, y: 390 }, { x: 555, y: 270 },
  { x: 535, y: 350 }, { x: 615, y: 300 }, { x: 505, y: 280 }, { x: 565, y: 325 },
  // Centro-Oeste
  { x: 380, y: 400 }, { x: 420, y: 440 }, { x: 360, y: 430 }, { x: 450, y: 400 },
  { x: 310, y: 420 }, { x: 390, y: 450 }, { x: 340, y: 380 }, { x: 300, y: 450 },
  { x: 370, y: 370 }, { x: 410, y: 380 }, { x: 350, y: 440 }, { x: 430, y: 410 },
  { x: 320, y: 400 }, { x: 400, y: 460 }, { x: 280, y: 440 }, { x: 460, y: 430 },
  // Sudeste
  { x: 480, y: 470 }, { x: 500, y: 500 }, { x: 520, y: 470 }, { x: 450, y: 480 },
  { x: 540, y: 450 }, { x: 490, y: 440 }, { x: 470, y: 500 }, { x: 510, y: 480 },
  { x: 530, y: 460 }, { x: 460, y: 460 }, { x: 480, y: 510 }, { x: 500, y: 430 },
  { x: 440, y: 500 }, { x: 520, y: 500 }, { x: 490, y: 460 }, { x: 550, y: 470 },
  { x: 470, y: 440 }, { x: 510, y: 510 }, { x: 445, y: 475 }, { x: 525, y: 485 },
  { x: 495, y: 455 }, { x: 465, y: 505 }, { x: 535, y: 440 }, { x: 485, y: 495 },
  // Sul
  { x: 430, y: 530 }, { x: 410, y: 560 }, { x: 390, y: 540 }, { x: 440, y: 550 },
  { x: 380, y: 570 }, { x: 420, y: 540 }, { x: 400, y: 590 }, { x: 450, y: 530 },
  { x: 370, y: 555 }, { x: 435, y: 565 }, { x: 395, y: 530 }, { x: 415, y: 575 },
  { x: 385, y: 590 }, { x: 405, y: 545 }, { x: 425, y: 560 }, { x: 445, y: 540 },
];

// Simplified Brazil outline path
const BRAZIL_PATH = `M 370 80 L 395 95 L 410 110 L 390 130 L 370 140 L 355 160 L 340 175 
L 320 170 L 300 175 L 280 190 L 260 195 L 240 190 L 220 185 L 200 190 L 180 195 
L 160 200 L 140 210 L 120 220 L 110 240 L 100 260 L 95 280 L 100 300 L 105 320 
L 115 340 L 120 355 L 130 365 L 150 370 L 170 365 L 190 360 L 210 355 L 230 360 
L 250 370 L 270 380 L 280 400 L 285 420 L 290 440 L 300 460 L 310 475 L 325 490 
L 340 500 L 355 510 L 370 530 L 375 550 L 380 570 L 385 590 L 395 600 L 410 600 
L 425 590 L 440 570 L 450 555 L 460 540 L 465 520 L 470 510 L 480 510 
L 500 510 L 520 505 L 535 500 L 545 490 L 555 475 L 560 460 L 565 445 
L 575 430 L 585 400 L 595 385 L 610 365 L 620 350 L 630 335 L 635 320 
L 630 300 L 625 285 L 620 270 L 615 255 L 600 240 L 585 230 L 570 225 
L 555 230 L 540 235 L 520 240 L 500 240 L 490 235 L 480 230 L 465 225 
L 450 220 L 440 215 L 435 200 L 440 185 L 435 170 L 425 155 L 415 140 
L 405 125 L 395 110 L 385 95 L 370 80 Z`;

// State boundary paths (simplified)
const STATE_PATHS: Record<string, string> = {
  SP: `M 430 470 L 460 460 L 490 465 L 520 470 L 530 480 L 520 500 L 500 510 L 480 510 L 460 505 L 440 500 L 430 490 Z`,
  RJ: `M 520 475 L 545 470 L 560 480 L 550 495 L 535 500 L 520 500 L 515 490 Z`,
  MG: `M 460 420 L 490 415 L 520 420 L 545 430 L 560 450 L 550 470 L 530 475 L 500 470 L 470 465 L 455 450 L 450 435 Z`,
  PR: `M 390 510 L 420 505 L 445 510 L 465 515 L 460 530 L 445 540 L 420 540 L 400 535 L 385 525 Z`,
  SC: `M 395 535 L 420 540 L 445 545 L 450 555 L 435 565 L 415 565 L 395 560 L 385 550 Z`,
  RS: `M 370 555 L 395 560 L 415 570 L 430 580 L 420 595 L 400 600 L 385 595 L 375 580 L 370 565 Z`,
  BA: `M 520 340 L 560 335 L 590 345 L 610 360 L 600 385 L 575 400 L 550 395 L 530 380 L 520 360 Z`,
  AM: `M 120, 170 L 200 160 L 280 180 L 310 200 L 300 250 L 280 290 L 240 310 L 180 320 L 140 300 L 110 260 L 110 220 Z`,
};

export default function BrazilMap({ activeState, onStateClick }: BrazilMapProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '500px' }}>
      <svg
        viewBox="60 60 620 580"
        style={{ width: '100%', height: '100%' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glowStrong">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Brazil outline */}
        <motion.path
          d={BRAZIL_PATH}
          fill="rgba(255,255,255,0.03)"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />

        {/* State boundaries */}
        {Object.entries(STATE_PATHS).map(([uf, path]) => (
          <motion.path
            key={uf}
            d={path}
            fill={activeState === uf ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)'}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.5"
            whileHover={{ fill: 'rgba(255,255,255,0.1)' }}
            onClick={() => onStateClick(uf)}
            style={{ cursor: 'pointer' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          />
        ))}

        {/* Small city dots — constellation effect */}
        {CITIES.map((city, i) => (
          <motion.circle
            key={`city-${i}`}
            cx={city.x}
            cy={city.y}
            r="1.5"
            fill="#fff"
            opacity={0.25}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0.15, 0.35, 0.15], scale: 1 }}
            transition={{
              opacity: { duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' },
              scale: { delay: 1 + i * 0.01, duration: 0.3 },
            }}
          />
        ))}

        {/* Capital pins — Large glowing NZ markers */}
        {Object.entries(CAPITALS).map(([uf, cap], i) => (
          <motion.g
            key={uf}
            onClick={() => onStateClick(uf)}
            style={{ cursor: 'pointer' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.05, duration: 0.4 }}
          >
            {/* Glow circle */}
            <motion.circle
              cx={cap.x}
              cy={cap.y}
              r="10"
              fill="url(#pinGlow)"
              animate={{ r: [8, 12, 8], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
            />
            {/* Pin dot */}
            <circle
              cx={cap.x}
              cy={cap.y}
              r="4"
              fill="#fff"
              filter="url(#glow)"
            />
            {/* Label */}
            <text
              x={cap.x}
              y={cap.y - 10}
              textAnchor="middle"
              fill="rgba(255,255,255,0.5)"
              fontSize="7"
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="700"
            >
              {uf}
            </text>

            {/* Tooltip on hover */}
            {activeState === uf && (
              <g>
                <rect
                  x={cap.x - 45}
                  y={cap.y - 30}
                  width="90"
                  height="18"
                  rx="4"
                  fill="rgba(0,0,0,0.85)"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="0.5"
                />
                <text
                  x={cap.x}
                  y={cap.y - 18}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="7"
                  fontFamily="'Inter', sans-serif"
                  fontWeight="600"
                >
                  {cap.name}
                </text>
              </g>
            )}
          </motion.g>
        ))}
      </svg>
    </div>
  );
}
