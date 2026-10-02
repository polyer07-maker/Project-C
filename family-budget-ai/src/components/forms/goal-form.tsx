"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/ui";
import { useBudget } from "@/lib/budget-store";

export function GoalForm() {
  const { addGoal } = useBudget();
  const [message, setMessage] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const name = String(data.get("name") ?? "").trim();
        const targetAmount = Number(data.get("targetAmount"));
        const savedAmount = Number(data.get("savedAmount") || 0);
        if (name.length < 2 || !Number.isFinite(targetAmount)) {
          setMessage("Completează obiectivul și suma.");
          return;
        }
        addGoal({
          name,
          targetAmount,
          savedAmount,
          deadline: String(data.get("deadline") ?? "") || null,
        });
        form.reset();
        setMessage(`Am adăugat obiectivul „${name}”.`);
      }}
    >
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
          <input id="goal-target" name="targetAmount" type="number" min="0" step="0.01" className="input" placeholder="6000" required />
        </div>
        <div>
          <label className="label" htmlFor="goal-saved">
            Strâns până acum
          </label>
          <input id="goal-saved" name="savedAmount" type="number" min="0" step="0.01" className="input" defaultValue={0} />
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
        {message && <span className="text-sm text-brand-700">{message}</span>}
      </div>
    </form>
  );
}
