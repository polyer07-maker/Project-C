import type { CategoryKey, Debt, Expense, Frequency, Goal, Income, IncomeKind, IncomeStability } from "./finance/types";

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface HouseholdRecord {
  id: string;
  name: string;
  currency: string;
  adults: number;
  children: number;
  savingsBalance: number;
}

export interface AgentMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  createdAt: string;
}

export interface BudgetState {
  signedIn: boolean;
  user: UserRecord;
  household: HouseholdRecord;
  incomes: Income[];
  expenses: Expense[];
  debts: Debt[];
  goals: Goal[];
  messages: AgentMessage[];
}

export function newId(): string {
  return crypto.randomUUID();
}

export function emptyState(): BudgetState {
  const userId = newId();
  return {
    signedIn: false,
    user: { id: userId, email: "", name: null, image: null },
    household: {
      id: newId(),
      name: "Familia mea",
      currency: "RON",
      adults: 2,
      children: 0,
      savingsBalance: 0,
    },
    incomes: [],
    expenses: [],
    debts: [],
    goals: [],
    messages: [],
  };
}

export const DEMO_INCOMES: Omit<Income, "id">[] = [
  {
    label: "Salariu net",
    memberName: "Andrei",
    amount: 6200,
    frequency: "monthly",
    kind: "salary",
    stability: "stable",
    date: null,
  },
  {
    label: "Salariu net",
    memberName: "Ioana",
    amount: 4900,
    frequency: "monthly",
    kind: "salary",
    stability: "stable",
    date: null,
  },
  {
    label: "Alocații copii",
    memberName: "Familie",
    amount: 580,
    frequency: "monthly",
    kind: "benefit",
    stability: "stable",
    date: null,
  },
  {
    label: "Proiecte freelance",
    memberName: "Ioana",
    amount: 900,
    frequency: "monthly",
    kind: "other",
    stability: "variable",
    date: null,
  },
];

export const DEMO_EXPENSES: Omit<Expense, "id">[] = [
  { label: "Rată ipotecă", category: "locuinta", amount: 2450, frequency: "monthly", essential: true, date: null },
  { label: "Întreținere", category: "locuinta", amount: 480, frequency: "monthly", essential: true, date: null },
  { label: "Curent și gaz", category: "utilitati", amount: 520, frequency: "monthly", essential: true, date: null },
  { label: "Internet și telefoane", category: "utilitati", amount: 210, frequency: "monthly", essential: true, date: null },
  { label: "Cumpărături alimentare", category: "mancare", amount: 620, frequency: "weekly", essential: true, date: null },
  { label: "Combustibil", category: "transport", amount: 700, frequency: "monthly", essential: true, date: null },
  { label: "RCA + ITP", category: "transport", amount: 1600, frequency: "yearly", essential: true, date: null },
  { label: "Grădiniță și after-school", category: "copii", amount: 1100, frequency: "monthly", essential: true, date: null },
  { label: "Abonament medical", category: "sanatate", amount: 180, frequency: "monthly", essential: true, date: null },
  { label: "Detergenți și cosmetice", category: "igiena", amount: 240, frequency: "monthly", essential: true, date: null },
  { label: "Livrări mâncare", category: "restaurante", amount: 780, frequency: "monthly", essential: false, date: null },
  { label: "Netflix, Spotify, HBO, iCloud", category: "abonamente", amount: 195, frequency: "monthly", essential: false, date: null },
  { label: "Sala de sport", category: "abonamente", amount: 260, frequency: "monthly", essential: false, date: null },
  { label: "Ieșiri weekend", category: "divertisment", amount: 450, frequency: "monthly", essential: false, date: null },
  { label: "Haine copii și adulți", category: "imbracaminte", amount: 380, frequency: "monthly", essential: false, date: null },
];

export const DEMO_DEBTS: Omit<Debt, "id">[] = [
  { name: "Card de credit", kind: "credit_card", balance: 9800, annualRate: 0.32, minPayment: 420 },
  { name: "Credit nevoi personale", kind: "personal_loan", balance: 21500, annualRate: 0.14, minPayment: 730 },
  { name: "Rate telefon (BNPL)", kind: "other", balance: 2400, annualRate: 0, minPayment: 200 },
];

export const DEMO_GOALS: Omit<Goal, "id">[] = [
  { name: "Vacanță de vară", targetAmount: 6000, savedAmount: 400, deadline: null },
  { name: "Schimbat centrala termică", targetAmount: 8000, savedAmount: 0, deadline: null },
];

export function applyDemo(state: BudgetState): BudgetState {
  return {
    ...state,
    household: {
      ...state.household,
      name: "Familia Demo",
      currency: "RON",
      adults: 2,
      children: 2,
      savingsBalance: 1800,
    },
    incomes: DEMO_INCOMES.map((row) => ({ ...row, id: newId() })),
    expenses: DEMO_EXPENSES.map((row) => ({ ...row, id: newId() })),
    debts: DEMO_DEBTS.map((row) => ({ ...row, id: newId() })),
    goals: DEMO_GOALS.map((row) => ({ ...row, id: newId() })),
  };
}

export type NewIncome = {
  label: string;
  memberName: string | null;
  amount: number;
  frequency: Frequency;
  kind: IncomeKind;
  stability: IncomeStability;
};

export type NewExpense = {
  label: string;
  category: CategoryKey;
  amount: number;
  frequency: Frequency;
  essential: boolean;
  date?: string | null;
};

export type NewDebt = {
  name: string;
  kind: Debt["kind"];
  balance: number;
  annualRate: number;
  minPayment: number;
};
