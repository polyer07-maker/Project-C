"use client";

import { GoalForm } from "@/components/forms/goal-form";
import { HouseholdForm } from "@/components/forms/household-form";
import { DeleteButton } from "@/components/ui";
import { formatMonths, monthsToReach } from "@/lib/finance/debt";
import { formatMoney } from "@/lib/format";
import { useBudget } from "@/lib/budget-store";

export default function GoalsPage() {
  const { state, data, snapshot, removeGoal } = useBudget();
  const currency = snapshot.currency;
  const monthlyForGoals = snapshot.savings.monthlyToGoals;
  const remainingTotal = data.goals.reduce((sum, g) => sum + Math.max(0, g.targetAmount - g.savedAmount), 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Obiective și familie</h1>
      </header>
      <section className="card">
        <h2 className="card-title mb-4">Datele gospodăriei</h2>
        <HouseholdForm household={state.household} />
      </section>
      <section className="card">
        <h2 className="card-title mb-4">Adaugă un obiectiv</h2>
        <GoalForm />
      </section>
      <section className="card">
        <h2 className="card-title">Obiective</h2>
        {data.goals.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Niciun obiectiv.</p>
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
                  <div className="flex justify-between gap-2">
                    <h3 className="font-medium">{goal.name}</h3>
                    <span className="text-sm text-slate-600">
                      {formatMoney(goal.savedAmount, currency)} / {formatMoney(goal.targetAmount, currency)}
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${progress * 100}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-slate-600">
                    <span>{remaining === 0 ? "Atins." : monthlyShare > 0 ? formatMonths(months) : "Fără alocare acum."}</span>
                    <DeleteButton onClick={() => removeGoal(goal.id)} />
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
