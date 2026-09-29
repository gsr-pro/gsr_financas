import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface ConstructionLogoProps {
  /** Cor de fundo da composição (padrão: azul-escuro arquitetural #0B132B) */
  backgroundColor?: string;
  /** Cor primária da estrutura e chácara (padrão: verde esmeralda #10B981) */
  primaryColor?: string;
  /** Cor secundária de linhas técnicas / blueprint (padrão: ciano CAD #38BDF8) */
  blueprintColor?: string;
  /** Cor do vetor financeiro e valorização (padrão: âmbar ouro #F59E0B) */
  accentColor?: string;
  /** Exibir texto 'OBRA & CUSTOS' animado abaixo do ícone */
  showTypography?: boolean;
}

export const ConstructionLogo: React.FC<ConstructionLogoProps> = ({
  backgroundColor = '#0B132B',
  primaryColor = '#10B981',
  blueprintColor = '#38BDF8',
  accentColor = '#F59E0B',
  showTypography = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // =========================================================================
  // 1. ANIMAÇÕES FÍSICAS VIA SPRING E INTERPOLATE (FRAME A FRAME)
  // =========================================================================

  // Fase 1: Revelação do Terreno Isométrico (Linhas Técnicas / Blueprint)
  const terrainProgress = interpolate(frame, [0, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Dashoffset de 500 a 0 desenha o contorno do lote de 500m²
  const terrainDashoffset = interpolate(terrainProgress, [0, 1], [500, 0]);

  // Fase 2: Surgimento dos Pilares Financeiros (Barras de Custo em Spring)
  const pillar1Spring = spring({
    frame: frame - 20,
    fps,
    config: { damping: 12, mass: 0.7, stiffness: 120 },
  });
  const pillar2Spring = spring({
    frame: frame - 26,
    fps,
    config: { damping: 12, mass: 0.7, stiffness: 120 },
  });
  const pillar3Spring = spring({
    frame: frame - 32,
    fps,
    config: { damping: 12, mass: 0.7, stiffness: 120 },
  });

  // Fase 3: Traçado da Cobertura Arquitetural (A Casa & Alinhamentos)
  const roofProgress = interpolate(frame, [35, 68], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const roofDashoffset = interpolate(roofProgress, [0, 1], [650, 0]);

  // Fase 4: Vetor Ascendente de Finanças (Seta de Valorização Patrimonial)
  const vectorSpring = spring({
    frame: frame - 55,
    fps,
    config: { damping: 10, mass: 0.6, stiffness: 140 },
  });

  // Fase 5: Preenchimentos (Fills), Glow Neon e Pulso de Escala Final
  const fillOpacity = interpolate(frame, [70, 95], [0, 0.22], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const glowIntensity = interpolate(frame, [75, 105], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Pulso sutil de conclusão (elastic bounce cinematográfico)
  const finalScaleSpring = spring({
    frame: frame - 85,
    fps,
    config: { damping: 14, mass: 0.9, stiffness: 110 },
  });
  const scale = interpolate(finalScaleSpring, [0, 1], [0.94, 1]);

  // Tipografia da Marca
  const textOpacity = interpolate(frame, [80, 105], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const textTranslateY = interpolate(frame, [80, 105], [15, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        backgroundColor,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Luz ambiente de fundo (Ambient Radial Bloom) */}
      <div
        style={{
          position: 'absolute',
          width: 550,
          height: 550,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${primaryColor}22 0%, ${accentColor}11 40%, transparent 70%)`,
          filter: 'blur(70px)',
          opacity: glowIntensity,
          transform: `scale(${scale})`,
          pointerEvents: 'none',
        }}
      />

      {/* Container Central do Logo SVG */}
      <div
        style={{
          transform: `scale(${scale})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          viewBox="0 0 600 600"
          width="420"
          height="420"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Gradientes estruturais de alta definição */}
            <linearGradient id="gradientRoof" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor={primaryColor} />
            </linearGradient>

            <linearGradient id="gradientVector" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FDE047" />
            </linearGradient>

            <linearGradient id="gradientPillar1" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>

            <linearGradient id="gradientPillar2" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0D9488" />
              <stop offset="100%" stopColor="#2DD4BF" />
            </linearGradient>

            <linearGradient id="gradientPillar3" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>

            {/* Filtro Neon Glow Nativo */}
            <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ============================================================= */}
          {/* CAMADA 1: TERRENO ISOMÉTRICO (10x50m) & LINHAS DE COTA         */}
          {/* ============================================================= */}
          <g id="terreno-e-grid">
            {/* Contorno perimétrico do lote em perspectiva isométrica */}
            <polygon
              points="300,380 470,445 300,510 130,445"
              fill={primaryColor}
              fillOpacity={fillOpacity * 0.4}
              stroke={blueprintColor}
              strokeWidth="2.5"
              strokeDasharray="500"
              strokeDashoffset={terrainDashoffset}
              strokeLinejoin="round"
            />

            {/* Eixo longitudinal do terreno (Divisão de quadrantes 10x50m) */}
            <line
              x1="130"
              y1="445"
              x2="470"
              y2="445"
              stroke={blueprintColor}
              strokeWidth="1.5"
              strokeOpacity="0.4"
              strokeDasharray="4 4"
            />
            <line
              x1="300"
              y1="380"
              x2="300"
              y2="510"
              stroke={blueprintColor}
              strokeWidth="1.5"
              strokeOpacity="0.4"
              strokeDasharray="4 4"
            />

            {/* Cruzetas topográficas nos 4 vértices do terreno */}
            {[
              [130, 445],
              [470, 445],
              [300, 380],
              [300, 510],
            ].map(([cx, cy], i) => (
              <g
                key={i}
                opacity={terrainProgress}
                transform={`scale(${Math.min(1, terrainProgress * 1.2)})`}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              >
                <circle cx={cx} cy={cy} r="3" fill={blueprintColor} />
              </g>
            ))}
          </g>

          {/* ============================================================= */}
          {/* CAMADA 2: PILARES FINANCEIROS (BARRAS DE CUSTO CRESCENTES)    */}
          {/* ============================================================= */}
          <g id="pilares-financeiros">
            {/* Barra 1: Fundação & Terraplanagem */}
            <rect
              x="215"
              y="370"
              width="26"
              height="80"
              rx="4"
              fill="url(#gradientPillar1)"
              style={{
                transformOrigin: '228px 450px',
                transform: `scaleY(${Math.max(0, pillar1Spring)})`,
              }}
            />

            {/* Barra 2: Materiais da Obra */}
            <rect
              x="262"
              y="320"
              width="26"
              height="145"
              rx="4"
              fill="url(#gradientPillar2)"
              style={{
                transformOrigin: '275px 465px',
                transform: `scaleY(${Math.max(0, pillar2Spring)})`,
              }}
            />

            {/* Barra 3: Mão de Obra e Gestão */}
            <rect
              x="309"
              y="265"
              width="26"
              height="215"
              rx="4"
              fill="url(#gradientPillar3)"
              style={{
                transformOrigin: '322px 480px',
                transform: `scaleY(${Math.max(0, pillar3Spring)})`,
              }}
            />
          </g>

          {/* ============================================================= */}
          {/* CAMADA 3: ESTRUTURA ARQUITETURAL & TELHADO MINIMALISTA        */}
          {/* ============================================================= */}
          <g id="estrutura-casa">
            {/* Polígono translúcido do frontão da casa */}
            <polygon
              points="175,340 300,200 425,340 360,400 240,400"
              fill="url(#gradientRoof)"
              fillOpacity={fillOpacity}
            />

            {/* Linhas mestras de traçado da casa (Efeito Blueprint Reveal) */}
            <path
              d="M 175 345 L 300 205 L 425 345"
              fill="none"
              stroke="#A7F3D0"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="650"
              strokeDashoffset={roofDashoffset}
              filter={glowIntensity > 0.5 ? 'url(#neonGlow)' : undefined}
            />

            {/* Arestas de projeção de profundidade da cobertura */}
            <path
              d="M 300 205 L 300 125"
              fill="none"
              stroke={accentColor}
              strokeWidth="3.5"
              strokeDasharray="80"
              strokeDashoffset={interpolate(vectorSpring, [0, 1], [80, 0])}
            />
          </g>

          {/* ============================================================= */}
          {/* CAMADA 4: VETOR ASCENDENTE DE VALORIZAÇÃO FINANCEIRA (ÁPICE)  */}
          {/* ============================================================= */}
          <g
            id="vetor-valorizacao"
            style={{
              transformOrigin: '300px 115px',
              transform: `scale(${Math.max(0, vectorSpring)})`,
            }}
          >
            {/* Seta Geométrica de Crescimento Patrimonial no cume */}
            <polygon
              points="300,90 326,132 300,120 274,132"
              fill="url(#gradientVector)"
              filter={glowIntensity > 0.4 ? 'url(#neonGlow)' : undefined}
            />

            {/* Ponto focal de precisão (Círculo emissor) */}
            <circle cx="300" cy="90" r="4.5" fill="#FFFFFF" />
          </g>
        </svg>

        {/* ============================================================= */}
        {/* CAMADA 5: TIPOGRAFIA PREMIUM E IDENTIFICAÇÃO DA MARCA          */}
        {/* ============================================================= */}
        {showTypography && (
          <div
            style={{
              marginTop: 18,
              textAlign: 'center',
              opacity: textOpacity,
              transform: `translateY(${textTranslateY}px)`,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: '#FFFFFF',
                textTransform: 'uppercase',
              }}
            >
              Obra<span style={{ color: primaryColor }}>Chácara</span>
            </h1>
            <p
              style={{
                margin: '5px 0 0 0',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.25em',
                color: blueprintColor,
                textTransform: 'uppercase',
                opacity: 0.85,
              }}
            >
              Controle de Custos & Terreno (500m²)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConstructionLogo;
