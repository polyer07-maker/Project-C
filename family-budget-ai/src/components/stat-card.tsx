export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative" | "brand";
}) {
  const valueTone = {
    neutral: "text-slate-900",
    positive: "text-brand-700",
    negative: "text-red-600",
    brand: "text-brand-700",
  }[tone];

  return (
    <div className="card">
      <p className="card-title">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${valueTone}`}>{value}</p>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{hint}</p>}
    </div>
  );
}
