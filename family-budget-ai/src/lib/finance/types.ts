export type Frequency = "monthly" | "weekly" | "yearly" | "one_off";

export type IncomeKind = "salary" | "bonus" | "benefit" | "rent" | "other";

export type IncomeStability = "stable" | "variable";

export type CategoryKey =
  | "locuinta"
  | "utilitati"
  | "mancare"
  | "transport"
  | "sanatate"
  | "educatie"
  | "copii"
  | "imbracaminte"
  | "abonamente"
  | "restaurante"
  | "divertisment"
  | "igiena"
  | "animale"
  | "altele";

export interface Income {
  id: string;
  label: string;
  memberName: string | null;
  amount: number;
  frequency: Frequency;
  kind: IncomeKind;
  stability: IncomeStability;
  date: string | null;
}

export interface Expense {
  id: string;
  label: string;
  category: CategoryKey;
  amount: number;
  frequency: Frequency;
  essential: boolean;
  date: string | null;
}

export interface Debt {
  id: string;
  name: string;
  balance: number;
  annualRate: number;
  minPayment: number;
  kind: "credit_card" | "personal_loan" | "mortgage" | "car_loan" | "overdraft" | "family" | "other";
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string | null;
}

export interface HouseholdProfile {
  name: string;
  currency: string;
  adults: number;
  children: number;
  savingsBalance: number;
}

export interface HouseholdData {
  profile: HouseholdProfile;
  incomes: Income[];
  expenses: Expense[];
  debts: Debt[];
  goals: Goal[];
  /** Reference month in `YYYY-MM` format used for the "current month" view. */
  month: string;
}

export interface CategoryBreakdownItem {
  category: CategoryKey;
  label: string;
  monthly: number;
  shareOfExpenses: number;
  shareOfIncome: number;
  essential: boolean;
  benchmarkMaxShare: number;
  /** Amount above the reference share of income; 0 when inside the reference range. */
  overBenchmark: number;
  items: { label: string; monthly: number }[];
}

export interface DebtSummary {
  totalBalance: number;
  totalMinPayment: number;
  weightedAnnualRate: number;
  monthlyInterestCost: number;
  debtToIncomeRatio: number;
  /** Debts whose minimum payment does not even cover the monthly interest. */
  unsustainable: string[];
}

export interface PayoffStep {
  month: number;
  totalPaid: number;
  interestPaid: number;
  remaining: number;
}

export interface DebtPayoffResult {
  strategy: "avalanche" | "snowball" | "minimum";
  months: number | null;
  totalInterest: number;
  totalPaid: number;
  monthlyPayment: number;
  order: { name: string; paidOffInMonth: number | null; interestPaid: number }[];
  /** Debt that currently receives the extra payment, or null for minimum-only. */
  extraTarget: string | null;
  timeline: PayoffStep[];
  feasible: boolean;
  note: string | null;
}

export interface SavingsPlan {
  /** Money genuinely left after every expense and minimum debt payment. */
  freeCashFlow: number;
  emergencyFundTarget: number;
  emergencyFundCurrent: number;
  emergencyFundMonthsCovered: number;
  monthlyToEmergencyFund: number;
  monthlyExtraToDebt: number;
  monthlyToGoals: number;
  monthlyBuffer: number;
  realisticSavingsRate: number;
  rationale: string[];
}

export interface CutSuggestion {
  category: CategoryKey;
  label: string;
  currentMonthly: number;
  suggestedMonthly: number;
  monthlySaving: number;
  reason: string;
}

export type AlertLevel = "critical" | "warning" | "info" | "good";

export interface Alert {
  level: AlertLevel;
  title: string;
  detail: string;
}

export interface Snapshot {
  currency: string;
  month: string;
  householdName: string;
  people: number;

  totalIncome: number;
  stableIncome: number;
  variableIncome: number;
  incomeByMember: { member: string; monthly: number }[];

  totalExpenses: number;
  essentialExpenses: number;
  nonEssentialExpenses: number;
  fixedExpenses: number;
  oneOffThisMonth: number;

  minimumDebtPayments: number;
  freeCashFlow: number;
  savingsRate: number;

  needsShare: number;
  wantsShare: number;
  savingsShare: number;

  categories: CategoryBreakdownItem[];
  debt: DebtSummary;
  savings: SavingsPlan;
  cuts: CutSuggestion[];
  alerts: Alert[];
  payoff: {
    minimum: DebtPayoffResult;
    avalanche: DebtPayoffResult;
    snowball: DebtPayoffResult;
  } | null;
  dataQuality: {
    hasIncome: boolean;
    hasExpenses: boolean;
    hasDebts: boolean;
    missing: string[];
  };
}
