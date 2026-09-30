import Link from "next/link";
import { loadExampleData } from "@/app/actions";
import { AlertList } from "@/components/alerts";
import { CategoryBars, SplitDonut } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { SubmitButton } from "@/components/ui";
import { formatMoney, formatPercent } from "@/lib/format";
import { buildActionPlan } from "@/lib/finance/plan";
import { loadCurrentHousehold } from "@/lib/load";

export default async function DashboardPage() {
  const { snapshot } = await loadCurrentHousehold();
  const currency = snapshot.currency;
  const plan = buildActionPlan(snapshot);
  const isEmpty = !snapshot.dataQuality.hasIncome && !snapshot.dataQuality.hasExpenses;

  if (isEmpty) {
    return (
      <div className="card mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Hai să pornim bugetul familiei</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Ca să pot calcula ceva real, am nevoie de două lucruri: veniturile nete lunare și cheltuielile. Durează câteva
          minute și poți completa pe rând.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/venituri" className="btn-primary">
            Adaugă primul venit
          </Link>
          <Link href="/cheltuieli" className="btn-ghost">
            Adaugă cheltuieli
          </Link>
        </div>
        <form action={loadExampleData} className="mt-8 border-t border-slate-200 pt-6">
          <p className="text-xs text-slate-500">
            Vrei să vezi mai întâi cum arată? Încarcă datele unei familii de exemplu cu două salarii, doi copii și trei
            datorii.
          </p>
          <div className="mt-3">
            <SubmitButton className="btn-ghost" pendingLabel="Se încarcă...">
              Încarcă date de exemplu
            </SubmitButton>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Panoul familiei</h1>
          <p className="mt-1 text-sm text-slate-600">
            Lună de referință {snapshot.month} · {snapshot.people}{" "}
            {snapshot.people === 1 ? "persoană" : "persoane"} în gospodărie
          </p>
        </div>
        <Link href="/agent" className="btn-primary">
          Întreabă agentul
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Venit lunar"
          value={formatMoney(snapshot.totalIncome, currency)}
          hint={
            snapshot.variableIncome > 0
              ? `${formatMoney(snapshot.stableIncome, currency)} stabil, ${formatMoney(snapshot.variableIncome, currency)} variabil`
              : "integral venit stabil"
          }
        />
        <StatCard
          label="Cheltuieli lunare"
          value={formatMoney(snapshot.totalExpenses, currency)}
          hint={`${formatMoney(snapshot.essentialExpenses, currency)} esențiale · ${formatMoney(snapshot.nonEssentialExpenses, currency)} opționale`}
        />
        <StatCard
          label="Rate minime datorii"
          value={formatMoney(snapshot.minimumDebtPayments, currency)}
          hint={
            snapshot.debt.totalBalance > 0
              ? `Sold total ${formatMoney(snapshot.debt.totalBalance, currency)} · grad de îndatorare ${formatPercent(snapshot.debt.debtToIncomeRatio, 0)}`
              : "nicio datorie înregistrată"
          }
          tone={snapshot.debt.debtToIncomeRatio > 0.3 ? "negative" : "neutral"}
        />
        <StatCard
          label="Îți rămâne lunar"
          value={formatMoney(snapshot.freeCashFlow, currency)}
          hint={
            snapshot.freeCashFlow >= 0
              ? `${formatPercent(snapshot.savingsRate)} din venit, bani reali după toate plățile`
              : "buget pe minus: diferența se acoperă din economii sau credit"
          }
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
            <Row
              label="Fond de urgență"
              value={formatMoney(snapshot.savings.monthlyToEmergencyFund, currency)}
            />
            <Row
              label="Plăți suplimentare la datorii"
              value={formatMoney(snapshot.savings.monthlyExtraToDebt, currency)}
            />
            <Row label="Obiectivele familiei" value={formatMoney(snapshot.savings.monthlyToGoals, currency)} />
            <Row
              label="Tampon nealocat (intenționat)"
              value={formatMoney(snapshot.savings.monthlyBuffer, currency)}
            />
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">{snapshot.savings.rationale[0]}</p>
        </div>

        <div className="card">
          <h2 className="card-title">Cum se împarte venitul</h2>
          <div className="mt-4">
            <SplitDonut
              needs={snapshot.needsShare}
              wants={snapshot.wantsShare}
              savings={snapshot.savingsShare}
            />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Reperul 50/30/20 este o orientare, nu o regulă. Ce contează este direcția în care se mișcă procentele de la
            o lună la alta.
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Ce trebuie să știi acum</h2>
        <AlertList alerts={snapshot.alerts} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card">
          <h2 className="card-title">Unde se duc banii</h2>
          <div className="mt-4">
            <CategoryBars categories={snapshot.categories.slice(0, 8)} currency={currency} />
          </div>
          {snapshot.categories.length > 8 && (
            <Link href="/analiza" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">
              Vezi toate categoriile în analiză →
            </Link>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Următorii pași</h2>
          <ol className="mt-4 space-y-3">
            {plan.slice(0, 4).map((step) => (
              <li key={step.order} className="flex gap-3">
                <span
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                    step.status === "urgent"
                      ? "bg-red-100 text-red-700"
                      : step.status === "done"
                        ? "bg-brand-100 text-brand-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {step.order}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{step.title}</p>
                  <p className="text-xs leading-relaxed text-slate-600">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/analiza" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">
            Planul complet și simularea datoriilor →
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
