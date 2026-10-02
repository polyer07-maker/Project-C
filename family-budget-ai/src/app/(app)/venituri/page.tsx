"use client";

import { IncomeForm } from "@/components/forms/income-form";
import { DeleteButton } from "@/components/ui";
import { toMonthly } from "@/lib/finance/engine";
import { FREQUENCY_LABEL, INCOME_KIND_LABEL, formatMoney } from "@/lib/format";
import { useBudget } from "@/lib/budget-store";

export default function IncomesPage() {
  const { data, snapshot, removeIncome } = useBudget();
  const currency = snapshot.currency;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Veniturile familiei</h1>
        <p className="mt-1 text-sm text-slate-600">Introdu sumele nete, cele care intră efectiv în cont.</p>
      </header>
      <section className="card">
        <h2 className="card-title mb-4">Adaugă un venit</h2>
        <IncomeForm />
      </section>
      <section className="card">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="card-title">Venituri înregistrate</h2>
          <p className="text-sm text-slate-600">
            Total lunar: <strong>{formatMoney(snapshot.totalIncome, currency)}</strong>
          </p>
        </div>
        {data.incomes.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Niciun venit încă.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-head">Denumire</th>
                  <th className="table-head">Persoană</th>
                  <th className="table-head">Tip</th>
                  <th className="table-head">Sumă</th>
                  <th className="table-head">Lunar</th>
                  <th className="table-head"></th>
                </tr>
              </thead>
              <tbody>
                {data.incomes.map((income) => (
                  <tr key={income.id} className="border-b border-slate-100">
                    <td className="table-cell font-medium">{income.label}</td>
                    <td className="table-cell">{income.memberName ?? "Familie"}</td>
                    <td className="table-cell">{INCOME_KIND_LABEL[income.kind] ?? income.kind}</td>
                    <td className="table-cell">{formatMoney(income.amount, currency)}</td>
                    <td className="table-cell">{formatMoney(toMonthly(income.amount, income.frequency), currency)}</td>
                    <td className="table-cell text-right">
                      <DeleteButton onClick={() => removeIncome(income.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
