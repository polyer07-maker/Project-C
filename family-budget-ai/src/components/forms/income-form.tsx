"use client";

import { useState } from "react";
import { useBudget } from "@/lib/budget-store";
import { SubmitButton } from "@/components/ui";
import type { Frequency, IncomeKind, IncomeStability } from "@/lib/finance/types";

export function IncomeForm() {
  const { addIncome } = useBudget();
  const [message, setMessage] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const label = String(data.get("label") ?? "").trim();
        const amount = Number(data.get("amount"));
        if (label.length < 2 || !Number.isFinite(amount) || amount < 0) {
          setMessage("Completează denumirea și suma.");
          return;
        }
        addIncome({
          label,
          memberName: String(data.get("memberName") ?? "").trim() || null,
          amount,
          frequency: (data.get("frequency") as Frequency) || "monthly",
          kind: (data.get("kind") as IncomeKind) || "salary",
          stability: (data.get("stability") as IncomeStability) || "stable",
        });
        form.reset();
        setMessage(`Am adăugat „${label}”.`);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="income-label">
            Denumire
          </label>
          <input id="income-label" name="label" className="input" placeholder="Salariu net" required />
        </div>
        <div>
          <label className="label" htmlFor="income-member">
            Cine îl aduce
          </label>
          <input id="income-member" name="memberName" className="input" placeholder="Andrei" />
        </div>
        <div>
          <label className="label" htmlFor="income-amount">
            Sumă
          </label>
          <input id="income-amount" name="amount" type="number" min="0" step="0.01" className="input" placeholder="6200" required />
        </div>
        <div>
          <label className="label" htmlFor="income-frequency">
            Frecvență
          </label>
          <select id="income-frequency" name="frequency" className="input" defaultValue="monthly">
            <option value="monthly">lunar</option>
            <option value="weekly">săptămânal</option>
            <option value="yearly">anual</option>
            <option value="one_off">o singură dată</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="income-kind">
            Tip venit
          </label>
          <select id="income-kind" name="kind" className="input" defaultValue="salary">
            <option value="salary">Salariu</option>
            <option value="bonus">Bonus / primă</option>
            <option value="benefit">Alocație / ajutor</option>
            <option value="rent">Chirie încasată</option>
            <option value="other">Alt venit</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="income-stability">
            Cât de sigur este
          </label>
          <select id="income-stability" name="stability" className="input" defaultValue="stable">
            <option value="stable">stabil, vine în fiecare lună</option>
            <option value="variable">variabil, nu mă pot baza pe el</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton>Adaugă venitul</SubmitButton>
        {message && <span className="text-sm text-brand-700">{message}</span>}
      </div>
    </form>
  );
}
