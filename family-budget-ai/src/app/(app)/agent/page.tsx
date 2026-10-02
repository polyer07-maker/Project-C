"use client";

import { AgentChat } from "@/components/agent-chat";
import { formatMoney, formatPercent } from "@/lib/format";
import { useBudget } from "@/lib/budget-store";

export default function AgentPage() {
  const { snapshot } = useBudget();
  const currency = snapshot.currency;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Agentul de buget</h1>
        <p className="mt-1 text-sm text-slate-600">Calculează pe loc, pe telefon, din datele tale. Fără cifre inventate.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <AgentChat />
        <aside className="card h-fit">
          <h2 className="card-title">Ce știe despre voi</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Venit" value={formatMoney(snapshot.totalIncome, currency)} />
            <Row label="Cheltuieli" value={formatMoney(snapshot.totalExpenses, currency)} />
            <Row label="Rămâne" value={formatMoney(snapshot.freeCashFlow, currency)} />
            <Row
              label="Economisire"
              value={formatMoney(snapshot.savings.monthlyToEmergencyFund + snapshot.savings.monthlyToGoals, currency)}
            />
            <Row label="Datorii" value={formatMoney(snapshot.debt.totalBalance, currency)} />
            <Row label="Rată realistă" value={formatPercent(snapshot.savings.realisticSavingsRate, 0)} />
          </dl>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-dashed border-slate-200 pb-1.5 last:border-0">
      <dt className="text-slate-600">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
