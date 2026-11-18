interface KneeAngleDiagramProps {
  /** Current or target knee flexion angle in degrees (0 = straight, 90 = right angle, 140 = deep bend) */
  angleDeg: number;
  /** Optional maximum allowed brace flexion angle (shows brace hinge + safe arc up to this angle) */
  maxAllowedDeg?: number;
  /** Optional short Hebrew caption rendered below or beside */
  caption?: string;
  /** Visual size variant */
  size?: 'sm' | 'md';
  className?: string;
}

function polarPoint(cx: number, cy: number, radius: number, degFromRightClockwise: number) {
  const rad = (degFromRightClockwise * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function buildSectorPath(
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  endDeg: number
): string {
  const clampedStart = Math.max(0, Math.min(145, startDeg));
  const clampedEnd = Math.max(0, Math.min(145, endDeg));
  if (clampedEnd <= clampedStart) return '';
  const p1 = polarPoint(cx, cy, radius, clampedStart);
  const p2 = polarPoint(cx, cy, radius, clampedEnd);
  const largeArc = clampedEnd - clampedStart > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${radius} ${radius} 0 ${largeArc} 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} Z`;
}

function buildArcPath(
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  endDeg: number
): string {
  const clampedStart = Math.max(0, Math.min(145, startDeg));
  const clampedEnd = Math.max(0, Math.min(145, endDeg));
  if (clampedEnd <= clampedStart) return '';
  const p1 = polarPoint(cx, cy, radius, clampedStart);
  const p2 = polarPoint(cx, cy, radius, clampedEnd);
  const largeArc = clampedEnd - clampedStart > 180 ? 1 : 0;
  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${radius} ${radius} 0 ${largeArc} 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
}

export function KneeAngleDiagram({
  angleDeg,
  maxAllowedDeg,
  caption,
  size = 'md',
  className = '',
}: KneeAngleDiagramProps) {
  const clampedAngle = Math.max(0, Math.min(145, Math.round(angleDeg)));
  const hasBraceLimit = typeof maxAllowedDeg === 'number' && maxAllowedDeg < 140;
  const isOverLimit = typeof maxAllowedDeg === 'number' && clampedAngle > maxAllowedDeg;

  // Knee pivot near upper-center so both 0° straight right and 90°-135° bent down fit cleanly
  const kx = 86;
  const ky = 36;
  const thighLen = 58;
  const shinLen = 56;

  const shinTip = polarPoint(kx, ky, shinLen, clampedAngle);
  // Foot points slightly forward relative to shin (+82 deg counterclockwise from shin direction, i.e. angle - 80)
  const footTip = polarPoint(shinTip.x, shinTip.y, 16, clampedAngle - 82);

  // Patella position slightly forward-upward on knee cap bisector
  const patellaPos = polarPoint(kx, ky, 9.5, clampedAngle * 0.4 - 18);

  const safeLimitDeg =
    typeof maxAllowedDeg === 'number' ? Math.max(0, Math.min(145, maxAllowedDeg)) : clampedAngle;

  const angleSector = buildSectorPath(kx, ky, 34, 0, clampedAngle);
  const safeArc = hasBraceLimit && safeLimitDeg > 0 ? buildArcPath(kx, ky, 38, 0, safeLimitDeg) : '';
  const safeLimitTip = hasBraceLimit ? polarPoint(kx, ky, 42, safeLimitDeg) : null;

  const boxWidth = size === 'sm' ? 'w-32' : 'w-44 sm:w-48';

  return (
    <div className={`inline-flex flex-col items-center gap-1.5 ${className}`}>
      <div
        className={`${boxWidth} rounded-xl border ${
          isOverLimit ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-slate-50/80'
        } p-2`}
        dir="ltr"
      >
        <svg
          viewBox="0 0 166 108"
          className="w-full h-auto"
          role="img"
          aria-label={`המחשה ויזואלית של זווית כיפוף ברך ${clampedAngle} מעלות`}
        >
          {/* Reference 0° horizontal straight extension line */}
          <line
            x1={kx}
            y1={ky}
            x2={kx + shinLen + 10}
            y2={ky}
            stroke="#cbd5e1"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* 90° vertical faint reference tick */}
          <line
            x1={kx}
            y1={ky + 4}
            x2={kx}
            y2={ky + 44}
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray="2 3"
          />

          {/* Flexion wedge */}
          {clampedAngle > 0 && (
            <path
              d={angleSector}
              fill={isOverLimit ? 'rgba(217, 119, 6, 0.16)' : 'rgba(15, 118, 110, 0.14)'}
            />
          )}

          {/* Allowed brace range arc */}
          {safeArc && (
            <path
              d={safeArc}
              fill="none"
              stroke="#0f766e"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          )}

          {/* Brace limit stop marker */}
          {safeLimitTip && (
            <line
              x1={kx}
              y1={ky}
              x2={safeLimitTip.x}
              y2={safeLimitTip.y}
              stroke="#0f766e"
              strokeWidth="1.4"
              strokeDasharray="2 2"
            />
          )}

          {/* Thigh (horizontal femur) */}
          <line
            x1={kx - thighLen}
            y1={ky}
            x2={kx}
            y2={ky}
            stroke="#334155"
            strokeWidth="13"
            strokeLinecap="round"
          />
          <line
            x1={kx - thighLen}
            y1={ky}
            x2={kx}
            y2={ky}
            stroke="#94a3b8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="1 5"
          />

          {/* Shin (tibia rotated by angleDeg) */}
          <line
            x1={kx}
            y1={ky}
            x2={shinTip.x}
            y2={shinTip.y}
            stroke={isOverLimit ? '#b45309' : '#0f766e'}
            strokeWidth="10.5"
            strokeLinecap="round"
          />

          {/* Foot */}
          <line
            x1={shinTip.x}
            y1={shinTip.y}
            x2={footTip.x}
            y2={footTip.y}
            stroke={isOverLimit ? '#b45309' : '#0f766e'}
            strokeWidth="7.5"
            strokeLinecap="round"
          />

          {/* Hinged brace outline when brace limit active */}
          {hasBraceLimit && (
            <g opacity="0.9">
              <circle
                cx={kx}
                cy={ky}
                r="10.5"
                fill="none"
                stroke="#0f172a"
                strokeWidth="1.8"
                strokeDasharray="4 2"
              />
              <rect
                x={kx - 28}
                y={ky - 8}
                width="6"
                height="16"
                rx="2"
                fill="#475569"
              />
            </g>
          )}

          {/* Knee joint pivot + patella highlight */}
          <circle cx={kx} cy={ky} r="6.5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <circle
            cx={patellaPos.x}
            cy={patellaPos.y}
            r="3.2"
            fill={isOverLimit ? '#d97706' : '#0f766e'}
          />

          {/* Angle readout */}
          <text
            x="14"
            y="98"
            fontSize="14"
            fontWeight="700"
            fontFamily="IBM Plex Mono, monospace"
            fill={isOverLimit ? '#b45309' : '#0f172a'}
          >
            {clampedAngle}°
          </text>
          <text
            x="14"
            y="80"
            fontSize="10.5"
            fontWeight="500"
            fontFamily="Heebo, sans-serif"
            fill="#475569"
          >
            {clampedAngle === 0 ? 'יישור מלא' : 'זווית כיפוף'}
          </text>
        </svg>
      </div>

      {caption && (
        <span className="text-xs text-slate-600 text-center leading-snug tabular-nums">
          {caption}
        </span>
      )}
    </div>
  );
}
