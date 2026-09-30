import { formatMonths, monthsToReach, round2 } from "./debt";
import type { Snapshot } from "./types";

export interface PlanStep {
  order: number;
  title: string;
  detail: string;
  amount: number | null;
  horizon: string;
  status: "urgent" | "next" | "later" | "done";
}

/**
 * Turns the computed snapshot into an ordered, concrete plan. Every amount
 * comes from the snapshot: nothing here invents a target the household cannot
 * actually cover.
 */
export function buildActionPlan(snapshot: Snapshot): PlanStep[] {
  const steps: PlanStep[] = [];
  const c = snapshot.currency;
  const { savings, debt, cuts, payoff } = snapshot;
  let order = 0;
  const next = () => ++order;

  if (!snapshot.dataQuality.hasIncome || !snapshot.dataQuality.hasExpenses) {
    steps.push({
      order: next(),
      title: "Completează datele de bază",
      detail: `Lipsesc: ${snapshot.dataQuality.missing.join(", ") || "date"}. Fără ele orice plan ar fi o presupunere, nu un calcul.`,
      amount: null,
      horizon: "acum",
      status: "urgent",
    });
    return steps;
  }

  if (snapshot.freeCashFlow < 0) {
    const gap = round2(Math.abs(snapshot.freeCashFlow));
    const possible = round2(cuts.reduce((s, x) => s + x.monthlySaving, 0));
    steps.push({
      order: next(),
      title: `Acoperă deficitul de ${gap} ${c} pe lună`,
      detail:
        possible >= gap
          ? `Reducerile realiste identificate însumează ${possible} ${c} pe lună și acoperă integral deficitul. Începe cu categoriile din lista de reduceri, în ordinea economiei obținute.`
          : `Reducerile realiste identificate însumează doar ${possible} ${c} pe lună, deci mai rămân ${round2(gap - possible)} ${c} neacoperiți. Aici tăierea cheltuielilor nu mai este suficientă: ai nevoie de venit suplimentar, de renegocierea ratelor sau de refinanțare. Nu îți pot promite că se rezolvă doar din economii.`,
      amount: gap,
      horizon: "luna aceasta",
      status: "urgent",
    });
  }

  if (debt.unsustainable.length > 0) {
    steps.push({
      order: next(),
      title: "Renegociază datoriile care nu scad",
      detail: `La ${debt.unsustainable.join(", ")} plata minimă nu acoperă dobânda, deci soldul crește lună de lună. Cere băncii reeșalonare, transfer de sold sau refinanțare înainte de orice plan de economisire.`,
      amount: null,
      horizon: "30 de zile",
      status: "urgent",
    });
  }

  if (savings.emergencyFundMonthsCovered < 1 && savings.monthlyToEmergencyFund > 0) {
    const target = round2(snapshot.essentialExpenses);
    const months = monthsToReach(target, savings.monthlyToEmergencyFund, savings.emergencyFundCurrent);
    steps.push({
      order: next(),
      title: `Construiește tamponul minim de ${target} ${c}`,
      detail: `O lună de cheltuieli esențiale, strânsă cu ${savings.monthlyToEmergencyFund} ${c} pe lună: ${formatMonths(months)}. Fără acest tampon, orice urgență se transformă într-o datorie nouă.`,
      amount: savings.monthlyToEmergencyFund,
      horizon: formatMonths(months),
      status: "next",
    });
  } else if (savings.emergencyFundMonthsCovered >= 1) {
    steps.push({
      order: next(),
      title: "Tamponul minim de o lună există deja",
      detail: `Economiile de ${savings.emergencyFundCurrent} ${c} acoperă ${savings.emergencyFundMonthsCovered.toFixed(1)} luni de cheltuieli esențiale.`,
      amount: null,
      horizon: "-",
      status: "done",
    });
  }

  if (payoff && debt.totalBalance > 0) {
    const best = payoff.avalanche.feasible ? payoff.avalanche : payoff.minimum;
    const saved = round2(payoff.minimum.totalInterest - payoff.avalanche.totalInterest);
    const target = best.order[0]?.name;
    steps.push({
      order: next(),
      title: savings.monthlyExtraToDebt > 0
        ? `Pune ${savings.monthlyExtraToDebt} ${c} în plus pe lună la ${target ?? "datoria cu dobânda cea mai mare"}`
        : "Menține plățile minime până apare surplus",
      detail:
        savings.monthlyExtraToDebt > 0
          ? `Metoda avalanșă (dobânda cea mai mare prima) stinge tot în ${formatMonths(payoff.avalanche.months)}, față de ${formatMonths(payoff.minimum.months)} cu plăți minime, și te scutește de ${saved} ${c} dobândă. Ratele minime la celelalte datorii rămân neschimbate.`
          : `În acest moment nu rămâne nimic pentru plăți suplimentare, deci datoriile se sting în ${formatMonths(payoff.minimum.months)} la ritmul actual. Orice leu eliberat din reduceri scurtează acest termen.`,
      amount: savings.monthlyExtraToDebt || null,
      horizon: formatMonths(best.months),
      status: debt.totalBalance > 0 ? "next" : "done",
    });
  }

  if (savings.emergencyFundMonthsCovered >= 1 && savings.monthlyToEmergencyFund > 0) {
    const months = monthsToReach(
      savings.emergencyFundTarget,
      savings.monthlyToEmergencyFund,
      savings.emergencyFundCurrent,
    );
    steps.push({
      order: next(),
      title: `Completează fondul de urgență până la ${savings.emergencyFundTarget} ${c}`,
      detail: `3 luni de cheltuieli esențiale, cu ${savings.monthlyToEmergencyFund} ${c} pe lună: ${formatMonths(months)}.`,
      amount: savings.monthlyToEmergencyFund,
      horizon: formatMonths(months),
      status: "later",
    });
  }

  if (savings.monthlyToGoals > 0) {
    steps.push({
      order: next(),
      title: `Alocă ${savings.monthlyToGoals} ${c} pe lună obiectivelor familiei`,
      detail: "Sumă disponibilă după fondul de urgență și plățile suplimentare la datorii.",
      amount: savings.monthlyToGoals,
      horizon: "lunar",
      status: "later",
    });
  }

  if (savings.monthlyBuffer > 0) {
    steps.push({
      order: next(),
      title: `Lasă ${savings.monthlyBuffer} ${c} nealocați în fiecare lună`,
      detail: "Tamponul pentru cheltuieli neprevăzute. Dacă nu îi cheltui, se adaugă la economii la final de lună.",
      amount: savings.monthlyBuffer,
      horizon: "lunar",
      status: "later",
    });
  }

  return steps;
}
