import { removeExpense } from "@/app/actions";
import { CategoryBars } from "@/components/charts";
import { ExpenseForm } from "@/components/forms/expense-form";
import { DeleteButton } from "@/components/ui";
import { categoryLabel } from "@/lib/finance/categories";
import { toMonthly } from "@/lib/finance/engine";
import { FREQUENCY_LABEL, formatDate, formatMoney } from "@/lib/format";
import { loadCurrentHousehold } from "@/lib/load";

export default async function ExpensesPage() {
  const { data, snapshot } = await loadCurrentHousehold();
  const currency = snapshot.currency;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Cheltuielile familiei</h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Poți adăuga cheltuieli lunare, săptămânale, anuale sau excepționale. Cele anuale și săptămânale sunt convertite
          automat la echivalentul lunar, ca să nu îți apară luni artificial de bune și luni catastrofale.
        </p>
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
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="card-title">Cheltuieli înregistrate</h2>
          <p className="text-sm text-slate-600">
            Total lunar: <strong className="text-slate-900">{formatMoney(snapshot.totalExpenses, currency)}</strong>
          </p>
        </div>

        {data.expenses.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Nicio cheltuială înregistrată încă.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-head">Denumire</th>
                  <th className="table-head">Categorie</th>
                  <th className="table-head">Sumă</th>
                  <th className="table-head">Frecvență</th>
                  <th className="table-head">Echivalent lunar</th>
                  <th className="table-head">Data</th>
                  <th className="table-head"></th>
                </tr>
              </thead>
              <tbody>
                {data.expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-slate-100 last:border-0">
                    <td className="table-cell font-medium text-slate-900">
                      {expense.label}
                      {!expense.essential && <span className="ml-2 badge bg-amber-50 text-amber-700">opțional</span>}
                    </td>
                    <td className="table-cell">{categoryLabel(expense.category)}</td>
                    <td className="table-cell">{formatMoney(expense.amount, currency)}</td>
                    <td className="table-cell">{FREQUENCY_LABEL[expense.frequency]}</td>
                    <td className="table-cell font-medium">
                      {expense.frequency === "one_off"
                        ? "-"
                        : formatMoney(toMonthly(expense.amount, expense.frequency), currency)}
                    </td>
                    <td className="table-cell text-xs text-slate-500">
                      {expense.frequency === "one_off" ? formatDate(expense.date) : "recurent"}
                    </td>
                    <td className="table-cell text-right">
                      <form action={removeExpense}>
                        <input type="hidden" name="id" value={expense.id} />
                        <DeleteButton />
                      </form>
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
