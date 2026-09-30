import type { Debt, DebtPayoffResult, DebtSummary, PayoffStep } from "./types";

const MAX_MONTHS = 600;

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Which open debt currently receives extra payments under the given strategy. */
export function extraPaymentTarget(
  debts: Debt[],
  strategy: "avalanche" | "snowball" | "minimum",
): string | null {
  const open = debts.filter((d) => d.balance > 0);
  if (open.length === 0 || strategy === "minimum") return null;
  const sorted =
    strategy === "snowball"
      ? [...open].sort((a, b) => a.balance - b.balance)
      : [...open].sort((a, b) => b.annualRate - a.annualRate || a.balance - b.balance);
  return sorted[0]?.name ?? null;
}

export function summarizeDebts(debts: Debt[], monthlyIncome: number): DebtSummary {
  const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
  const monthlyInterestCost = debts.reduce((sum, d) => sum + (d.balance * d.annualRate) / 12, 0);
  const weightedAnnualRate =
    totalBalance > 0 ? debts.reduce((sum, d) => sum + d.balance * d.annualRate, 0) / totalBalance : 0;

  const unsustainable = debts
    .filter((d) => d.balance > 0 && d.minPayment <= (d.balance * d.annualRate) / 12)
    .map((d) => d.name);

  return {
    totalBalance: round2(totalBalance),
    totalMinPayment: round2(totalMinPayment),
    weightedAnnualRate,
    monthlyInterestCost: round2(monthlyInterestCost),
    debtToIncomeRatio: monthlyIncome > 0 ? totalMinPayment / monthlyIncome : 0,
    unsustainable,
  };
}

interface SimState {
  debt: Debt;
  balance: number;
  interestPaid: number;
  paidOffInMonth: number | null;
}

/**
 * Month-by-month amortisation of every debt.
 *
 * `extraPayment` is the amount added on top of the minimum payments; it is
 * directed to a single debt at a time, chosen by the strategy, and freed-up
 * minimum payments roll over to the next target (the snowball effect).
 */
export function simulatePayoff(
  debts: Debt[],
  extraPayment: number,
  strategy: "avalanche" | "snowball" | "minimum",
): DebtPayoffResult {
  const active = debts.filter((d) => d.balance > 0);
  const monthlyPayment = round2(active.reduce((s, d) => s + d.minPayment, 0) + Math.max(0, extraPayment));

  if (active.length === 0) {
    return {
      strategy,
      months: 0,
      totalInterest: 0,
      totalPaid: 0,
      monthlyPayment: 0,
      order: [],
      extraTarget: null,
      timeline: [],
      feasible: true,
      note: null,
    };
  }

  const states: SimState[] = active.map((debt) => ({
    debt,
    balance: debt.balance,
    interestPaid: 0,
    paidOffInMonth: null,
  }));

  const priority = (): SimState[] => {
    const open = states.filter((s) => s.balance > 0.005);
    if (strategy === "snowball") {
      return open.sort((a, b) => a.balance - b.balance);
    }
    if (strategy === "avalanche") {
      return open.sort((a, b) => b.debt.annualRate - a.debt.annualRate || a.balance - b.balance);
    }
    return open;
  };

  const timeline: PayoffStep[] = [];
  let month = 0;
  let totalInterest = 0;
  let totalPaid = 0;

  while (states.some((s) => s.balance > 0.005) && month < MAX_MONTHS) {
    month += 1;

    let budget =
      states.reduce((sum, s) => sum + (s.balance > 0.005 ? s.debt.minPayment : 0), 0) +
      (strategy === "minimum" ? 0 : Math.max(0, extraPayment));

    // Freed-up minimum payments keep working for the remaining debts.
    if (strategy !== "minimum") {
      budget += states.reduce((sum, s) => sum + (s.balance <= 0.005 ? s.debt.minPayment : 0), 0);
    }

    let interestThisMonth = 0;
    for (const state of states) {
      if (state.balance <= 0.005) continue;
      const interest = (state.balance * state.debt.annualRate) / 12;
      state.balance += interest;
      state.interestPaid += interest;
      interestThisMonth += interest;
    }

    // Minimum payments first, so no debt falls behind.
    for (const state of states) {
      if (state.balance <= 0.005) continue;
      const pay = Math.min(state.debt.minPayment, state.balance, budget);
      state.balance -= pay;
      budget -= pay;
      totalPaid += pay;
      if (state.balance <= 0.005) {
        state.balance = 0;
        state.paidOffInMonth = month;
      }
    }

    // Everything left goes to the target debt chosen by the strategy.
    while (budget > 0.005) {
      const target = priority()[0];
      if (!target) break;
      const pay = Math.min(budget, target.balance);
      target.balance -= pay;
      budget -= pay;
      totalPaid += pay;
      if (target.balance <= 0.005) {
        target.balance = 0;
        target.paidOffInMonth = month;
      }
    }

    totalInterest += interestThisMonth;
    timeline.push({
      month,
      totalPaid: round2(totalPaid),
      interestPaid: round2(totalInterest),
      remaining: round2(states.reduce((s, x) => s + x.balance, 0)),
    });
  }

  const cleared = states.every((s) => s.balance <= 0.005);
  const feasible = cleared;

  return {
    strategy,
    months: cleared ? month : null,
    totalInterest: round2(totalInterest),
    totalPaid: round2(totalPaid),
    monthlyPayment,
    order: states
      .slice()
      .sort((a, b) => (a.paidOffInMonth ?? Infinity) - (b.paidOffInMonth ?? Infinity))
      .map((s) => ({
        name: s.debt.name,
        paidOffInMonth: s.paidOffInMonth,
        interestPaid: round2(s.interestPaid),
      })),
    extraTarget: extraPaymentTarget(active, strategy),
    timeline,
    feasible,
    note: cleared
      ? null
      : "Cu plățile curente datoriile nu se sting în 50 de ani: dobânda depășește ce plătești lunar. Este nevoie de venit suplimentar, refinanțare sau negocierea dobânzii.",
  };
}

/** Number of whole months until a target amount is reached at a fixed monthly rate. */
export function monthsToReach(target: number, monthly: number, current = 0): number | null {
  if (target <= current) return 0;
  if (monthly <= 0) return null;
  return Math.ceil((target - current) / monthly);
}

export function formatMonths(months: number | null): string {
  if (months === null) return "niciodată la ritmul actual";
  if (months === 0) return "deja atins";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${months} ${months === 1 ? "lună" : "luni"}`;
  if (rest === 0) return `${years} ${years === 1 ? "an" : "ani"}`;
  return `${years} ${years === 1 ? "an" : "ani"} și ${rest} ${rest === 1 ? "lună" : "luni"}`;
}
