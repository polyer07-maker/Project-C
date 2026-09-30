import { categoryMeta } from "./categories";
import { formatAmount, formatDecimal, formatPercent } from "../format";
import { monthsToReach, round2, simulatePayoff, summarizeDebts } from "./debt";
import type {
  Alert,
  CategoryBreakdownItem,
  CutSuggestion,
  Expense,
  Frequency,
  HouseholdData,
  Income,
  SavingsPlan,
  Snapshot,
} from "./types";

const WEEKS_PER_MONTH = 52 / 12;

/** Converts any amount to its monthly equivalent for a typical month. */
export function toMonthly(amount: number, frequency: Frequency): number {
  switch (frequency) {
    case "monthly":
      return amount;
    case "weekly":
      return amount * WEEKS_PER_MONTH;
    case "yearly":
      return amount / 12;
    case "one_off":
      return 0;
  }
}

function inMonth(date: string | null, month: string): boolean {
  return Boolean(date && date.slice(0, 7) === month);
}

function monthlyIncome(income: Income): number {
  return toMonthly(income.amount, income.frequency);
}

function monthlyExpense(expense: Expense): number {
  return toMonthly(expense.amount, expense.frequency);
}

function buildCategories(expenses: Expense[], totalExpenses: number, income: number): CategoryBreakdownItem[] {
  const map = new Map<string, CategoryBreakdownItem>();

  for (const expense of expenses) {
    const monthly = monthlyExpense(expense);
    if (monthly <= 0) continue;
    const meta = categoryMeta(expense.category);
    const existing = map.get(expense.category);
    if (existing) {
      existing.monthly += monthly;
      existing.items.push({ label: expense.label, monthly: round2(monthly) });
      existing.essential = existing.essential || expense.essential;
    } else {
      map.set(expense.category, {
        category: expense.category,
        label: meta.label,
        monthly,
        shareOfExpenses: 0,
        shareOfIncome: 0,
        essential: expense.essential,
        benchmarkMaxShare: meta.benchmarkMaxShare,
        overBenchmark: 0,
        items: [{ label: expense.label, monthly: round2(monthly) }],
      });
    }
  }

  return [...map.values()]
    .map((item) => {
      const benchmarkAmount = income * item.benchmarkMaxShare;
      return {
        ...item,
        monthly: round2(item.monthly),
        shareOfExpenses: totalExpenses > 0 ? item.monthly / totalExpenses : 0,
        shareOfIncome: income > 0 ? item.monthly / income : 0,
        overBenchmark: income > 0 ? round2(Math.max(0, item.monthly - benchmarkAmount)) : 0,
        items: item.items.sort((a, b) => b.monthly - a.monthly),
      };
    })
    .sort((a, b) => b.monthly - a.monthly);
}

function buildCuts(categories: CategoryBreakdownItem[], income: number): CutSuggestion[] {
  if (income <= 0) return [];

  const suggestions: CutSuggestion[] = [];
  for (const category of categories) {
    const meta = categoryMeta(category.category);
    const benchmarkAmount = income * meta.benchmarkMaxShare;
    const realisticFloor = Math.max(category.monthly * (1 - meta.maxRealisticCut), benchmarkAmount);
    const target = Math.min(category.monthly, realisticFloor);
    const saving = round2(category.monthly - target);
    if (saving < 20) continue;

    suggestions.push({
      category: category.category,
      label: category.label,
      currentMonthly: category.monthly,
      suggestedMonthly: round2(target),
      monthlySaving: saving,
      reason: category.essential
        ? `Cheltuială necesară, dar la ${formatPercent(category.shareOfIncome, 0)} din venit este peste reperul uzual de ${formatPercent(meta.benchmarkMaxShare, 0)}. O reducere de maximum ${formatPercent(meta.maxRealisticCut, 0)} este fezabilă fără să afecteze strictul necesar.`
        : `Cheltuială opțională aflată la ${formatPercent(category.shareOfIncome, 0)} din venit, peste reperul de ${formatPercent(meta.benchmarkMaxShare, 0)}. Se poate reduce treptat, nu eliminat complet.`,
    });
  }

  return suggestions.sort((a, b) => b.monthlySaving - a.monthlySaving).slice(0, 5);
}

function buildSavingsPlan(args: {
  income: number;
  essentialExpenses: number;
  freeCashFlow: number;
  savingsBalance: number;
  hasDebt: boolean;
  hasHighInterestDebt: boolean;
  goalsRemaining: number;
}): SavingsPlan {
  const {
    income,
    essentialExpenses,
    freeCashFlow,
    savingsBalance,
    hasDebt,
    hasHighInterestDebt,
    goalsRemaining,
  } = args;

  const emergencyFundTarget = round2(essentialExpenses * 3);
  const emergencyMonthsCovered = essentialExpenses > 0 ? savingsBalance / essentialExpenses : 0;
  const emergencyGap = Math.max(0, emergencyFundTarget - savingsBalance);
  const rationale: string[] = [];

  if (freeCashFlow <= 0) {
    rationale.push(
      "Bugetul este pe minus sau exact la zero după cheltuieli și ratele minime, deci orice țintă de economisire ar fi nerealistă acum. Prima etapă este să aduci fluxul lunar pe plus.",
    );
    return {
      freeCashFlow: round2(freeCashFlow),
      emergencyFundTarget,
      emergencyFundCurrent: round2(savingsBalance),
      emergencyFundMonthsCovered: emergencyMonthsCovered,
      monthlyToEmergencyFund: 0,
      monthlyExtraToDebt: 0,
      monthlyToGoals: 0,
      monthlyBuffer: 0,
      realisticSavingsRate: 0,
      rationale,
    };
  }

  // A plan that assumes every leu is allocated perfectly fails in the first
  // month with an unexpected cost, so a slice stays unallocated on purpose.
  const buffer = round2(Math.min(freeCashFlow * 0.1, 300));
  let allocatable = round2(freeCashFlow - buffer);
  rationale.push(
    `Din cei ${round2(freeCashFlow)} rămași lunar, ${buffer} rămân nealocați ca tampon pentru cheltuieli neprevăzute. Restul de ${allocatable} se împarte mai jos.`,
  );

  let emergencyShare: number;
  if (emergencyMonthsCovered < 1) {
    emergencyShare = hasHighInterestDebt ? 0.4 : 0.7;
    rationale.push(
      emergencyMonthsCovered < 1 && hasHighInterestDebt
        ? "Nu ai încă nici măcar o lună de cheltuieli esențiale pusă deoparte, dar ai și datorii scumpe: 40% merge în fondul de urgență, 60% în accelerarea datoriilor."
        : "Nu ai încă o lună de cheltuieli esențiale pusă deoparte, deci prioritatea este fondul de urgență (70%).",
    );
  } else if (hasDebt) {
    emergencyShare = 0.2;
    rationale.push(
      "Ai deja tamponul minim de o lună, deci 80% din surplus merge în plăți suplimentare la datorii, unde dobânda te costă cel mai mult.",
    );
  } else {
    emergencyShare = emergencyMonthsCovered < 3 ? 0.7 : 0.3;
    rationale.push(
      emergencyMonthsCovered < 3
        ? "Fără datorii, surplusul completează fondul de urgență până la 3 luni de cheltuieli esențiale."
        : "Fondul de urgență acoperă deja 3 luni, deci surplusul merge în principal către obiectivele familiei.",
    );
  }

  let toEmergency = round2(Math.min(allocatable * emergencyShare, emergencyGap));
  allocatable = round2(allocatable - toEmergency);

  const toDebt = hasDebt ? allocatable : 0;
  allocatable = round2(allocatable - toDebt);

  let toGoals = round2(Math.min(allocatable, goalsRemaining));
  allocatable = round2(allocatable - toGoals);

  // Anything still unallocated (no debts, goals already funded) tops up the
  // emergency fund first and otherwise stays as extra savings.
  if (allocatable > 0) {
    const extraToEmergency = round2(Math.min(allocatable, Math.max(0, emergencyGap - toEmergency)));
    toEmergency = round2(toEmergency + extraToEmergency);
    allocatable = round2(allocatable - extraToEmergency);
    toGoals = round2(toGoals + allocatable);
    allocatable = 0;
  }

  if (toEmergency > 0) {
    const months = monthsToReach(emergencyFundTarget, toEmergency, savingsBalance);
    rationale.push(
      `Cu ${toEmergency} pe lună, fondul de urgență de ${emergencyFundTarget} (3 luni de cheltuieli esențiale) este complet în ${months ?? "-"} luni.`,
    );
  }
  if (toDebt > 0) {
    rationale.push(`${toDebt} pe lună în plus față de ratele minime scurtează semnificativ perioada de rambursare.`);
  }

  const saved = toEmergency + toGoals;
  return {
    freeCashFlow: round2(freeCashFlow),
    emergencyFundTarget,
    emergencyFundCurrent: round2(savingsBalance),
    emergencyFundMonthsCovered: emergencyMonthsCovered,
    monthlyToEmergencyFund: toEmergency,
    monthlyExtraToDebt: toDebt,
    monthlyToGoals: toGoals,
    monthlyBuffer: buffer,
    realisticSavingsRate: income > 0 ? saved / income : 0,
    rationale,
  };
}

function buildAlerts(snapshot: Omit<Snapshot, "alerts">): Alert[] {
  const alerts: Alert[] = [];
  const { totalIncome, freeCashFlow, debt, savings, categories, cuts } = snapshot;

  if (!snapshot.dataQuality.hasIncome) {
    alerts.push({
      level: "info",
      title: "Adaugă veniturile familiei",
      detail: "Fără venituri înregistrate nu pot calcula nimic realist. Începe cu salariile nete lunare.",
    });
    return alerts;
  }

  if (freeCashFlow < 0) {
    alerts.push({
      level: "critical",
      title: `Buget pe minus: ${formatAmount(freeCashFlow, snapshot.currency)}/lună`,
      detail: `Cheltuielile plus ratele minime depășesc veniturile cu ${formatAmount(Math.abs(freeCashFlow), snapshot.currency)}. Diferența se acoperă din economii sau din credite noi, ceea ce adâncește problema. Reducerile propuse acoperă ${formatAmount(cuts.reduce((s, c) => s + c.monthlySaving, 0), snapshot.currency)}.`,
    });
  } else if (freeCashFlow < totalIncome * 0.05) {
    alerts.push({
      level: "warning",
      title: "Marjă foarte mică la final de lună",
      detail: `Îți rămân doar ${formatAmount(freeCashFlow, snapshot.currency)} (${formatPercent(freeCashFlow / totalIncome)} din venit). O cheltuială neprevăzută te împinge pe minus.`,
    });
  }

  if (debt.unsustainable.length > 0) {
    alerts.push({
      level: "critical",
      title: "Datorii care nu scad deloc",
      detail: `La ${debt.unsustainable.join(", ")} plata minimă nu acoperă nici măcar dobânda lunară, deci soldul crește. Este nevoie de refinanțare, negociere sau plăți mai mari.`,
    });
  }

  if (debt.totalBalance > 0) {
    if (debt.debtToIncomeRatio > 0.4) {
      alerts.push({
        level: "critical",
        title: `Gradul de îndatorare este ${formatPercent(debt.debtToIncomeRatio, 0)}`,
        detail: `Ratele minime înseamnă ${formatAmount(debt.totalMinPayment, snapshot.currency)} din venitul de ${formatAmount(totalIncome, snapshot.currency)}. Peste 40% este zona în care băncile nu mai acordă credite și în care orice șoc de venit devine critic.`,
      });
    } else if (debt.debtToIncomeRatio > 0.3) {
      alerts.push({
        level: "warning",
        title: `Grad de îndatorare ridicat: ${formatPercent(debt.debtToIncomeRatio, 0)}`,
        detail: `Ratele minime consumă ${formatAmount(debt.totalMinPayment, snapshot.currency)} pe lună. Ținta sănătoasă este sub 30% din venitul net.`,
      });
    }
    alerts.push({
      level: debt.monthlyInterestCost > totalIncome * 0.05 ? "warning" : "info",
      title: `Dobânda te costă ${formatAmount(debt.monthlyInterestCost, snapshot.currency)} pe lună`,
      detail: `Sold total ${formatAmount(debt.totalBalance, snapshot.currency)} la o dobândă medie ponderată de ${formatPercent(debt.weightedAnnualRate)} pe an.`,
    });
  }

  if (savings.emergencyFundMonthsCovered < 1 && snapshot.essentialExpenses > 0) {
    alerts.push({
      level: "warning",
      title: "Fond de urgență insuficient",
      detail: `Economiile actuale acoperă ${formatDecimal(savings.emergencyFundMonthsCovered)} luni de cheltuieli esențiale. Prima țintă realistă este o lună, adică ${formatAmount(snapshot.essentialExpenses, snapshot.currency)}.`,
    });
  } else if (savings.emergencyFundMonthsCovered >= 3) {
    alerts.push({
      level: "good",
      title: "Fond de urgență solid",
      detail: `Economiile acoperă ${formatDecimal(savings.emergencyFundMonthsCovered)} luni de cheltuieli esențiale.`,
    });
  }

  for (const category of categories.filter((c) => c.overBenchmark > 0).slice(0, 2)) {
    alerts.push({
      level: "warning",
      title: `${category.label}: ${formatPercent(category.shareOfIncome, 0)} din venit`,
      detail: `Sunt ${formatAmount(category.overBenchmark, snapshot.currency)} peste reperul uzual de ${formatPercent(category.benchmarkMaxShare, 0)} din venitul net.`,
    });
  }

  if (snapshot.savings.realisticSavingsRate >= 0.1) {
    alerts.push({
      level: "good",
      title: `Poți economisi realist ${formatPercent(snapshot.savings.realisticSavingsRate)} din venit`,
      detail: `Adică ${formatAmount(snapshot.savings.monthlyToEmergencyFund + snapshot.savings.monthlyToGoals, snapshot.currency)} pe lună, din banii care îți rămân efectiv, nu dintr-o țintă teoretică.`,
    });
  }

  if (snapshot.oneOffThisMonth > 0) {
    alerts.push({
      level: snapshot.oneOffThisMonth > freeCashFlow ? "warning" : "info",
      title: `Cheltuieli excepționale luna aceasta: ${formatAmount(snapshot.oneOffThisMonth, snapshot.currency)}`,
      detail:
        snapshot.oneOffThisMonth > freeCashFlow
          ? "Depășesc surplusul lunar, deci luna aceasta planul de economisire se amână, nu se anulează."
          : "Sunt acoperite din surplusul lunii, fără să afecteze planul.",
    });
  }

  return alerts;
}

export function buildSnapshot(data: HouseholdData): Snapshot {
  const { profile, incomes, expenses, debts, goals, month } = data;

  const totalIncome = round2(incomes.reduce((sum, i) => sum + monthlyIncome(i), 0));
  const stableIncome = round2(
    incomes.filter((i) => i.stability === "stable").reduce((sum, i) => sum + monthlyIncome(i), 0),
  );
  const variableIncome = round2(totalIncome - stableIncome);

  const byMember = new Map<string, number>();
  for (const income of incomes) {
    const key = income.memberName?.trim() || "Familie";
    byMember.set(key, (byMember.get(key) ?? 0) + monthlyIncome(income));
  }

  const totalExpenses = round2(expenses.reduce((sum, e) => sum + monthlyExpense(e), 0));
  const essentialExpenses = round2(
    expenses.filter((e) => e.essential).reduce((sum, e) => sum + monthlyExpense(e), 0),
  );
  const nonEssentialExpenses = round2(totalExpenses - essentialExpenses);
  const fixedExpenses = round2(
    expenses.filter((e) => e.frequency === "monthly" || e.frequency === "yearly").reduce((sum, e) => sum + monthlyExpense(e), 0),
  );
  const oneOffThisMonth = round2(
    expenses.filter((e) => e.frequency === "one_off" && inMonth(e.date, month)).reduce((sum, e) => sum + e.amount, 0),
  );

  const debt = summarizeDebts(debts, totalIncome);
  const freeCashFlow = round2(totalIncome - totalExpenses - debt.totalMinPayment);
  const categories = buildCategories(expenses, totalExpenses, totalIncome);
  const cuts = buildCuts(categories, totalIncome);

  const goalsRemaining = goals.reduce((sum, g) => sum + Math.max(0, g.targetAmount - g.savedAmount), 0);
  const savings = buildSavingsPlan({
    income: totalIncome,
    essentialExpenses,
    freeCashFlow,
    savingsBalance: profile.savingsBalance,
    hasDebt: debt.totalBalance > 0,
    hasHighInterestDebt: debts.some((d) => d.balance > 0 && d.annualRate >= 0.15),
    goalsRemaining,
  });

  const payoff =
    debts.length > 0
      ? {
          minimum: simulatePayoff(debts, 0, "minimum"),
          avalanche: simulatePayoff(debts, savings.monthlyExtraToDebt, "avalanche"),
          snowball: simulatePayoff(debts, savings.monthlyExtraToDebt, "snowball"),
        }
      : null;

  const missing: string[] = [];
  if (incomes.length === 0) missing.push("venituri");
  if (expenses.length === 0) missing.push("cheltuieli");
  if (profile.savingsBalance === 0) missing.push("soldul economiilor");
  if (expenses.length > 0 && !categories.some((c) => c.category === "mancare")) {
    missing.push("cheltuielile cu mâncarea");
  }

  const base: Omit<Snapshot, "alerts"> = {
    currency: profile.currency,
    month,
    householdName: profile.name,
    people: profile.adults + profile.children,
    totalIncome,
    stableIncome,
    variableIncome,
    incomeByMember: [...byMember.entries()]
      .map(([member, monthly]) => ({ member, monthly: round2(monthly) }))
      .sort((a, b) => b.monthly - a.monthly),
    totalExpenses,
    essentialExpenses,
    nonEssentialExpenses,
    fixedExpenses,
    oneOffThisMonth,
    minimumDebtPayments: debt.totalMinPayment,
    freeCashFlow,
    savingsRate: totalIncome > 0 ? freeCashFlow / totalIncome : 0,
    needsShare: totalIncome > 0 ? (essentialExpenses + debt.totalMinPayment) / totalIncome : 0,
    wantsShare: totalIncome > 0 ? nonEssentialExpenses / totalIncome : 0,
    savingsShare: totalIncome > 0 ? Math.max(0, freeCashFlow) / totalIncome : 0,
    categories,
    debt,
    savings,
    cuts,
    payoff,
    dataQuality: {
      hasIncome: incomes.length > 0,
      hasExpenses: expenses.length > 0,
      hasDebts: debts.length > 0,
      missing,
    },
  };

  return { ...base, alerts: buildAlerts(base) };
}
