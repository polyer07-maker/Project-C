"use client";

import { useActionState } from "react";
import { createDebt, type ActionState } from "@/app/actions";
import { SubmitButton } from "@/components/ui";
import { DEBT_KIND_LABEL } from "@/lib/format";

const initial: ActionState = { ok: false, message: "" };

export function DebtForm() {
  const [state, action] = useActionState(createDebt, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="debt-name">
            Nume datorie
          </label>
          <input id="debt-name" name="name" className="input" placeholder="Card de credit" required />
        </div>
        <div>
          <label className="label" htmlFor="debt-kind">
            Tip
          </label>
          <select id="debt-kind" name="kind" className="input" defaultValue="credit_card">
            {Object.entries(DEBT_KIND_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="debt-balance">
            Sold rămas
          </label>
          <input
            id="debt-balance"
            name="balance"
            type="number"
            min="0"
            step="0.01"
            className="input"
            placeholder="9800"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="debt-rate">
            Dobândă anuală (%)
          </label>
          <input
            id="debt-rate"
            name="annualRatePercent"
            type="number"
            min="0"
            step="0.01"
            className="input"
            placeholder="32"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Scrie DAE sau rata de dobândă din contract. Pune 0 dacă este o rată fără dobândă.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="debt-min">
            Plată minimă lunară
          </label>
          <input
            id="debt-min"
            name="minPayment"
            type="number"
            min="0"
            step="0.01"
            className="input"
            placeholder="420"
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton>Adaugă datoria</SubmitButton>
        {state.message && (
          <span className={`text-sm ${state.ok ? "text-brand-700" : "text-red-600"}`}>{state.message}</span>
        )}
      </div>
    </form>
  );
}
