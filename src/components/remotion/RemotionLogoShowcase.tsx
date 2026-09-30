import React, { useEffect, useState, useRef, useCallback } from 'react';
import { interpolate, spring } from 'remotion';
import { Play, RotateCcw, Sparkles } from 'lucide-react';

interface RemotionLogoShowcaseProps {
  /** Largura/altura base do SVG */
  size?: number;
  /** Se deve iniciar em reprodução automática */
  autoPlay?: boolean;
}

export const RemotionLogoShowcase: React.FC<RemotionLogoShowcaseProps> = ({
  size = 340,
  autoPlay = true,
}) => {
  const fps = 30;
  const totalFrames = 120; // 4 segundos a 30fps
  const [frame, setFrame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Loop suave de frames acionado por requestAnimationFrame usando o relógio do navegador
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const intervalMs = 1000 / fps;

    const animate = (currentTime: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = currentTime;
      }

      const elapsed = currentTime - lastTimeRef.current;

      if (elapsed >= intervalMs) {
        setFrame((prevFrame) => {
          if (prevFrame >= totalFrames) {
            // Pausa breve no fim e repete o loop
            return 0;
          }
          return prevFrame + 1;
        });
        lastTimeRef.current = currentTime - (elapsed % intervalMs);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, fps, totalFrames]);

  const handleRestart = useCallback(() => {
    setFrame(0);
    setIsPlaying(true);
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // =========================================================================
  // CÁLCULO DAS FÍSICAS DE ANIMAÇÃO COM REMOTION NATIVO (FRAME A FRAME)
  // =========================================================================

  // Fase 1: Traçado do Perímetro do Terreno (Planta Baixa)
  const terrainProgress = interpolate(frame, [0, 36], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const terrainDashoffset = interpolate(terrainProgress, [0, 1], [450, 0]);

  // Fase 2: Física de Pilares Financeiros (Mola / Spring Physics)
  const pillar1Spring = spring({
    frame: frame - 18,
    fps,
    config: { damping: 11, mass: 0.6, stiffness: 130 },
  });
  const pillar2Spring = spring({
    frame: frame - 25,
    fps,
    config: { damping: 11, mass: 0.6, stiffness: 130 },
  });
  const pillar3Spring = spring({
    frame: frame - 32,
    fps,
    config: { damping: 11, mass: 0.6, stiffness: 130 },
  });

  // Fase 3: Telhado Arquitetural e Linhas Mestras
  const roofProgress = interpolate(frame, [30, 65], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const roofDashoffset = interpolate(roofProgress, [0, 1], [450, 0]);

  // Fase 4: Vetor Ascendente de Finanças & Prosperidade
  const vectorSpring = spring({
    frame: frame - 55,
    fps,
    config: { damping: 10, mass: 0.5, stiffness: 140 },
  });

  // Fase 5: Preenchimentos Translúcidos & Glow Neon
  const fillOpacity = interpolate(frame, [60, 90], [0, 0.22], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const glowIntensity = interpolate(frame, [70, 100], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Pulso de Escala e Amortecimento Cinematográfico
  const scaleSpring = spring({
    frame: frame - 80,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 110 },
  });
  const finalScale = interpolate(scaleSpring, [0, 1], [0.95, 1]);

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      {/* Halo de Luz Radial Dinâmico com Glow baseado no Remotion */}
      <div
        className="absolute rounded-full pointer-events-none transition-all duration-300"
        style={{
          width: size * 1.3,
          height: size * 1.3,
          background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(245,158,11,0.08) 45%, transparent 70%)',
          filter: `blur(${35 + glowIntensity * 25}px)`,
          opacity: 0.4 + glowIntensity * 0.6,
          transform: `scale(${finalScale})`,
        }}
      />

      {/* Container SVG Animado com Valores Físicos de Remotion */}
      <div
        style={{
          width: size,
          height: size,
          transform: `scale(${finalScale})`,
          transition: 'transform 0.05s linear',
        }}
        className="relative z-10 flex items-center justify-center"
      >
        <svg
          viewBox="0 0 400 400"
          width={size}
          height={size}
          className="overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradientes estruturais de alta definição */}
            <linearGradient id="rmtRoofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <linearGradient id="rmtVectorGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FDE047" />
            </linearGradient>

            <linearGradient id="rmtPillar1" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#064E3B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>

            <linearGradient id="rmtPillar2" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0F766E" />
              <stop offset="100%" stopColor="#14B8A6" />
            </linearGradient>

            <linearGradient id="rmtPillar3" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            {/* Filtro Glow Neon Suave */}
            <filter id="rmtNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ============================================================= */}
          {/* 1. TERRENO ISOMÉTRICO (Planta Baixa / Linhas de Cota)          */}
          {/* ============================================================= */}
          <g id="rmt-terreno">
            <polygon
              points="200,265 315,310 200,355 85,310"
              fill="#10B981"
              fillOpacity={fillOpacity * 0.6}
              stroke="#38BDF8"
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeDasharray={450}
              strokeDashoffset={terrainDashoffset}
              style={{ opacity: Math.max(0.2, terrainProgress) }}
            />

            {/* Eixos Cartesianos de Precisão */}
            <line
              x1="85"
              y1="310"
              x2="315"
              y2="310"
              stroke="#38BDF8"
              strokeWidth="1.2"
              strokeOpacity={0.4 * terrainProgress}
              strokeDasharray="4 4"
            />
            <line
              x1="200"
              y1="265"
              x2="200"
              y2="355"
              stroke="#38BDF8"
              strokeWidth="1.2"
              strokeOpacity={0.4 * terrainProgress}
              strokeDasharray="4 4"
            />

            {/* Pontos de Nível Topográfico nos 4 Cantos */}
            {[
              [85, 310],
              [315, 310],
              [200, 265],
              [200, 355],
            ].map(([cx, cy], idx) => (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r="2.5"
                fill="#38BDF8"
                style={{
                  opacity: terrainProgress,
                  transform: `scale(${Math.min(1, terrainProgress * 1.2)})`,
                  transformOrigin: `${cx}px ${cy}px`,
                }}
              />
            ))}
          </g>

          {/* ============================================================= */}
          {/* 2. PILARES FINANCEIROS (Mola Remotion spring() Frame a Frame)  */}
          {/* ============================================================= */}
          <g id="rmt-pilares">
            {/* Barra 1: Fundação & Planejamento */}
            <rect
              x="142"
              y="255"
              width="18"
              height="55"
              rx="3"
              fill="url(#rmtPillar1)"
              style={{
                transformOrigin: '151px 310px',
                transform: `scaleY(${Math.max(0, pillar1Spring)})`,
              }}
            />

            {/* Barra 2: Execução & Materiais */}
            <rect
              x="174"
              y="220"
              width="18"
              height="100"
              rx="3"
              fill="url(#rmtPillar2)"
              style={{
                transformOrigin: '183px 320px',
                transform: `scaleY(${Math.max(0, pillar2Spring)})`,
              }}
            />

            {/* Barra 3: Patrimônio & Mão de Obra */}
            <rect
              x="206"
              y="180"
              width="18"
              height="148"
              rx="3"
              fill="url(#rmtPillar3)"
              style={{
                transformOrigin: '215px 328px',
                transform: `scaleY(${Math.max(0, pillar3Spring)})`,
              }}
            />
          </g>

          {/* ============================================================= */}
          {/* 3. ESTRUTURA ARQUITETURAL & TELHADO MINIMALISTA               */}
          {/* ============================================================= */}
          <g id="rmt-casa">
            {/* Polígono Translúcido da Fachada */}
            <polygon
              points="115,240 200,140 285,240 240,280 160,280"
              fill="url(#rmtRoofGrad)"
              fillOpacity={fillOpacity}
            />

            {/* Vigas Principais Reveladas com Stroke Dashoffset */}
            <path
              d="M 115 240 L 200 140 L 285 240"
              stroke="#6EE7B7"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={450}
              strokeDashoffset={roofDashoffset}
              filter={glowIntensity > 0.3 ? 'url(#rmtNeonGlow)' : undefined}
            />

            {/* Linha Central de Elevação */}
            <line
              x1="200"
              y1="140"
              x2="200"
              y2="88"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeDasharray={55}
              strokeDashoffset={interpolate(vectorSpring, [0, 1], [55, 0])}
            />
          </g>

          {/* ============================================================= */}
          {/* 4. VETOR ASCENDENTE DE VALORIZAÇÃO FINANCEIRA (ÁPICE)         */}
          {/* ============================================================= */}
          <g
            id="rmt-vetor"
            style={{
              transformOrigin: '200px 80px',
              transform: `scale(${Math.max(0, vectorSpring)})`,
            }}
          >
            <polygon
              points="200,60 218,90 200,82 182,90"
              fill="url(#rmtVectorGrad)"
              filter={glowIntensity > 0.4 ? 'url(#rmtNeonGlow)' : undefined}
            />
            {/* Ponto Laser Central */}
            <circle cx="200" cy="60" r="3.5" fill="#FFFFFF" />
          </g>
        </svg>
      </div>

      {/* Controles Sutis do Remotion Engine (Status & Playback) */}
      <div className="mt-3 flex items-center space-x-3 bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 shadow-md">
        <button
          onClick={handleTogglePlay}
          className="text-slate-300 hover:text-emerald-400 transition-colors p-1"
          title={isPlaying ? 'Pausar animação' : 'Reproduzir animação'}
          aria-label={isPlaying ? 'Pausar animação' : 'Reproduzir animação'}
        >
          <Play className={`w-3.5 h-3.5 ${isPlaying ? 'fill-emerald-400 text-emerald-400' : ''}`} />
        </button>

        <button
          onClick={handleRestart}
          className="text-slate-300 hover:text-cyan-400 transition-colors p-1"
          title="Reiniciar animação Remotion"
          aria-label="Reiniciar animação Remotion"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="h-3 w-px bg-slate-700" />

        <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Remotion Engine</span>
          <span className="text-emerald-400">
            {frame.toString().padStart(3, '0')}/{totalFrames}f
          </span>
        </div>
      </div>
    </div>
  );
};
