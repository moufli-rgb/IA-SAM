import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { MemoirStage } from '../types/sam';

/**
 * La coupe bioclimatique : chaque étape du mémoire est une brique de terre.
 * Le mur monte au fil des validations, le soleil suit sa course jusqu'à la soutenance,
 * et l'air traverse la double toiture.
 */
export const BuildingSection: React.FC<{
  stages: MemoirStage[];
  daysLeft: number | null;
  onBrickClick?: (id: number) => void;
  className?: string;
}> = ({ stages, daysLeft, onBrickClick, className }) => {
  const reduce = useReducedMotion();
  const W = 600;
  const ground = 272;
  const bw = 64;
  const bh = 36;
  const gap = 4;
  const perRow = 5;
  const wallX = (W - (perRow * (bw + gap) + 14)) / 2;
  const rows = Math.ceil(stages.length / perRow);
  const wallTop = ground - rows * (bh + gap);
  const done = stages.filter((s) => s.status === 'donald_validated').length;
  const complete = done === stages.length;

  // course du soleil : 0 = début (≈120 jours avant), 1 = soutenance
  const t = daysLeft === null ? 0.35 : Math.min(1, Math.max(0, 1 - daysLeft / 120));
  const arc = (p: number) => {
    const x = 70 + p * 460;
    const y = 250 - Math.sin(p * Math.PI) * 205;
    return { x, y };
  };
  const sun = arc(t);
  const arcPath = Array.from({ length: 41 }, (_, i) => {
    const p = arc(i / 40);
    return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(' ');

  const roofLow = wallTop - 10;
  const roofHigh = wallTop - 34;

  return (
    <svg
      viewBox={`0 0 ${W} 300`}
      className={className}
      role="img"
      aria-label={`Coupe du projet : ${done} étapes validées sur ${stages.length}.`}
    >
      <defs>
        <radialGradient id="sun-glow">
          <stop offset="0%" stopColor="#F5B82E" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F5B82E" stopOpacity="0" />
        </radialGradient>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-laterite)" strokeWidth="2" />
        </pattern>
        <style>{`
          @keyframes sam-wind { to { stroke-dashoffset: -64; } }
          @keyframes sam-pulse { 0%,100% { opacity: 1 } 50% { opacity: .78 } }
          .sam-wind { stroke-dasharray: 18 14; animation: sam-wind 2.6s linear infinite; }
          .sam-wind.slow { animation-duration: 3.8s; }
          .sam-live { animation: sam-pulse 2.2s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) { .sam-wind, .sam-live { animation: none; } }
        `}</style>
      </defs>

      {/* course du soleil */}
      <path d={arcPath} fill="none" stroke="var(--color-ink-3)" strokeOpacity="0.45" strokeWidth="1.2" strokeDasharray="2 6" strokeLinecap="round" />
      <motion.g
        initial={reduce ? false : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ originX: `${sun.x}px`, originY: `${sun.y}px` }}
      >
        <circle cx={sun.x} cy={sun.y} r="46" fill="url(#sun-glow)" />
        <motion.g
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
          style={{ originX: `${sun.x}px`, originY: `${sun.y}px` }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1={sun.x} y1={sun.y - 24} x2={sun.x} y2={sun.y - 30}
              stroke="var(--color-soleil)" strokeWidth="2.2" strokeLinecap="round"
              transform={`rotate(${i * 30} ${sun.x} ${sun.y})`}
            />
          ))}
        </motion.g>
        <circle cx={sun.x} cy={sun.y} r="17" fill="var(--color-soleil)" />
        {daysLeft !== null && (
          <text
            x={sun.x}
            y={sun.y + 4.5}
            textAnchor="middle"
            fontFamily="var(--font-display)"
            fontSize="11"
            fontWeight="600"
            fill="#1a1b25"
          >
            {daysLeft > 0 ? `J-${daysLeft}` : 'J'}
          </text>
        )}
      </motion.g>

      {/* fanion de soutenance au bout de la course */}
      <g transform={`translate(${arc(1).x} ${ground})`}>
        <line x1="0" y1="0" x2="0" y2="-36" stroke="var(--color-ink)" strokeWidth="1.6" />
        <path d="M0 -36 L18 -31 L0 -26 Z" fill="var(--color-laterite)" />
      </g>

      {/* vent : traverse la double toiture et le haut du volume */}
      <g fill="none" stroke="var(--color-adire)" strokeWidth="1.8" strokeLinecap="round" opacity="0.75">
        <path className="sam-wind" d={`M60 ${roofLow - 4} C 140 ${roofLow - 26}, 210 ${roofLow + 4}, 300 ${roofLow - 12} S 460 ${roofLow - 30}, 540 ${roofLow - 22}`} />
        <path d={`M532 ${roofLow - 29} L542 ${roofLow - 22} L531 ${roofLow - 16}`} strokeDasharray="none" />
        <path className="sam-wind slow" d={`M30 ${ground - 18} C 90 ${ground - 26}, 110 ${wallTop + 14}, ${wallX + 10} ${wallTop - 4}`} opacity="0.7" />
        <path className="sam-wind slow" d={`M${W - wallX - 10} ${wallTop - 4} C ${W - wallX + 30} ${wallTop + 20}, 520 ${ground - 40}, 580 ${ground - 44}`} opacity="0.7" />
      </g>

      {/* double toiture ventilée */}
      <g>
        <rect
          x={wallX - 8}
          y={roofLow}
          width={perRow * (bw + gap) + 16}
          height="6"
          rx="2"
          fill="var(--color-ink)"
          opacity={complete ? 1 : 0.18}
        />
        <path
          d={`M${wallX - 30} ${roofHigh + 8} L${wallX + perRow * (bw + gap) + 30} ${roofHigh - 4}`}
          stroke="var(--color-ink)"
          strokeWidth="3"
          opacity={complete ? 1 : 0.18}
          strokeLinecap="round"
        />
        {[0.15, 0.5, 0.85].map((p) => {
          const x = wallX - 8 + p * (perRow * (bw + gap) + 16);
          return <line key={p} x1={x} y1={roofLow} x2={x} y2={roofHigh + 8 - p * 12 + 1} stroke="var(--color-ink)" strokeWidth="1.2" opacity={complete ? 0.6 : 0.18} />;
        })}
      </g>

      {/* sol */}
      <line x1="10" y1={ground + 1} x2={W - 10} y2={ground + 1} stroke="var(--color-ink)" strokeWidth="2" />
      {Array.from({ length: 36 }).map((_, i) => (
        <line key={i} x1={14 + i * 16.4} y1={ground + 3} x2={6 + i * 16.4} y2={ground + 11} stroke="var(--color-ink-3)" strokeWidth="1" opacity="0.6" />
      ))}

      {/* briques = étapes */}
      {stages.map((s, i) => {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const offset = row % 2 === 1 ? 14 : 0;
        const x = wallX + offset + col * (bw + gap);
        const y = ground - (row + 1) * (bh + gap) + gap;
        const st = s.status;
        const fill =
          st === 'donald_validated' ? 'var(--color-ink)' : st === 'in_progress' ? 'var(--color-soleil)' : st === 'needs_revision' ? 'url(#hatch)' : 'transparent';
        const stroke = st === 'not_started' ? 'var(--color-ink-3)' : st === 'needs_revision' ? 'var(--color-laterite)' : 'transparent';
        const txt = st === 'not_started' ? 'var(--color-ink-3)' : st === 'needs_revision' ? 'var(--color-laterite)' : '#1a1b25';
        return (
          <motion.g
            key={s.id}
            initial={reduce ? false : { opacity: 0, y: -46 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.04, type: 'spring', stiffness: 420, damping: 26 }}
            onClick={() => onBrickClick?.(s.id)}
            style={{ cursor: onBrickClick ? 'pointer' : undefined }}
            className={st === 'in_progress' ? 'sam-live' : undefined}
          >
            <title>{`${s.title} — ${labelFor(st)}`}</title>
            <rect
              x={x}
              y={y}
              width={bw}
              height={bh}
              rx="4"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.3"
              strokeDasharray={st === 'not_started' ? '4 4' : undefined}
            />
            <text
              x={x + bw / 2}
              y={y + bh / 2 + 4.5}
              textAnchor="middle"
              fontFamily="var(--font-display)"
              fontSize="13"
              fontWeight="600"
              fill={st === 'donald_validated' ? 'var(--color-paper)' : txt}
            >
              {s.id}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
};

export const labelFor = (st: MemoirStage['status']) =>
  st === 'donald_validated' ? 'validée' : st === 'in_progress' ? 'en cours' : st === 'needs_revision' ? 'à revoir' : 'à venir';

export const BrickLegend: React.FC<{ className?: string }> = ({ className }) => (
  <ul className={`flex flex-wrap gap-x-4 gap-y-1.5 text-[0.82rem] text-ink-2 ${className || ''}`}>
    <li className="flex items-center gap-1.5"><span className="h-3 w-4 rounded-[3px] bg-ink" />Validée</li>
    <li className="flex items-center gap-1.5"><span className="h-3 w-4 rounded-[3px] bg-soleil" />En cours</li>
    <li className="flex items-center gap-1.5"><span className="h-3 w-4 rounded-[3px] border border-laterite bg-[repeating-linear-gradient(45deg,var(--color-laterite)_0_2px,transparent_2px_5px)]" />À revoir</li>
    <li className="flex items-center gap-1.5"><span className="h-3 w-4 rounded-[3px] border border-dashed border-ink-3" />À venir</li>
  </ul>
);
