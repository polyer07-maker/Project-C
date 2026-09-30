import { randomUUID } from "node:crypto";
import { getDb, type DB } from "./db";
import type {
  CategoryKey,
  Debt,
  Expense,
  Frequency,
  Goal,
  HouseholdData,
  Income,
  IncomeKind,
  IncomeStability,
} from "./finance/types";

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

const now = () => new Date().toISOString();

export function currentMonth(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

export function upsertUser(
  input: { email: string; name?: string | null; image?: string | null },
  db: DB = getDb(),
): UserRecord {
  const email = input.email.trim().toLowerCase();
  const existing = db.prepare("SELECT id, email, name, image FROM users WHERE email = ?").get(email) as
    | UserRecord
    | undefined;

  if (existing) {
    db.prepare("UPDATE users SET name = COALESCE(?, name), image = COALESCE(?, image) WHERE id = ?").run(
      input.name ?? null,
      input.image ?? null,
      existing.id,
    );
    return { ...existing, name: input.name ?? existing.name, image: input.image ?? existing.image };
  }

  const id = randomUUID();
  db.prepare("INSERT INTO users (id, email, name, image, created_at) VALUES (?, ?, ?, ?, ?)").run(
    id,
    email,
    input.name ?? null,
    input.image ?? null,
    now(),
  );
  return { id, email, name: input.name ?? null, image: input.image ?? null };
}

export function getOrCreateHousehold(userId: string, defaultName = "Familia mea", db: DB = getDb()): HouseholdRecord {
  const row = db
    .prepare(
      "SELECT id, name, currency, adults, children, savings_balance as savingsBalance FROM households WHERE owner_user_id = ? ORDER BY created_at LIMIT 1",
    )
    .get(userId) as HouseholdRecord | undefined;
  if (row) return row;

  const id = randomUUID();
  db.prepare(
    "INSERT INTO households (id, owner_user_id, name, currency, adults, children, savings_balance, created_at) VALUES (?, ?, ?, 'RON', 2, 0, 0, ?)",
  ).run(id, userId, defaultName, now());
  return { id, name: defaultName, currency: "RON", adults: 2, children: 0, savingsBalance: 0 };
}

export function updateHousehold(
  householdId: string,
  input: Partial<Pick<HouseholdRecord, "name" | "currency" | "adults" | "children" | "savingsBalance">>,
  db: DB = getDb(),
): void {
  const current = db
    .prepare(
      "SELECT id, name, currency, adults, children, savings_balance as savingsBalance FROM households WHERE id = ?",
    )
    .get(householdId) as HouseholdRecord | undefined;
  if (!current) throw new Error("Gospodăria nu există");

  db.prepare(
    "UPDATE households SET name = ?, currency = ?, adults = ?, children = ?, savings_balance = ? WHERE id = ?",
  ).run(
    input.name ?? current.name,
    input.currency ?? current.currency,
    input.adults ?? current.adults,
    input.children ?? current.children,
    input.savingsBalance ?? current.savingsBalance,
    householdId,
  );
}

export function listIncomes(householdId: string, db: DB = getDb()): Income[] {
  return db
    .prepare(
      "SELECT id, label, member_name as memberName, amount, frequency, kind, stability, date FROM incomes WHERE household_id = ? ORDER BY amount DESC",
    )
    .all(householdId) as Income[];
}

export function addIncome(
  householdId: string,
  input: {
    label: string;
    memberName: string | null;
    amount: number;
    frequency: Frequency;
    kind: IncomeKind;
    stability: IncomeStability;
    date?: string | null;
  },
  db: DB = getDb(),
): string {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO incomes (id, household_id, label, member_name, amount, frequency, kind, stability, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    id,
    householdId,
    input.label,
    input.memberName,
    input.amount,
    input.frequency,
    input.kind,
    input.stability,
    input.date ?? null,
    now(),
  );
  return id;
}

export function deleteIncome(householdId: string, id: string, db: DB = getDb()): void {
  db.prepare("DELETE FROM incomes WHERE id = ? AND household_id = ?").run(id, householdId);
}

export function listExpenses(householdId: string, db: DB = getDb()): Expense[] {
  const rows = db
    .prepare(
      "SELECT id, label, category, amount, frequency, essential, date FROM expenses WHERE household_id = ? ORDER BY amount DESC",
    )
    .all(householdId) as (Omit<Expense, "essential"> & { essential: number })[];
  return rows.map((row) => ({ ...row, essential: row.essential === 1 }));
}

export function addExpense(
  householdId: string,
  input: {
    label: string;
    category: CategoryKey;
    amount: number;
    frequency: Frequency;
    essential: boolean;
    date?: string | null;
  },
  db: DB = getDb(),
): string {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO expenses (id, household_id, label, category, amount, frequency, essential, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    id,
    householdId,
    input.label,
    input.category,
    input.amount,
    input.frequency,
    input.essential ? 1 : 0,
    input.date ?? null,
    now(),
  );
  return id;
}

export function deleteExpense(householdId: string, id: string, db: DB = getDb()): void {
  db.prepare("DELETE FROM expenses WHERE id = ? AND household_id = ?").run(id, householdId);
}

export function listDebts(householdId: string, db: DB = getDb()): Debt[] {
  return db
    .prepare(
      "SELECT id, name, kind, balance, annual_rate as annualRate, min_payment as minPayment FROM debts WHERE household_id = ? ORDER BY annual_rate DESC",
    )
    .all(householdId) as Debt[];
}

export function addDebt(
  householdId: string,
  input: { name: string; kind: Debt["kind"]; balance: number; annualRate: number; minPayment: number },
  db: DB = getDb(),
): string {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO debts (id, household_id, name, kind, balance, annual_rate, min_payment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(id, householdId, input.name, input.kind, input.balance, input.annualRate, input.minPayment, now());
  return id;
}

export function deleteDebt(householdId: string, id: string, db: DB = getDb()): void {
  db.prepare("DELETE FROM debts WHERE id = ? AND household_id = ?").run(id, householdId);
}

export function listGoals(householdId: string, db: DB = getDb()): Goal[] {
  return db
    .prepare(
      "SELECT id, name, target_amount as targetAmount, saved_amount as savedAmount, deadline FROM goals WHERE household_id = ? ORDER BY created_at",
    )
    .all(householdId) as Goal[];
}

export function addGoal(
  householdId: string,
  input: { name: string; targetAmount: number; savedAmount: number; deadline?: string | null },
  db: DB = getDb(),
): string {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO goals (id, household_id, name, target_amount, saved_amount, deadline, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(id, householdId, input.name, input.targetAmount, input.savedAmount, input.deadline ?? null, now());
  return id;
}

export function deleteGoal(householdId: string, id: string, db: DB = getDb()): void {
  db.prepare("DELETE FROM goals WHERE id = ? AND household_id = ?").run(id, householdId);
}

export function loadHouseholdData(household: HouseholdRecord, db: DB = getDb()): HouseholdData {
  return {
    profile: {
      name: household.name,
      currency: household.currency,
      adults: household.adults,
      children: household.children,
      savingsBalance: household.savingsBalance,
    },
    incomes: listIncomes(household.id, db),
    expenses: listExpenses(household.id, db),
    debts: listDebts(household.id, db),
    goals: listGoals(household.id, db),
    month: currentMonth(),
  };
}

export function listMessages(householdId: string, limit = 50, db: DB = getDb()): AgentMessage[] {
  const rows = db
    .prepare(
      "SELECT id, role, content, created_at as createdAt FROM agent_messages WHERE household_id = ? ORDER BY created_at DESC LIMIT ?",
    )
    .all(householdId, limit) as AgentMessage[];
  return rows.reverse();
}

export function addMessage(
  householdId: string,
  role: "user" | "agent",
  content: string,
  db: DB = getDb(),
): AgentMessage {
  const message: AgentMessage = { id: randomUUID(), role, content, createdAt: now() };
  db.prepare("INSERT INTO agent_messages (id, household_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)").run(
    message.id,
    householdId,
    role,
    content,
    message.createdAt,
  );
  return message;
}

export function clearMessages(householdId: string, db: DB = getDb()): void {
  db.prepare("DELETE FROM agent_messages WHERE household_id = ?").run(householdId);
}

export function householdIsEmpty(householdId: string, db: DB = getDb()): boolean {
  const row = db
    .prepare(
      "SELECT (SELECT COUNT(*) FROM incomes WHERE household_id = ?) + (SELECT COUNT(*) FROM expenses WHERE household_id = ?) AS total",
    )
    .get(householdId, householdId) as { total: number };
  return row.total === 0;
}
