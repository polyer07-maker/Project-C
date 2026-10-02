"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/ui";
import { useBudget } from "@/lib/budget-store";
import type { HouseholdRecord } from "@/lib/local-state";

export function HouseholdForm({ household }: { household: HouseholdRecord }) {
  const { saveHousehold } = useBudget();
  const [message, setMessage] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        saveHousehold({
          name: String(data.get("name") ?? household.name).trim() || household.name,
          currency: String(data.get("currency") ?? household.currency),
          adults: Number(data.get("adults") || household.adults),
          children: Number(data.get("children") || 0),
          savingsBalance: Number(data.get("savingsBalance") || 0),
        });
        setMessage("Am salvat datele familiei.");
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="household-name">
            Numele familiei
          </label>
          <input id="household-name" name="name" className="input" defaultValue={household.name} required />
        </div>
        <div>
          <label className="label" htmlFor="household-currency">
            Monedă
          </label>
          <select id="household-currency" name="currency" className="input" defaultValue={household.currency}>
            <option value="RON">RON (lei)</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="MDL">MDL</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="household-adults">
            Adulți
          </label>
          <input id="household-adults" name="adults" type="number" min="1" max="10" className="input" defaultValue={household.adults} />
        </div>
        <div>
          <label className="label" htmlFor="household-children">
            Copii
          </label>
          <input id="household-children" name="children" type="number" min="0" max="15" className="input" defaultValue={household.children} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="household-savings">
            Economii existente
          </label>
          <input
            id="household-savings"
            name="savingsBalance"
            type="number"
            min="0"
            step="0.01"
            className="input"
            defaultValue={household.savingsBalance}
          />
          <p className="mt-1 text-xs text-slate-500">
            Banii la care ai acces imediat, în cont sau cash. Pe baza lor calculez câte luni de cheltuieli esențiale
            acoperi în caz de urgență.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton>Salvează</SubmitButton>
        {message && <span className="text-sm text-brand-700">{message}</span>}
      </div>
    </form>
  );
}
