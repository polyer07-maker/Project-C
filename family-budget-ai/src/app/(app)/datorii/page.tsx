"use client";

import Link from "next/link";
import { DebtForm } from "@/components/forms/debt-form";
import { StatCard } from "@/components/stat-card";
import { DeleteButton } from "@/components/ui";
import { formatMonths } from "@/lib/finance/debt";
import { DEBT_KIND_LABEL, formatMoney, formatPercent } from "@/lib/format";
import { useBudget } from "@/lib/budget-store";

export default function DebtsPage() {
  const { data, snapshot, removeDebt } = useBudget();
  const currency = snapshot.currency;
  const payoff = snapshot.payoff;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Datoriile familiei</h1>
        <p className="mt-1 text-sm text-slate-600">Sold, dobândă anuală și plata minimă. Extra-ul merge la dobânda cea mai mare.</p>
      </header>
      <section className="card">
        <h2 className="card-title mb-4">Adaugă o datorie</h2>
        <DebtForm />
      </section>
      {data.debts.length > 0 && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Sold total" value={formatMoney(snapshot.debt.totalBalance, currency)} />
            <StatCard label="Rate minime" value={formatMoney(snapshot.debt.totalMinPayment, currency)} />
            <StatCard label="Dobândă medie" value={formatPercent(snapshot.debt.weightedAnnualRate)} />
            <StatCard label="Plată extra posibilă" value={formatMoney(snapshot.savings.monthlyExtraToDebt, currency)} tone="brand" />
          </section>
          <section className="card">
            <h2 className="card-title">Datorii înregistrate</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="table-head">Nume</th>
                    <th className="table-head">Tip</th>
                    <th className="table-head">Sold</th>
                    <th className="table-head">Dobândă</th>
                    <th className="table-head">Minim</th>
                    <th className="table-head"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.debts.map((debt) => (
                    <tr key={debt.id} className="border-b border-slate-100">
                      <td className="table-cell font-medium">{debt.name}</td>
                      <td className="table-cell">{DEBT_KIND_LABEL[debt.kind] ?? debt.kind}</td>
                      <td className="table-cell">{formatMoney(debt.balance, currency)}</td>
                      <td className="table-cell">{formatPercent(debt.annualRate)}</td>
                      <td className="table-cell">{formatMoney(debt.minPayment, currency)}</td>
                      <td className="table-cell text-right">
                        <DeleteButton onClick={() => removeDebt(debt.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {payoff && (
              <p className="mt-4 text-xs text-slate-500">
                Avalanșă: {formatMonths(payoff.avalanche.months)}. Extra către {payoff.avalanche.extraTarget}.{" "}
                <Link href="/analiza" className="font-medium text-brand-700">
                  Simularea completă
                </Link>
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
