type TrendPoint = { label: string; value: number };

export function TrendChart({ points }: { points: TrendPoint[] }) {
  const width = 640;
  const height = 220;
  const paddingLeft = 10;
  const paddingRight = 10;
  const paddingTop = 16;
  const paddingBottom = 28;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const zeroY = paddingTop + chartHeight / 2;

  const maxAbs = Math.max(1, ...points.map((p) => Math.abs(p.value)));
  const slot = chartWidth / points.length;
  const barWidth = Math.min(40, slot * 0.5);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="월별 손익 추이 그래프">
      <line x1={paddingLeft} x2={width - paddingRight} y1={zeroY} y2={zeroY} stroke="#e2e8f0" strokeWidth={1} />
      {points.map((p, i) => {
        const barHeight = (Math.abs(p.value) / maxAbs) * (chartHeight / 2 - 4);
        const x = paddingLeft + slot * i + (slot - barWidth) / 2;
        const y = p.value >= 0 ? zeroY - barHeight : zeroY;
        const color = p.value >= 0 ? "#0d9488" : "#dc2626";
        return (
          <g key={p.label}>
            <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, 1)} fill={color} rx={3} />
            <text x={x + barWidth / 2} y={height - 10} textAnchor="middle" fontSize="11" fill="#64748b">
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
