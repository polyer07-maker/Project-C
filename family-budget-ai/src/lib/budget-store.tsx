"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { buildSnapshot } from "@/lib/finance/engine";
import type { HouseholdData, Snapshot } from "@/lib/finance/types";
import { answerFromRules } from "@/lib/agent/rules";
import {
  applyDemo,
  emptyState,
  newId,
  type AgentMessage,
  type BudgetState,
  type HouseholdRecord,
  type NewDebt,
  type NewExpense,
  type NewIncome,
} from "@/lib/local-state";

const STORAGE_KEY = "buget-familie-v1";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function persist(state: BudgetState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or full storage: keep working in memory.
  }
}

function load(): BudgetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as BudgetState;
    if (!parsed?.household?.id) return emptyState();
    return parsed;
  } catch {
    return emptyState();
  }
}

export interface BudgetContextValue {
  ready: boolean;
  state: BudgetState;
  data: HouseholdData;
  snapshot: Snapshot;
  signIn: (input?: { name?: string; email?: string }) => void;
  signOut: () => void;
  loadDemo: () => void;
  addIncome: (input: NewIncome) => void;
  removeIncome: (id: string) => void;
  addExpense: (input: NewExpense) => void;
  removeExpense: (id: string) => void;
  addDebt: (input: NewDebt) => void;
  removeDebt: (id: string) => void;
  addGoal: (input: { name: string; targetAmount: number; savedAmount: number; deadline?: string | null }) => void;
  removeGoal: (id: string) => void;
  saveHousehold: (input: Partial<HouseholdRecord>) => void;
  askAgent: (question: string) => { answer: string; source: "calculat" };
  clearMessages: () => void;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BudgetState>(emptyState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(load());
    setReady(true);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (ready) persist(state);
  }, [ready, state]);

  const data: HouseholdData = useMemo(
    () => ({
      profile: {
        name: state.household.name,
        currency: state.household.currency,
        adults: state.household.adults,
        children: state.household.children,
        savingsBalance: state.household.savingsBalance,
      },
      incomes: state.incomes,
      expenses: state.expenses,
      debts: state.debts,
      goals: state.goals,
      month: currentMonth(),
    }),
    [state],
  );

  const snapshot = useMemo(() => buildSnapshot(data), [data]);

  const update = (fn: (current: BudgetState) => BudgetState) => {
    setState((current) => fn(current));
  };

  const value: BudgetContextValue = {
    ready,
    state,
    data,
    snapshot,
    signIn: (input) => {
      update((current) => ({
        ...current,
        signedIn: true,
        user: {
          ...current.user,
          name: input?.name ?? current.user.name ?? "Pe telefon",
          email: input?.email ?? current.user.email ?? "telefon@local",
        },
      }));
    },
    signOut: () => {
      update((current) => ({ ...current, signedIn: false }));
    },
    loadDemo: () => {
      update((current) => applyDemo({ ...current, signedIn: true }));
    },
    addIncome: (input) => {
      update((current) => ({
        ...current,
        incomes: [{ id: newId(), date: null, ...input }, ...current.incomes],
      }));
    },
    removeIncome: (id) => {
      update((current) => ({ ...current, incomes: current.incomes.filter((row) => row.id !== id) }));
    },
    addExpense: (input) => {
      update((current) => ({
        ...current,
        expenses: [
          {
            id: newId(),
            ...input,
            date: input.frequency === "one_off" ? input.date ?? new Date().toISOString().slice(0, 10) : null,
          },
          ...current.expenses,
        ],
      }));
    },
    removeExpense: (id) => {
      update((current) => ({ ...current, expenses: current.expenses.filter((row) => row.id !== id) }));
    },
    addDebt: (input) => {
      update((current) => ({
        ...current,
        debts: [{ id: newId(), ...input }, ...current.debts],
      }));
    },
    removeDebt: (id) => {
      update((current) => ({ ...current, debts: current.debts.filter((row) => row.id !== id) }));
    },
    addGoal: (input) => {
      update((current) => ({
        ...current,
        goals: [
          {
            id: newId(),
            name: input.name,
            targetAmount: input.targetAmount,
            savedAmount: input.savedAmount,
            deadline: input.deadline ?? null,
          },
          ...current.goals,
        ],
      }));
    },
    removeGoal: (id) => {
      update((current) => ({ ...current, goals: current.goals.filter((row) => row.id !== id) }));
    },
    saveHousehold: (input) => {
      update((current) => ({ ...current, household: { ...current.household, ...input } }));
    },
    askAgent: (question) => {
      const trimmed = question.trim().slice(0, 500);
      const answer = answerFromRules(trimmed, snapshot);
      const userMsg: AgentMessage = {
        id: newId(),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const agentMsg: AgentMessage = {
        id: newId(),
        role: "agent",
        content: answer,
        createdAt: new Date().toISOString(),
      };
      update((current) => ({ ...current, messages: [...current.messages, userMsg, agentMsg] }));
      return { answer, source: "calculat" };
    },
    clearMessages: () => {
      update((current) => ({ ...current, messages: [] }));
    },
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget(): BudgetContextValue {
  const value = useContext(BudgetContext);
  if (!value) throw new Error("useBudget trebuie folosit în BudgetProvider");
  return value;
}
