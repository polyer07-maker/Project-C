import { removeIncome } from "@/app/actions";
import { IncomeForm } from "@/components/forms/income-form";
import { DeleteButton } from "@/components/ui";
import { toMonthly } from "@/lib/finance/engine";
import { FREQUENCY_LABEL, INCOME_KIND_LABEL, formatMoney } from "@/lib/format";
import { loadCurrentHousehold } from "@/lib/load";

export default async function IncomesPage() {
  const { data, snapshot } = await loadCurrentHousehold();
  const currency = snapshot.currency;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Veniturile familiei</h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Introdu sumele nete, cele care intră efectiv în cont. Veniturile marcate ca variabile nu sunt folosite ca bază
          pentru planul de economisire, ci tratate ca bonus.
        </p>
      </header>

      <section className="card">
        <h2 className="card-title mb-4">Adaugă un venit</h2>
        <IncomeForm />
      </section>

      <section className="card">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="card-title">Venituri înregistrate</h2>
          <p className="text-sm text-slate-600">
            Total lunar: <strong className="text-slate-900">{formatMoney(snapshot.totalIncome, currency)}</strong>
          </p>
        </div>

        {data.incomes.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Niciun venit înregistrat încă.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-head">Denumire</th>
                  <th className="table-head">Persoană</th>
                  <th className="table-head">Tip</th>
                  <th className="table-head">Sumă</th>
                  <th className="table-head">Frecvență</th>
                  <th className="table-head">Echivalent lunar</th>
                  <th className="table-head"></th>
                </tr>
              </thead>
              <tbody>
                {data.incomes.map((income) => (
                  <tr key={income.id} className="border-b border-slate-100 last:border-0">
                    <td className="table-cell font-medium text-slate-900">
                      {income.label}
                      {income.stability === "variable" && (
                        <span className="ml-2 badge bg-amber-50 text-amber-700">variabil</span>
                      )}
                    </td>
                    <td className="table-cell">{income.memberName ?? "Familie"}</td>
                    <td className="table-cell">{INCOME_KIND_LABEL[income.kind] ?? income.kind}</td>
                    <td className="table-cell">{formatMoney(income.amount, currency)}</td>
                    <td className="table-cell">{FREQUENCY_LABEL[income.frequency]}</td>
                    <td className="table-cell font-medium">
                      {formatMoney(toMonthly(income.amount, income.frequency), currency)}
                    </td>
                    <td className="table-cell text-right">
                      <form action={removeIncome}>
                        <input type="hidden" name="id" value={income.id} />
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
