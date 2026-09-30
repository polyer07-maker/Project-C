import { describe, expect, it } from "vitest";
import { buildSnapshot, toMonthly } from "./engine";
import { simulatePayoff, summarizeDebts } from "./debt";
import { buildActionPlan } from "./plan";
import type { Debt, Expense, HouseholdData, Income } from "./types";

function income(partial: Partial<Income> & { amount: number }): Income {
  return {
    id: Math.random().toString(36).slice(2),
    label: "Salariu",
    memberName: "Andrei",
    frequency: "monthly",
    kind: "salary",
    stability: "stable",
    date: null,
    ...partial,
  };
}

function expense(partial: Partial<Expense> & { amount: number }): Expense {
  return {
    id: Math.random().toString(36).slice(2),
    label: "Cheltuială",
    category: "altele",
    frequency: "monthly",
    essential: true,
    date: null,
    ...partial,
  };
}

function household(partial: Partial<HouseholdData> = {}): HouseholdData {
  return {
    profile: { name: "Test", currency: "RON", adults: 2, children: 1, savingsBalance: 0 },
    incomes: [],
    expenses: [],
    debts: [],
    goals: [],
    month: "2026-01",
    ...partial,
  };
}

describe("toMonthly", () => {
  it("normalises every frequency to a monthly amount", () => {
    expect(toMonthly(1000, "monthly")).toBe(1000);
    expect(toMonthly(1200, "yearly")).toBe(100);
    expect(toMonthly(100, "weekly")).toBeCloseTo(433.33, 2);
    expect(toMonthly(500, "one_off")).toBe(0);
  });
});

describe("buildSnapshot", () => {
  it("computes free cash flow after expenses and minimum debt payments", () => {
    const snapshot = buildSnapshot(
      household({
        incomes: [income({ amount: 6000 }), income({ amount: 4000, memberName: "Ioana" })],
        expenses: [
          expense({ amount: 2000, category: "locuinta" }),
          expense({ amount: 1200, category: "mancare" }),
          expense({ amount: 600, category: "restaurante", essential: false }),
        ],
        debts: [{ id: "d1", name: "Card", balance: 5000, annualRate: 0.3, minPayment: 400, kind: "credit_card" }],
      }),
    );

    expect(snapshot.totalIncome).toBe(10000);
    expect(snapshot.totalExpenses).toBe(3800);
    expect(snapshot.minimumDebtPayments).toBe(400);
    expect(snapshot.freeCashFlow).toBe(5800);
    expect(snapshot.essentialExpenses).toBe(3200);
    expect(snapshot.nonEssentialExpenses).toBe(600);
  });

  it("never proposes saving more than what is actually left", () => {
    const snapshot = buildSnapshot(
      household({
        incomes: [income({ amount: 5000 })],
        expenses: [expense({ amount: 4200, category: "locuinta" })],
        debts: [{ id: "d1", name: "Credit", balance: 10000, annualRate: 0.12, minPayment: 300, kind: "personal_loan" }],
      }),
    );

    const allocated =
      snapshot.savings.monthlyToEmergencyFund +
      snapshot.savings.monthlyExtraToDebt +
      snapshot.savings.monthlyToGoals +
      snapshot.savings.monthlyBuffer;

    expect(snapshot.freeCashFlow).toBe(500);
    expect(allocated).toBeLessThanOrEqual(snapshot.freeCashFlow + 0.01);
    expect(snapshot.savings.monthlyBuffer).toBeGreaterThan(0);
  });

  it("refuses to promise savings when the budget is in deficit", () => {
    const snapshot = buildSnapshot(
      household({
        incomes: [income({ amount: 4000 })],
        expenses: [
          expense({ amount: 3000, category: "locuinta" }),
          expense({ amount: 900, category: "mancare" }),
          expense({ amount: 700, category: "restaurante", essential: false }),
        ],
        debts: [{ id: "d1", name: "Card", balance: 8000, annualRate: 0.35, minPayment: 350, kind: "credit_card" }],
      }),
    );

    expect(snapshot.freeCashFlow).toBeLessThan(0);
    expect(snapshot.savings.monthlyToEmergencyFund).toBe(0);
    expect(snapshot.savings.monthlyExtraToDebt).toBe(0);
    expect(snapshot.savings.realisticSavingsRate).toBe(0);
    expect(snapshot.alerts.some((alert) => alert.level === "critical")).toBe(true);
  });

  it("keeps suggested cuts inside the realistic ceiling of each category", () => {
    const snapshot = buildSnapshot(
      household({
        incomes: [income({ amount: 5000 })],
        expenses: [
          expense({ amount: 1500, category: "restaurante", essential: false }),
          expense({ amount: 900, category: "abonamente", essential: false }),
        ],
      }),
    );

    const restaurants = snapshot.cuts.find((cut) => cut.category === "restaurante");
    expect(restaurants).toBeDefined();
    // Max realistic cut for this category is 60%.
    expect(restaurants!.suggestedMonthly).toBeGreaterThanOrEqual(1500 * 0.4 - 0.01);
    expect(restaurants!.monthlySaving).toBeLessThanOrEqual(1500 * 0.6 + 0.01);
    for (const cut of snapshot.cuts) {
      expect(cut.suggestedMonthly).toBeLessThan(cut.currentMonthly);
      expect(cut.suggestedMonthly).toBeGreaterThan(0);
    }
  });

  it("does not suggest cuts when every category is inside the reference range", () => {
    const snapshot = buildSnapshot(
      household({
        incomes: [income({ amount: 12000 })],
        expenses: [
          expense({ amount: 2000, category: "locuinta" }),
          expense({ amount: 800, category: "mancare" }),
          expense({ amount: 200, category: "abonamente", essential: false }),
        ],
      }),
    );

    expect(snapshot.cuts).toHaveLength(0);
  });

  it("only counts one-off expenses in the reference month", () => {
    const snapshot = buildSnapshot(
      household({
        month: "2026-01",
        incomes: [income({ amount: 5000 })],
        expenses: [
          expense({ amount: 900, frequency: "one_off", date: "2026-01-14", category: "sanatate" }),
          expense({ amount: 400, frequency: "one_off", date: "2025-11-02", category: "sanatate" }),
        ],
      }),
    );

    expect(snapshot.oneOffThisMonth).toBe(900);
    expect(snapshot.totalExpenses).toBe(0);
  });
});

describe("debt payoff", () => {
  const debts: Debt[] = [
    { id: "a", name: "Card", balance: 9800, annualRate: 0.32, minPayment: 420, kind: "credit_card" },
    { id: "b", name: "Nevoi personale", balance: 21500, annualRate: 0.14, minPayment: 730, kind: "personal_loan" },
    { id: "c", name: "Rate telefon", balance: 2400, annualRate: 0, minPayment: 200, kind: "other" },
  ];

  it("pays off faster and cheaper with extra payments", () => {
    const minimum = simulatePayoff(debts, 0, "minimum");
    const avalanche = simulatePayoff(debts, 800, "avalanche");

    expect(minimum.months).not.toBeNull();
    expect(avalanche.months).not.toBeNull();
    expect(avalanche.months!).toBeLessThan(minimum.months!);
    expect(avalanche.totalInterest).toBeLessThan(minimum.totalInterest);
  });

  it("attacks the highest rate first with the avalanche strategy", () => {
    const avalanche = simulatePayoff(debts, 1000, "avalanche");
    expect(avalanche.order[0].name).toBe("Card");
  });

  it("attacks the smallest balance first with the snowball strategy", () => {
    const snowball = simulatePayoff(debts, 1000, "snowball");
    expect(snowball.order[0].name).toBe("Rate telefon");
    expect(snowball.totalInterest).toBeGreaterThanOrEqual(simulatePayoff(debts, 1000, "avalanche").totalInterest);
  });

  it("flags a debt whose minimum payment does not cover the interest", () => {
    const stuck: Debt[] = [
      { id: "x", name: "Card blocat", balance: 20000, annualRate: 0.36, minPayment: 500, kind: "credit_card" },
    ];
    const summary = summarizeDebts(stuck, 5000);
    expect(summary.unsustainable).toContain("Card blocat");

    const result = simulatePayoff(stuck, 0, "minimum");
    expect(result.feasible).toBe(false);
    expect(result.months).toBeNull();
    expect(result.note).toBeTruthy();
  });

  it("clears the full balance when it is feasible", () => {
    const result = simulatePayoff(debts, 500, "avalanche");
    expect(result.timeline.at(-1)!.remaining).toBe(0);
    expect(result.totalPaid).toBeGreaterThan(debts.reduce((sum, d) => sum + d.balance, 0));
  });
});

describe("buildActionPlan", () => {
  it("starts with the deficit when the budget does not close", () => {
    const snapshot = buildSnapshot(
      household({
        incomes: [income({ amount: 4000 })],
        expenses: [expense({ amount: 4500, category: "locuinta" })],
      }),
    );
    const plan = buildActionPlan(snapshot);
    expect(plan[0].status).toBe("urgent");
    expect(plan[0].title).toContain("deficit");
  });

  it("asks for the missing data instead of guessing", () => {
    const plan = buildActionPlan(buildSnapshot(household()));
    expect(plan).toHaveLength(1);
    expect(plan[0].title).toContain("Completează");
  });
});
