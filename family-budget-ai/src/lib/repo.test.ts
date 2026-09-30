import { beforeEach, describe, expect, it } from "vitest";
import { createInMemoryDb, type DB } from "./db";
import { buildSnapshot } from "./finance/engine";
import {
  addDebt,
  addExpense,
  addIncome,
  addMessage,
  getOrCreateHousehold,
  listMessages,
  loadHouseholdData,
  upsertUser,
} from "./repo";
import { seedDemoHousehold } from "./seed";

let db: DB;

beforeEach(() => {
  db = createInMemoryDb();
});

describe("repo", () => {
  it("creates one household per user and keeps it stable", () => {
    const user = upsertUser({ email: "Ana@Example.com", name: "Ana" }, db);
    expect(user.email).toBe("ana@example.com");

    const first = getOrCreateHousehold(user.id, "Familia Ana", db);
    const second = getOrCreateHousehold(user.id, "Familia Ana", db);
    expect(second.id).toBe(first.id);

    const again = upsertUser({ email: "ana@example.com", name: "Ana Maria" }, db);
    expect(again.id).toBe(user.id);
  });

  it("isolates data between households", () => {
    const a = getOrCreateHousehold(upsertUser({ email: "a@x.ro" }, db).id, "A", db);
    const b = getOrCreateHousehold(upsertUser({ email: "b@x.ro" }, db).id, "B", db);

    addIncome(
      a.id,
      { label: "Salariu", memberName: null, amount: 5000, frequency: "monthly", kind: "salary", stability: "stable" },
      db,
    );
    addExpense(a.id, { label: "Chirie", category: "locuinta", amount: 1500, frequency: "monthly", essential: true }, db);
    addDebt(a.id, { name: "Card", kind: "credit_card", balance: 3000, annualRate: 0.3, minPayment: 200 }, db);

    expect(loadHouseholdData(a, db).incomes).toHaveLength(1);
    expect(loadHouseholdData(b, db).incomes).toHaveLength(0);
    expect(loadHouseholdData(b, db).debts).toHaveLength(0);
  });

  it("stores the conversation in chronological order", () => {
    const household = getOrCreateHousehold(upsertUser({ email: "c@x.ro" }, db).id, "C", db);
    addMessage(household.id, "user", "prima", db);
    addMessage(household.id, "agent", "a doua", db);

    const messages = listMessages(household.id, 10, db);
    expect(messages.map((m) => m.content)).toEqual(["prima", "a doua"]);
  });

  it("produces an analysable snapshot from the demo data", () => {
    const household = getOrCreateHousehold(upsertUser({ email: "demo@x.ro" }, db).id, "Demo", db);
    seedDemoHousehold(household.id, db);

    const refreshed = loadHouseholdData(getOrCreateHousehold(upsertUser({ email: "demo@x.ro" }, db).id, "Demo", db), db);
    const snapshot = buildSnapshot(refreshed);

    expect(snapshot.totalIncome).toBeGreaterThan(0);
    expect(snapshot.totalExpenses).toBeGreaterThan(0);
    expect(snapshot.debt.totalBalance).toBeGreaterThan(0);
    expect(snapshot.payoff).not.toBeNull();
    expect(snapshot.categories.length).toBeGreaterThan(5);
  });
});
