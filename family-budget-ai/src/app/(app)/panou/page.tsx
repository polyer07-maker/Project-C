"use client";

import Link from "next/link";
import { AlertList } from "@/components/alerts";
import { CategoryBars, SplitDonut } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { formatMoney, formatPercent } from "@/lib/format";
import { buildActionPlan } from "@/lib/finance/plan";
import { useBudget } from "@/lib/budget-store";

export default function DashboardPage() {
  const { snapshot, loadDemo } = useBudget();
  const currency = snapshot.currency;
  const plan = buildActionPlan(snapshot);
  const isEmpty = !snapshot.dataQuality.hasIncome && !snapshot.dataQuality.hasExpenses;

  if (isEmpty) {
    return (
      <div className="card mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Hai să pornim bugetul familiei</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Ca să calculez ceva real, am nevoie de veniturile nete lunare și de cheltuieli.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/venituri" className="btn-primary">
            Adaugă primul venit
          </Link>
          <Link href="/cheltuieli" className="btn-ghost">
            Adaugă cheltuieli
          </Link>
        </div>
        <div className="mt-8 border-t border-slate-200 pt-6">
          <p className="text-xs text-slate-500">Vrei să vezi mai întâi cum arată? Încarcă o familie de exemplu.</p>
          <button type="button" className="btn-ghost mt-3" onClick={loadDemo}>
            Încarcă date de exemplu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Panoul familiei</h1>
          <p className="mt-1 text-sm text-slate-600">
            Lună {snapshot.month} · {snapshot.people} {snapshot.people === 1 ? "persoană" : "persoane"}
          </p>
        </div>
        <Link href="/agent" className="btn-primary">
          Întreabă agentul
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Venit lunar" value={formatMoney(snapshot.totalIncome, currency)} />
        <StatCard
          label="Cheltuieli lunare"
          value={formatMoney(snapshot.totalExpenses, currency)}
          hint={`${formatMoney(snapshot.essentialExpenses, currency)} esențiale`}
        />
        <StatCard
          label="Rate minime"
          value={formatMoney(snapshot.minimumDebtPayments, currency)}
          tone={snapshot.debt.debtToIncomeRatio > 0.3 ? "negative" : "neutral"}
        />
        <StatCard
          label="Îți rămâne lunar"
          value={formatMoney(snapshot.freeCashFlow, currency)}
          tone={snapshot.freeCashFlow >= 0 ? "positive" : "negative"}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="card-title">Cât poți economisi realist</h2>
          <p className="mt-2 text-3xl font-semibold text-brand-700">
            {formatMoney(snapshot.savings.monthlyToEmergencyFund + snapshot.savings.monthlyToGoals, currency)}
            <span className="ml-2 text-sm font-normal text-slate-500">pe lună</span>
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Fond de urgență" value={formatMoney(snapshot.savings.monthlyToEmergencyFund, currency)} />
            <Row label="Plăți extra la datorii" value={formatMoney(snapshot.savings.monthlyExtraToDebt, currency)} />
            <Row label="Obiective" value={formatMoney(snapshot.savings.monthlyToGoals, currency)} />
            <Row label="Tampon nealocat" value={formatMoney(snapshot.savings.monthlyBuffer, currency)} />
          </dl>
        </div>
        <div className="card">
          <h2 className="card-title">Cum se împarte venitul</h2>
          <div className="mt-4">
            <SplitDonut needs={snapshot.needsShare} wants={snapshot.wantsShare} savings={snapshot.savingsShare} />
          </div>
        </div>
      </section>

      <AlertList alerts={snapshot.alerts} />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card">
          <h2 className="card-title">Unde se duc banii</h2>
          <div className="mt-4">
            <CategoryBars categories={snapshot.categories.slice(0, 8)} currency={currency} />
          </div>
        </div>
        <div className="card">
          <h2 className="card-title">Următorii pași</h2>
          <ol className="mt-4 space-y-3">
            {plan.slice(0, 4).map((step) => (
              <li key={step.order} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold">
                  {step.order}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{step.title}</p>
                  <p className="text-xs leading-relaxed text-slate-600">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/analiza" className="mt-4 inline-block text-sm font-medium text-brand-700">
            Planul complet →
          </Link>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-slate-200 pb-1.5 last:border-0">
      <dt className="text-slate-600">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
