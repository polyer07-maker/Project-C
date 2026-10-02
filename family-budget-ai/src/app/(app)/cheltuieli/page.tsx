"use client";

import { CategoryBars } from "@/components/charts";
import { ExpenseForm } from "@/components/forms/expense-form";
import { DeleteButton } from "@/components/ui";
import { categoryLabel } from "@/lib/finance/categories";
import { toMonthly } from "@/lib/finance/engine";
import { FREQUENCY_LABEL, formatMoney } from "@/lib/format";
import { useBudget } from "@/lib/budget-store";

export default function ExpensesPage() {
  const { data, snapshot, removeExpense } = useBudget();
  const currency = snapshot.currency;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Cheltuielile familiei</h1>
        <p className="mt-1 text-sm text-slate-600">Lunare, săptămânale sau anuale — se convertesc automat la lună.</p>
      </header>
      <section className="card">
        <h2 className="card-title mb-4">Adaugă o cheltuială</h2>
        <ExpenseForm />
      </section>
      {snapshot.categories.length > 0 && (
        <section className="card">
          <h2 className="card-title mb-4">Distribuția pe categorii</h2>
          <CategoryBars categories={snapshot.categories} currency={currency} />
        </section>
      )}
      <section className="card">
        <h2 className="card-title">Cheltuieli înregistrate</h2>
        {data.expenses.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Nicio cheltuială încă.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-head">Denumire</th>
                  <th className="table-head">Categorie</th>
                  <th className="table-head">Sumă</th>
                  <th className="table-head">Frecvență</th>
                  <th className="table-head">Lunar</th>
                  <th className="table-head"></th>
                </tr>
              </thead>
              <tbody>
                {data.expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-slate-100">
                    <td className="table-cell font-medium">{expense.label}</td>
                    <td className="table-cell">{categoryLabel(expense.category)}</td>
                    <td className="table-cell">{formatMoney(expense.amount, currency)}</td>
                    <td className="table-cell">{FREQUENCY_LABEL[expense.frequency]}</td>
                    <td className="table-cell">
                      {expense.frequency === "one_off" ? "-" : formatMoney(toMonthly(expense.amount, expense.frequency), currency)}
                    </td>
                    <td className="table-cell text-right">
                      <DeleteButton onClick={() => removeExpense(expense.id)} />
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
