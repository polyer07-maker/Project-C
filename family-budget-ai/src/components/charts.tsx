import { formatMoney, formatPercent } from "@/lib/format";
import type { CategoryBreakdownItem } from "@/lib/finance/types";

const BAR_COLORS = [
  "bg-brand-600",
  "bg-brand-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-violet-500",
  "bg-lime-600",
  "bg-orange-500",
  "bg-cyan-600",
  "bg-fuchsia-500",
  "bg-slate-500",
  "bg-stone-500",
];

export function CategoryBars({
  categories,
  currency,
}: {
  categories: CategoryBreakdownItem[];
  currency: string;
}) {
  const max = Math.max(...categories.map((c) => c.monthly), 1);

  return (
    <ul className="space-y-3">
      {categories.map((category, index) => (
        <li key={category.category}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium text-slate-800">
              {category.label}
              {category.essential ? (
                <span className="ml-2 badge bg-slate-100 text-slate-600">esențial</span>
              ) : (
                <span className="ml-2 badge bg-amber-50 text-amber-700">opțional</span>
              )}
            </span>
            <span className="shrink-0 text-slate-600">
              {formatMoney(category.monthly, currency)}
              <span className="ml-2 text-xs text-slate-400">{formatPercent(category.shareOfIncome, 0)} din venit</span>
            </span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${BAR_COLORS[index % BAR_COLORS.length]}`}
              style={{ width: `${Math.max(2, (category.monthly / max) * 100)}%` }}
            />
          </div>
          {category.overBenchmark > 0 && (
            <p className="mt-1 text-xs text-amber-700">
              {formatMoney(category.overBenchmark, currency)} peste reperul uzual de{" "}
              {formatPercent(category.benchmarkMaxShare, 0)} din venit
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

export function SplitDonut({
  needs,
  wants,
  savings,
}: {
  needs: number;
  wants: number;
  savings: number;
}) {
  const total = Math.max(needs + wants + savings, 0.0001);
  const segments = [
    { label: "Nevoi + rate", value: needs / total, color: "#137f57", reference: "max. 50%" },
    { label: "Dorințe", value: wants / total, color: "#f59e0b", reference: "max. 30%" },
    { label: "Rămâne / economii", value: savings / total, color: "#0ea5e9", reference: "min. 20%" },
  ];

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="18" />
        {segments.map((segment) => {
          const length = segment.value * circumference;
          const dash = `${length} ${circumference - length}`;
          const element = (
            <circle
              key={segment.label}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="18"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          );
          offset += length;
          return element;
        })}
      </svg>

      <ul className="space-y-2 text-sm">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: segment.color }} />
            <span className="font-medium text-slate-800">{segment.label}</span>
            <span className="text-slate-600">{formatPercent(segment.value, 0)}</span>
            <span className="text-xs text-slate-400">reper {segment.reference}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PayoffCurve({
  series,
  currency,
}: {
  series: { label: string; color: string; points: { month: number; remaining: number }[] }[];
  currency: string;
}) {
  const allPoints = series.flatMap((s) => s.points);
  if (allPoints.length === 0) return null;

  const maxMonth = Math.max(...allPoints.map((p) => p.month), 1);
  const maxRemaining = Math.max(...allPoints.map((p) => p.remaining), 1);
  const width = 640;
  const height = 220;
  const padding = { top: 12, right: 12, bottom: 26, left: 56 };

  const x = (month: number) =>
    padding.left + (month / maxMonth) * (width - padding.left - padding.right);
  const y = (remaining: number) =>
    padding.top + (1 - remaining / maxRemaining) * (height - padding.top - padding.bottom);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Evoluția datoriei rămase">
        {[0, 0.25, 0.5, 0.75, 1].map((step) => (
          <g key={step}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y(maxRemaining * step)}
              y2={y(maxRemaining * step)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text x={4} y={y(maxRemaining * step) + 4} className="fill-slate-400 text-[10px]">
              {formatMoney(maxRemaining * step, currency)}
            </text>
          </g>
        ))}

        {series.map((line) => (
          <polyline
            key={line.label}
            fill="none"
            stroke={line.color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            points={line.points.map((point) => `${x(point.month)},${y(point.remaining)}`).join(" ")}
          />
        ))}

        <text x={padding.left} y={height - 8} className="fill-slate-400 text-[10px]">
          luna 0
        </text>
        <text x={width - padding.right - 44} y={height - 8} className="fill-slate-400 text-[10px]">
          luna {maxMonth}
        </text>
      </svg>

      <ul className="mt-3 flex flex-wrap gap-4 text-xs">
        {series.map((line) => (
          <li key={line.label} className="flex items-center gap-2 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: line.color }} />
            {line.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
