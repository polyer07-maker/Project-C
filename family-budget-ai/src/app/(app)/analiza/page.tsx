"use client";

import Link from "next/link";
import { AlertList } from "@/components/alerts";
import { CategoryBars, PayoffCurve, SplitDonut } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { formatMonths } from "@/lib/finance/debt";
import { buildActionPlan } from "@/lib/finance/plan";
import { formatMoney, formatPercent } from "@/lib/format";
import { useBudget } from "@/lib/budget-store";

export default function AnalysisPage() {
  const { snapshot } = useBudget();
  const currency = snapshot.currency;
  const plan = buildActionPlan(snapshot);
  const payoff = snapshot.payoff;
  const cutsTotal = snapshot.cuts.reduce((sum, cut) => sum + cut.monthlySaving, 0);

  if (!snapshot.dataQuality.hasIncome) {
    return (
      <div className="card mx-auto max-w-xl text-center">
        <h1 className="text-xl font-semibold">Nu pot face analiza fără venituri</h1>
        <Link href="/venituri" className="btn-primary mt-5">
          Adaugă venituri
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Analiza financiară</h1>
        <p className="mt-1 text-sm text-slate-600">Toate cifrele sunt calculate din datele de pe acest telefon.</p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Rămâne după plăți"
          value={formatMoney(snapshot.freeCashFlow, currency)}
          tone={snapshot.freeCashFlow >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Economisire realistă"
          value={formatMoney(snapshot.savings.monthlyToEmergencyFund + snapshot.savings.monthlyToGoals, currency)}
          tone="brand"
        />
        <StatCard label="Fond de urgență" value={`${snapshot.savings.emergencyFundMonthsCovered.toFixed(1)} luni`} />
        <StatCard label="Reduceri posibile" value={formatMoney(cutsTotal, currency)} />
      </section>
      <ol className="space-y-3">
        {plan.map((step) => (
          <li key={step.order} className="card flex gap-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold">
              {step.order}
            </span>
            <div>
              <h3 className="font-medium text-slate-900">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <AlertList alerts={snapshot.alerts} />
      {payoff && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Scăparea de datorii</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card">
              <p className="text-sm font-semibold">Doar minime</p>
              <p className="mt-2 text-2xl font-semibold">{formatMonths(payoff.minimum.months)}</p>
              <p className="mt-1 text-sm text-slate-600">Dobândă {formatMoney(payoff.minimum.totalInterest, currency)}</p>
            </div>
            <div className="card border-brand-300">
              <p className="text-sm font-semibold">Avalanșă</p>
              <p className="mt-2 text-2xl font-semibold">{formatMonths(payoff.avalanche.months)}</p>
              <p className="mt-1 text-sm text-slate-600">Dobândă {formatMoney(payoff.avalanche.totalInterest, currency)}</p>
            </div>
            <div className="card">
              <p className="text-sm font-semibold">Bulgăre de zăpadă</p>
              <p className="mt-2 text-2xl font-semibold">{formatMonths(payoff.snowball.months)}</p>
              <p className="mt-1 text-sm text-slate-600">Dobândă {formatMoney(payoff.snowball.totalInterest, currency)}</p>
            </div>
          </div>
          <div className="card">
            <PayoffCurve
              currency={currency}
              series={[
                {
                  label: "Minime",
                  color: "#94a3b8",
                  points: [
                    { month: 0, remaining: snapshot.debt.totalBalance },
                    ...payoff.minimum.timeline.map((step) => ({ month: step.month, remaining: step.remaining })),
                  ],
                },
                {
                  label: "Avalanșă",
                  color: "#137f57",
                  points: [
                    { month: 0, remaining: snapshot.debt.totalBalance },
                    ...payoff.avalanche.timeline.map((step) => ({ month: step.month, remaining: step.remaining })),
                  ],
                },
              ]}
            />
          </div>
        </section>
      )}
      <div className="card">
        <h2 className="card-title mb-4">Categorii</h2>
        <CategoryBars categories={snapshot.categories} currency={currency} />
      </div>
      <div className="card">
        <SplitDonut needs={snapshot.needsShare} wants={snapshot.wantsShare} savings={snapshot.savingsShare} />
        <p className="mt-2 text-xs text-slate-500">{formatPercent(snapshot.savingsRate)} din venit rămâne.</p>
      </div>
    </div>
  );
}
