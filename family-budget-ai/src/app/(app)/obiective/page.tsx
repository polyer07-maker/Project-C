import { removeGoal } from "@/app/actions";
import { GoalForm } from "@/components/forms/goal-form";
import { HouseholdForm } from "@/components/forms/household-form";
import { DeleteButton } from "@/components/ui";
import { formatMonths, monthsToReach } from "@/lib/finance/debt";
import { formatDate, formatMoney } from "@/lib/format";
import { loadCurrentHousehold } from "@/lib/load";

export default async function GoalsPage() {
  const { household, data, snapshot } = await loadCurrentHousehold();
  const currency = snapshot.currency;
  const monthlyForGoals = snapshot.savings.monthlyToGoals;
  const remainingTotal = data.goals.reduce((sum, g) => sum + Math.max(0, g.targetAmount - g.savedAmount), 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Obiective și date despre familie</h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Obiectivele sunt finanțate din ce rămâne după fondul de urgență și plățile suplimentare la datorii. Termenele
          afișate sunt calculate la suma care rămâne efectiv disponibilă, nu la cât ți-ai dori.
        </p>
      </header>

      <section className="card">
        <h2 className="card-title mb-4">Datele gospodăriei</h2>
        <HouseholdForm household={household} />
      </section>

      <section className="card">
        <h2 className="card-title mb-4">Adaugă un obiectiv</h2>
        <GoalForm />
      </section>

      <section className="card">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="card-title">Obiective</h2>
          <p className="text-sm text-slate-600">
            Disponibil lunar pentru obiective:{" "}
            <strong className="text-slate-900">{formatMoney(monthlyForGoals, currency)}</strong>
          </p>
        </div>

        {data.goals.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Niciun obiectiv adăugat.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {data.goals.map((goal) => {
              const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
              const progress = goal.targetAmount > 0 ? Math.min(1, goal.savedAmount / goal.targetAmount) : 0;
              const share = remainingTotal > 0 ? remaining / remainingTotal : 0;
              const monthlyShare = monthlyForGoals * share;
              const months = monthsToReach(goal.targetAmount, monthlyShare, goal.savedAmount);

              return (
                <li key={goal.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-medium text-slate-900">{goal.name}</h3>
                    <span className="text-sm text-slate-600">
                      {formatMoney(goal.savedAmount, currency)} / {formatMoney(goal.targetAmount, currency)}
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${progress * 100}%` }} />
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <span>
                      {remaining === 0
                        ? "Obiectiv atins."
                        : monthlyShare > 0
                          ? `La ${formatMoney(monthlyShare, currency)} pe lună (partea proporțională din suma disponibilă): ${formatMonths(months)}.`
                          : "Bugetul actual nu permite nicio alocare pentru acest obiectiv. Apare imediat ce se eliberează bani."}
                    </span>
                    <span className="flex items-center gap-3">
                      {goal.deadline && <span>termen {formatDate(goal.deadline)}</span>}
                      <form action={removeGoal}>
                        <input type="hidden" name="id" value={goal.id} />
                        <DeleteButton />
                      </form>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
