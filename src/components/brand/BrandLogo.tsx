import React from 'react';

interface BrandLogoProps {
  /** Tamanho do logo em pixels (largura/altura). Padrão: 140 */
  size?: number;
  /** Se as animações de desenho e pulso devem ser ativadas. Padrão: true */
  animated?: boolean;
  /** Variante compacta para headers e ícones pequenos */
  compact?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 140,
  animated = true,
  compact = false,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${
        animated ? 'animate-shimmer-glow' : ''
      }`}
      style={{ width: size, height: size }}
    >
      {/* Halo de luz ambiente sutil */}
      <div
        className={`absolute inset-0 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none ${
          animated ? 'animate-ambient-pulse' : ''
        }`}
      />

      <svg
        viewBox="0 0 400 400"
        width={size}
        height={size}
        className="relative z-10 overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradientes estruturais de alta tecnologia */}
          <linearGradient id="blRoofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <linearGradient id="blVectorGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FDE047" />
          </linearGradient>

          <linearGradient id="blPillar1" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#064E3B" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          <linearGradient id="blPillar2" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#0F766E" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>

          <linearGradient id="blPillar3" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* Filtro Glow Neon */}
          <filter id="blNeonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ============================================================= */}
        {/* 1. TERRENO ISOMÉTRICO (Plano do Terreno 10x50m)               */}
        {/* ============================================================= */}
        <g id="bl-terreno">
          {/* Perímetro do Lote em Perspectiva Isométrica */}
          <polygon
            points="200,265 315,310 200,355 85,310"
            fill="#10B981"
            fillOpacity="0.12"
            stroke="#38BDF8"
            strokeWidth="2.2"
            strokeLinejoin="round"
            className={animated ? 'animate-draw-polygon' : ''}
            style={{
              strokeDasharray: 450,
              strokeDashoffset: animated ? 0 : 0,
            }}
          />

          {/* Eixos Cartesianos do Loteamento */}
          <line
            x1="85"
            y1="310"
            x2="315"
            y2="310"
            stroke="#38BDF8"
            strokeWidth="1.2"
            strokeOpacity="0.35"
            strokeDasharray="4 4"
          />
          <line
            x1="200"
            y1="265"
            x2="200"
            y2="355"
            stroke="#38BDF8"
            strokeWidth="1.2"
            strokeOpacity="0.35"
            strokeDasharray="4 4"
          />

          {/* Cruzetas Topográficas nos 4 cantos da divisa */}
          {!compact && (
            <>
              <circle cx="85" cy="310" r="2.5" fill="#38BDF8" />
              <circle cx="315" cy="310" r="2.5" fill="#38BDF8" />
              <circle cx="200" cy="265" r="2.5" fill="#38BDF8" />
              <circle cx="200" cy="355" r="2.5" fill="#38BDF8" />
            </>
          )}
        </g>

        {/* ============================================================= */}
        {/* 2. PILARES FINANCEIROS (Barras de Custo da Obra)              */}
        {/* ============================================================= */}
        <g id="bl-pilares">
          {/* Barra 1: Fundação & Terraplanagem */}
          <rect
            x="142"
            y="255"
            width="18"
            height="55"
            rx="3"
            fill="url(#blPillar1)"
            className={animated ? 'animate-pillar-rise-1' : ''}
            style={{ transformOrigin: '151px 310px' }}
          />

          {/* Barra 2: Materiais da Obra */}
          <rect
            x="174"
            y="220"
            width="18"
            height="100"
            rx="3"
            fill="url(#blPillar2)"
            className={animated ? 'animate-pillar-rise-2' : ''}
            style={{ transformOrigin: '183px 320px' }}
          />

          {/* Barra 3: Mão de Obra & Edificação */}
          <rect
            x="206"
            y="180"
            width="18"
            height="148"
            rx="3"
            fill="url(#blPillar3)"
            className={animated ? 'animate-pillar-rise-3' : ''}
            style={{ transformOrigin: '215px 328px' }}
          />
        </g>

        {/* ============================================================= */}
        {/* 3. SILHUETA ARQUITETURAL & TELHADO MINIMALISTA               */}
        {/* ============================================================= */}
        <g id="bl-casa">
          {/* Preenchimento translúcido da casa */}
          <polygon
            points="115,240 200,140 285,240 240,280 160,280"
            fill="url(#blRoofGrad)"
            fillOpacity="0.18"
          />

          {/* Vigas principais do Telhado em Blueprint */}
          <path
            d="M 115 240 L 200 140 L 285 240"
            stroke="#6EE7B7"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#blNeonGlow)"
            className={animated ? 'animate-draw-roof' : ''}
            style={{
              strokeDasharray: 450,
              strokeDashoffset: 0,
            }}
          />

          {/* Linha de Prumo / Eixo de Elevação Central */}
          <line
            x1="200"
            y1="140"
            x2="200"
            y2="88"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeDasharray="55"
            className={animated ? 'animate-draw-axis' : ''}
          />
        </g>

        {/* ============================================================= */}
        {/* 4. VETOR ASCENDENTE DE VALORIZAÇÃO FINANCEIRA (ÁPICE)         */}
        {/* ============================================================= */}
        <g
          id="bl-vetor"
          className={animated ? 'animate-apex-pop' : ''}
          style={{ transformOrigin: '200px 80px' }}
        >
          {/* Seta do Vetor Financeiro */}
          <polygon
            points="200,60 218,90 200,82 182,90"
            fill="url(#blVectorGrad)"
            filter="url(#blNeonGlow)"
          />

          {/* Ponto de Precisão / Laser de Medição */}
          <circle cx="200" cy="60" r="3.5" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
};
