import { getDb, type DB } from "./db";
import { addDebt, addExpense, addGoal, addIncome, updateHousehold } from "./repo";

/** Realistic Romanian two-income family with debt pressure, used by the demo account. */
export function seedDemoHousehold(householdId: string, db: DB = getDb()): void {
  updateHousehold(householdId, {
    name: "Familia Demo",
    currency: "RON",
    adults: 2,
    children: 2,
    savingsBalance: 1800,
  }, db);

  addIncome(householdId, {
    label: "Salariu net",
    memberName: "Andrei",
    amount: 6200,
    frequency: "monthly",
    kind: "salary",
    stability: "stable",
  }, db);
  addIncome(householdId, {
    label: "Salariu net",
    memberName: "Ioana",
    amount: 4900,
    frequency: "monthly",
    kind: "salary",
    stability: "stable",
  }, db);
  addIncome(householdId, {
    label: "Alocații copii",
    memberName: "Familie",
    amount: 580,
    frequency: "monthly",
    kind: "benefit",
    stability: "stable",
  }, db);
  addIncome(householdId, {
    label: "Proiecte freelance",
    memberName: "Ioana",
    amount: 900,
    frequency: "monthly",
    kind: "other",
    stability: "variable",
  }, db);

  const expenses: Parameters<typeof addExpense>[1][] = [
    { label: "Rată ipotecă", category: "locuinta", amount: 2450, frequency: "monthly", essential: true },
    { label: "Întreținere", category: "locuinta", amount: 480, frequency: "monthly", essential: true },
    { label: "Curent și gaz", category: "utilitati", amount: 520, frequency: "monthly", essential: true },
    { label: "Internet și telefoane", category: "utilitati", amount: 210, frequency: "monthly", essential: true },
    { label: "Cumpărături alimentare", category: "mancare", amount: 620, frequency: "weekly", essential: true },
    { label: "Combustibil", category: "transport", amount: 700, frequency: "monthly", essential: true },
    { label: "RCA + ITP", category: "transport", amount: 1600, frequency: "yearly", essential: true },
    { label: "Grădiniță și after-school", category: "copii", amount: 1100, frequency: "monthly", essential: true },
    { label: "Abonament medical", category: "sanatate", amount: 180, frequency: "monthly", essential: true },
    { label: "Detergenți și cosmetice", category: "igiena", amount: 240, frequency: "monthly", essential: true },
    { label: "Livrări mâncare", category: "restaurante", amount: 780, frequency: "monthly", essential: false },
    { label: "Netflix, Spotify, HBO, iCloud", category: "abonamente", amount: 195, frequency: "monthly", essential: false },
    { label: "Sala de sport", category: "abonamente", amount: 260, frequency: "monthly", essential: false },
    { label: "Ieșiri weekend", category: "divertisment", amount: 450, frequency: "monthly", essential: false },
    { label: "Haine copii și adulți", category: "imbracaminte", amount: 380, frequency: "monthly", essential: false },
  ];
  for (const expense of expenses) addExpense(householdId, expense, db);

  addDebt(householdId, {
    name: "Card de credit",
    kind: "credit_card",
    balance: 9800,
    annualRate: 0.32,
    minPayment: 420,
  }, db);
  addDebt(householdId, {
    name: "Credit nevoi personale",
    kind: "personal_loan",
    balance: 21500,
    annualRate: 0.14,
    minPayment: 730,
  }, db);
  addDebt(householdId, {
    name: "Rate telefon (BNPL)",
    kind: "other",
    balance: 2400,
    annualRate: 0,
    minPayment: 200,
  }, db);

  addGoal(householdId, {
    name: "Vacanță de vară",
    targetAmount: 6000,
    savedAmount: 400,
    deadline: null,
  }, db);
  addGoal(householdId, {
    name: "Schimbat centrala termică",
    targetAmount: 8000,
    savedAmount: 0,
    deadline: null,
  }, db);
}
