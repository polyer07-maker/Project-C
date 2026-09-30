import Link from "next/link";
import { AlertList } from "@/components/alerts";
import { CategoryBars, PayoffCurve, SplitDonut } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { formatMonths } from "@/lib/finance/debt";
import { buildActionPlan } from "@/lib/finance/plan";
import { formatMoney, formatPercent } from "@/lib/format";
import { loadCurrentHousehold } from "@/lib/load";

export default async function AnalysisPage() {
  const { snapshot } = await loadCurrentHousehold();
  const currency = snapshot.currency;
  const plan = buildActionPlan(snapshot);
  const payoff = snapshot.payoff;
  const cutsTotal = snapshot.cuts.reduce((sum, cut) => sum + cut.monthlySaving, 0);

  if (!snapshot.dataQuality.hasIncome) {
    return (
      <div className="card mx-auto max-w-xl text-center">
        <h1 className="text-xl font-semibold text-slate-900">Nu pot face analiza fără venituri</h1>
        <p className="mt-2 text-sm text-slate-600">
          Adaugă întâi veniturile nete ale familiei. Prefer să nu îți arăt nimic decât să îți arăt cifre inventate.
        </p>
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
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Toate cifrele de mai jos sunt calculate din datele introduse de tine. Nicio valoare nu este estimată de un
          model de limbaj.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Rămâne după toate plățile"
          value={formatMoney(snapshot.freeCashFlow, currency)}
          hint={`${formatPercent(snapshot.savingsRate)} din venitul net`}
          tone={snapshot.freeCashFlow >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Economisire realistă"
          value={formatMoney(snapshot.savings.monthlyToEmergencyFund + snapshot.savings.monthlyToGoals, currency)}
          hint={`${formatPercent(snapshot.savings.realisticSavingsRate)} din venit, susținut lunar`}
          tone="brand"
        />
        <StatCard
          label="Fond de urgență"
          value={`${snapshot.savings.emergencyFundMonthsCovered.toFixed(1)} luni`}
          hint={`${formatMoney(snapshot.savings.emergencyFundCurrent, currency)} din ținta de ${formatMoney(snapshot.savings.emergencyFundTarget, currency)}`}
          tone={snapshot.savings.emergencyFundMonthsCovered >= 3 ? "positive" : "negative"}
        />
        <StatCard
          label="Reduceri realiste identificate"
          value={formatMoney(cutsTotal, currency)}
          hint={cutsTotal > 0 ? `${formatMoney(cutsTotal * 12, currency)} pe an` : "nicio categorie peste repere"}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Planul, în ordinea în care are sens</h2>
        <ol className="space-y-3">
          {plan.map((step) => (
            <li key={step.order} className="card flex gap-4">
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                  step.status === "urgent"
                    ? "bg-red-100 text-red-700"
                    : step.status === "done"
                      ? "bg-brand-100 text-brand-700"
                      : step.status === "next"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-slate-100 text-slate-600"
                }`}
              >
                {step.order}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="font-medium text-slate-900">{step.title}</h3>
                  <span className="text-xs text-slate-500">{step.horizon}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Atenționări</h2>
        <AlertList alerts={snapshot.alerts} />
      </section>

      {payoff && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Scăparea de datorii, simulată lună cu lună</h2>

          <div className="grid gap-4 lg:grid-cols-3">
            <ScenarioCard
              title="Doar plăți minime"
              months={formatMonths(payoff.minimum.months)}
              interest={formatMoney(payoff.minimum.totalInterest, currency)}
              payment={formatMoney(payoff.minimum.monthlyPayment, currency)}
              note={payoff.minimum.note}
            />
            <ScenarioCard
              title="Avalanșă (dobânda cea mai mare prima)"
              months={formatMonths(payoff.avalanche.months)}
              interest={formatMoney(payoff.avalanche.totalInterest, currency)}
              payment={formatMoney(payoff.avalanche.monthlyPayment, currency)}
              note={payoff.avalanche.note}
              highlight
            />
            <ScenarioCard
              title="Bulgăre de zăpadă (cea mai mică datorie prima)"
              months={formatMonths(payoff.snowball.months)}
              interest={formatMoney(payoff.snowball.totalInterest, currency)}
              payment={formatMoney(payoff.snowball.monthlyPayment, currency)}
              note={payoff.snowball.note}
            />
          </div>

          <div className="card">
            <h3 className="card-title mb-4">Cum scade soldul total</h3>
            <PayoffCurve
              currency={currency}
              series={[
                {
                  label: "Doar plăți minime",
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
                {
                  label: "Bulgăre de zăpadă",
                  color: "#0ea5e9",
                  points: [
                    { month: 0, remaining: snapshot.debt.totalBalance },
                    ...payoff.snowball.timeline.map((step) => ({ month: step.month, remaining: step.remaining })),
                  ],
                },
              ]}
            />
            {payoff.avalanche.feasible && (
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Cu {formatMoney(snapshot.savings.monthlyExtraToDebt, currency)} în plus pe lună, avalanșa te scapă de
                datorii în {formatMonths(payoff.avalanche.months)} și economisești{" "}
                <strong>
                  {formatMoney(payoff.minimum.totalInterest - payoff.avalanche.totalInterest, currency)}
                </strong>{" "}
                din dobândă față de plata minimă. Ordinea: {payoff.avalanche.order.map((o) => o.name).join(" → ")}.
              </p>
            )}
          </div>
        </section>
      )}

      {snapshot.cuts.length > 0 && (
        <section className="card">
          <h2 className="card-title">Reduceri realiste, nu radicale</h2>
          <p className="mt-2 text-sm text-slate-600">
            Fiecare sugestie este plafonată la cât se poate tăia rezonabil din categoria respectivă. Nu îți propun să
            elimini complet o categorie, pentru că astfel de planuri se abandonează.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-head">Categorie</th>
                  <th className="table-head">Acum</th>
                  <th className="table-head">Propus</th>
                  <th className="table-head">Economie / lună</th>
                  <th className="table-head">De ce</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.cuts.map((cut) => (
                  <tr key={cut.category} className="border-b border-slate-100 last:border-0">
                    <td className="table-cell font-medium text-slate-900">{cut.label}</td>
                    <td className="table-cell">{formatMoney(cut.currentMonthly, currency)}</td>
                    <td className="table-cell">{formatMoney(cut.suggestedMonthly, currency)}</td>
                    <td className="table-cell font-semibold text-brand-700">
                      {formatMoney(cut.monthlySaving, currency)}
                    </td>
                    <td className="table-cell text-xs leading-relaxed text-slate-600">{cut.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card">
          <h2 className="card-title mb-4">Toate categoriile</h2>
          <CategoryBars categories={snapshot.categories} currency={currency} />
        </div>
        <div className="space-y-6">
          <div className="card">
            <h2 className="card-title mb-4">Nevoi / dorințe / economii</h2>
            <SplitDonut needs={snapshot.needsShare} wants={snapshot.wantsShare} savings={snapshot.savingsShare} />
          </div>
          <div className="card">
            <h2 className="card-title">Cum am împărțit surplusul</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              {snapshot.savings.rationale.map((line, index) => (
                <li key={index} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function ScenarioCard({
  title,
  months,
  interest,
  payment,
  note,
  highlight = false,
}: {
  title: string;
  months: string;
  interest: string;
  payment: string;
  note: string | null;
  highlight?: boolean;
}) {
  return (
    <div className={`card ${highlight ? "border-brand-300 ring-1 ring-brand-100" : ""}`}>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{months}</p>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-600">Dobândă totală plătită</dt>
          <dd className="font-medium text-slate-900">{interest}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-600">Plată lunară</dt>
          <dd className="font-medium text-slate-900">{payment}</dd>
        </div>
      </dl>
      {note && <p className="mt-3 text-xs leading-relaxed text-red-700">{note}</p>}
    </div>
  );
}
