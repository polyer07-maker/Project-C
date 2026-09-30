import Link from "next/link";
import { removeDebt } from "@/app/actions";
import { DebtForm } from "@/components/forms/debt-form";
import { StatCard } from "@/components/stat-card";
import { DeleteButton } from "@/components/ui";
import { formatMonths } from "@/lib/finance/debt";
import { DEBT_KIND_LABEL, formatMoney, formatPercent } from "@/lib/format";
import { loadCurrentHousehold } from "@/lib/load";

export default async function DebtsPage() {
  const { data, snapshot } = await loadCurrentHousehold();
  const currency = snapshot.currency;
  const payoff = snapshot.payoff;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Datoriile familiei</h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Adaugă fiecare datorie cu soldul rămas, dobânda anuală și plata minimă. Pe baza lor simulez rambursarea lună cu
          lună, inclusiv cazurile în care plata minimă nu acoperă dobânda.
        </p>
      </header>

      <section className="card">
        <h2 className="card-title mb-4">Adaugă o datorie</h2>
        <DebtForm />
      </section>

      {data.debts.length > 0 && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Sold total" value={formatMoney(snapshot.debt.totalBalance, currency)} />
            <StatCard
              label="Rate minime lunare"
              value={formatMoney(snapshot.debt.totalMinPayment, currency)}
              hint={`grad de îndatorare ${formatPercent(snapshot.debt.debtToIncomeRatio, 0)}`}
              tone={snapshot.debt.debtToIncomeRatio > 0.3 ? "negative" : "neutral"}
            />
            <StatCard
              label="Dobândă medie"
              value={formatPercent(snapshot.debt.weightedAnnualRate)}
              hint={`te costă ${formatMoney(snapshot.debt.monthlyInterestCost, currency)} pe lună`}
            />
            <StatCard
              label="Plată extra posibilă"
              value={formatMoney(snapshot.savings.monthlyExtraToDebt, currency)}
              hint="cât permite bugetul tău, peste ratele minime"
              tone="brand"
            />
          </section>

          <section className="card">
            <h2 className="card-title">Datorii înregistrate</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="table-head">Nume</th>
                    <th className="table-head">Tip</th>
                    <th className="table-head">Sold</th>
                    <th className="table-head">Dobândă / an</th>
                    <th className="table-head">Plată minimă</th>
                    <th className="table-head">Dobândă / lună</th>
                    <th className="table-head">Se stinge în</th>
                    <th className="table-head"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.debts.map((debt) => {
                    const monthlyInterest = (debt.balance * debt.annualRate) / 12;
                    const paidOff = payoff?.avalanche.order.find((o) => o.name === debt.name)?.paidOffInMonth ?? null;
                    const stuck = snapshot.debt.unsustainable.includes(debt.name);
                    return (
                      <tr key={debt.id} className="border-b border-slate-100 last:border-0">
                        <td className="table-cell font-medium text-slate-900">
                          {debt.name}
                          {stuck && <span className="ml-2 badge bg-red-100 text-red-700">nu scade</span>}
                        </td>
                        <td className="table-cell">{DEBT_KIND_LABEL[debt.kind] ?? debt.kind}</td>
                        <td className="table-cell">{formatMoney(debt.balance, currency)}</td>
                        <td className="table-cell">{formatPercent(debt.annualRate)}</td>
                        <td className="table-cell">{formatMoney(debt.minPayment, currency)}</td>
                        <td className="table-cell">{formatMoney(monthlyInterest, currency)}</td>
                        <td className="table-cell text-xs text-slate-600">
                          {paidOff ? `luna ${paidOff}` : "—"}
                        </td>
                        <td className="table-cell text-right">
                          <form action={removeDebt}>
                            <input type="hidden" name="id" value={debt.id} />
                            <DeleteButton />
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {payoff && (
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                Coloana „se stinge în” folosește metoda avalanșă cu plata extra de{" "}
                {formatMoney(snapshot.savings.monthlyExtraToDebt, currency)} pe lună, adică exact cât permite bugetul
                actual. Termenul total: {formatMonths(payoff.avalanche.months)}.{" "}
                <Link href="/analiza" className="font-medium text-brand-700 hover:underline">
                  Vezi simularea completă
                </Link>
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
