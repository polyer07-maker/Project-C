"use client";

import { useActionState, useState } from "react";
import { createExpense, type ActionState } from "@/app/actions";
import { SubmitButton } from "@/components/ui";
import { CATEGORIES } from "@/lib/finance/categories";

const initial: ActionState = { ok: false, message: "" };

export function ExpenseForm() {
  const [state, action] = useActionState(createExpense, initial);
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [frequency, setFrequency] = useState("monthly");
  const meta = CATEGORIES.find((c) => c.key === category) ?? CATEGORIES[0];

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="expense-label">
            Denumire
          </label>
          <input id="expense-label" name="label" className="input" placeholder="Rată ipotecă" required />
        </div>
        <div>
          <label className="label" htmlFor="expense-category">
            Categorie
          </label>
          <select
            id="expense-category"
            name="category"
            className="input"
            value={category}
            onChange={(event) => setCategory(event.target.value as typeof category)}
          >
            {CATEGORIES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">{meta.examples}</p>
        </div>
        <div>
          <label className="label" htmlFor="expense-amount">
            Sumă
          </label>
          <input
            id="expense-amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            className="input"
            placeholder="2450"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="expense-frequency">
            Frecvență
          </label>
          <select
            id="expense-frequency"
            name="frequency"
            className="input"
            value={frequency}
            onChange={(event) => setFrequency(event.target.value)}
          >
            <option value="monthly">lunar</option>
            <option value="weekly">săptămânal</option>
            <option value="yearly">anual</option>
            <option value="one_off">o singură dată</option>
          </select>
        </div>
        {frequency === "one_off" && (
          <div>
            <label className="label" htmlFor="expense-date">
              Data cheltuielii
            </label>
            <input
              id="expense-date"
              name="date"
              type="date"
              className="input"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>
        )}
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="essential"
              defaultChecked={meta.essentialByDefault}
              key={category}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            Cheltuială esențială (fără ea nu se poate)
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton>Adaugă cheltuiala</SubmitButton>
        {state.message && (
          <span className={`text-sm ${state.ok ? "text-brand-700" : "text-red-600"}`}>{state.message}</span>
        )}
      </div>
    </form>
  );
}
