"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/ui";
import { DEBT_KIND_LABEL } from "@/lib/format";
import { useBudget } from "@/lib/budget-store";
import type { Debt } from "@/lib/finance/types";

export function DebtForm() {
  const { addDebt } = useBudget();
  const [message, setMessage] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const name = String(data.get("name") ?? "").trim();
        const balance = Number(data.get("balance"));
        const annualRatePercent = Number(data.get("annualRatePercent"));
        const minPayment = Number(data.get("minPayment"));
        if (name.length < 2 || !Number.isFinite(balance)) {
          setMessage("Completează numele și soldul.");
          return;
        }
        addDebt({
          name,
          kind: (data.get("kind") as Debt["kind"]) || "other",
          balance,
          annualRate: annualRatePercent / 100,
          minPayment,
        });
        form.reset();
        setMessage(`Am adăugat „${name}”.`);
      }}
    >
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
          <input id="debt-balance" name="balance" type="number" min="0" step="0.01" className="input" placeholder="9800" required />
        </div>
        <div>
          <label className="label" htmlFor="debt-rate">
            Dobândă anuală (%)
          </label>
          <input id="debt-rate" name="annualRatePercent" type="number" min="0" step="0.01" className="input" placeholder="32" required />
          <p className="mt-1 text-xs text-slate-500">
            Scrie DAE sau rata de dobândă din contract. Pune 0 dacă este o rată fără dobândă.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="debt-min">
            Plată minimă lunară
          </label>
          <input id="debt-min" name="minPayment" type="number" min="0" step="0.01" className="input" placeholder="420" required />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton>Adaugă datoria</SubmitButton>
        {message && <span className="text-sm text-brand-700">{message}</span>}
      </div>
    </form>
  );
}
