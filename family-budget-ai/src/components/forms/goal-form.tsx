"use client";

import { useActionState } from "react";
import { createGoal, type ActionState } from "@/app/actions";
import { SubmitButton } from "@/components/ui";

const initial: ActionState = { ok: false, message: "" };

export function GoalForm() {
  const [state, action] = useActionState(createGoal, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="goal-name">
            Obiectiv
          </label>
          <input id="goal-name" name="name" className="input" placeholder="Vacanță de vară" required />
        </div>
        <div>
          <label className="label" htmlFor="goal-target">
            Sumă necesară
          </label>
          <input
            id="goal-target"
            name="targetAmount"
            type="number"
            min="0"
            step="0.01"
            className="input"
            placeholder="6000"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="goal-saved">
            Strâns până acum
          </label>
          <input
            id="goal-saved"
            name="savedAmount"
            type="number"
            min="0"
            step="0.01"
            className="input"
            defaultValue={0}
          />
        </div>
        <div>
          <label className="label" htmlFor="goal-deadline">
            Termen (opțional)
          </label>
          <input id="goal-deadline" name="deadline" type="date" className="input" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton>Adaugă obiectivul</SubmitButton>
        {state.message && (
          <span className={`text-sm ${state.ok ? "text-brand-700" : "text-red-600"}`}>{state.message}</span>
        )}
      </div>
    </form>
  );
}
