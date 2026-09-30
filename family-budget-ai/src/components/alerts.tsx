import type { Alert } from "@/lib/finance/types";

const STYLE: Record<Alert["level"], { wrapper: string; badge: string; label: string }> = {
  critical: {
    wrapper: "border-red-200 bg-red-50",
    badge: "bg-red-600 text-white",
    label: "Critic",
  },
  warning: {
    wrapper: "border-amber-200 bg-amber-50",
    badge: "bg-amber-500 text-white",
    label: "Atenție",
  },
  info: {
    wrapper: "border-slate-200 bg-slate-50",
    badge: "bg-slate-500 text-white",
    label: "Info",
  },
  good: {
    wrapper: "border-brand-200 bg-brand-50",
    badge: "bg-brand-600 text-white",
    label: "Bine",
  },
};

export function AlertList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;

  return (
    <ul className="space-y-3">
      {alerts.map((alert, index) => {
        const style = STYLE[alert.level];
        return (
          <li key={`${alert.title}-${index}`} className={`rounded-xl border p-4 ${style.wrapper}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${style.badge}`}>{style.label}</span>
              <h3 className="text-sm font-semibold text-slate-900">{alert.title}</h3>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{alert.detail}</p>
          </li>
        );
      })}
    </ul>
  );
}
