import { formatMonths, round2 } from "../finance/debt";
import { buildActionPlan, type PlanStep } from "../finance/plan";
import type { HouseholdData, Snapshot } from "../finance/types";

export interface AgentFacts {
  moneda: string;
  luna: string;
  familie: string;
  venitLunarTotal: number;
  venitStabil: number;
  venitVariabil: number;
  venitPePersoana: { persoana: string; lunar: number }[];
  cheltuieliLunareTotal: number;
  cheltuieliEsentiale: number;
  cheltuieliOptionale: number;
  rateMinimeDatorii: number;
  baniRamasiLunar: number;
  procentDinVenitRamas: number;
  categorii: {
    categorie: string;
    lunar: number;
    procentDinVenit: number;
    esential: boolean;
    pesteReperCu: number;
    detalii: { descriere: string; lunar: number }[];
  }[];
  datorii: {
    soldTotal: number;
    rateMinimeTotal: number;
    dobandaMedieAnualaProcent: number;
    costDobandaLunar: number;
    gradIndatorareProcent: number;
    datoriiCareNuScad: string[];
    lista: { nume: string; sold: number; dobandaAnualaProcent: number; rataMinima: number }[];
  };
  planEconomisire: {
    fondUrgentaTinta: number;
    fondUrgentaCurent: number;
    luniAcoperite: number;
    lunarCatreFondUrgenta: number;
    lunarExtraCatreDatorii: number;
    lunarCatreObiective: number;
    tamponNealocat: number;
    rataRealistaDeEconomisireProcent: number;
    explicatii: string[];
  };
  reduceriPosibile: {
    categorie: string;
    acum: number;
    propus: number;
    economieLunara: number;
    motiv: string;
  }[];
  reduceriTotal: { lunar: number; anual: number };
  scenariiRambursare: {
    doarRateMinime: { luni: string; dobandaTotala: number };
    avalansa: { luni: string; dobandaTotala: number; ordine: string[] };
    bulgareDeZapada: { luni: string; dobandaTotala: number; ordine: string[] };
    dobandaEconomisitaCuAvalansa: number;
  } | null;
  obiective: { nume: string; tinta: number; strans: number; ramasDeStrans: number }[];
  planPasi: PlanStep[];
  atentionari: { nivel: string; titlu: string; detaliu: string }[];
  dateLipsa: string[];
}

export function buildFacts(snapshot: Snapshot, data: HouseholdData): AgentFacts {
  const plan = buildActionPlan(snapshot);

  return {
    moneda: snapshot.currency,
    luna: snapshot.month,
    familie: snapshot.householdName,
    venitLunarTotal: snapshot.totalIncome,
    venitStabil: snapshot.stableIncome,
    venitVariabil: snapshot.variableIncome,
    venitPePersoana: snapshot.incomeByMember.map((m) => ({ persoana: m.member, lunar: m.monthly })),
    cheltuieliLunareTotal: snapshot.totalExpenses,
    cheltuieliEsentiale: snapshot.essentialExpenses,
    cheltuieliOptionale: snapshot.nonEssentialExpenses,
    rateMinimeDatorii: snapshot.minimumDebtPayments,
    baniRamasiLunar: snapshot.freeCashFlow,
    procentDinVenitRamas: round2(snapshot.savingsRate * 100),
    categorii: snapshot.categories.map((c) => ({
      categorie: c.label,
      lunar: c.monthly,
      procentDinVenit: round2(c.shareOfIncome * 100),
      esential: c.essential,
      pesteReperCu: c.overBenchmark,
      detalii: c.items.map((i) => ({ descriere: i.label, lunar: i.monthly })),
    })),
    datorii: {
      soldTotal: snapshot.debt.totalBalance,
      rateMinimeTotal: snapshot.debt.totalMinPayment,
      dobandaMedieAnualaProcent: round2(snapshot.debt.weightedAnnualRate * 100),
      costDobandaLunar: snapshot.debt.monthlyInterestCost,
      gradIndatorareProcent: round2(snapshot.debt.debtToIncomeRatio * 100),
      datoriiCareNuScad: snapshot.debt.unsustainable,
      lista: data.debts.map((d) => ({
        nume: d.name,
        sold: round2(d.balance),
        dobandaAnualaProcent: round2(d.annualRate * 100),
        rataMinima: round2(d.minPayment),
      })),
    },
    planEconomisire: {
      fondUrgentaTinta: snapshot.savings.emergencyFundTarget,
      fondUrgentaCurent: snapshot.savings.emergencyFundCurrent,
      luniAcoperite: round2(snapshot.savings.emergencyFundMonthsCovered),
      lunarCatreFondUrgenta: snapshot.savings.monthlyToEmergencyFund,
      lunarExtraCatreDatorii: snapshot.savings.monthlyExtraToDebt,
      lunarCatreObiective: snapshot.savings.monthlyToGoals,
      tamponNealocat: snapshot.savings.monthlyBuffer,
      rataRealistaDeEconomisireProcent: round2(snapshot.savings.realisticSavingsRate * 100),
      explicatii: snapshot.savings.rationale,
    },
    reduceriPosibile: snapshot.cuts.map((cut) => ({
      categorie: cut.label,
      acum: cut.currentMonthly,
      propus: cut.suggestedMonthly,
      economieLunara: cut.monthlySaving,
      motiv: cut.reason,
    })),
    reduceriTotal: {
      lunar: round2(snapshot.cuts.reduce((sum, cut) => sum + cut.monthlySaving, 0)),
      anual: round2(snapshot.cuts.reduce((sum, cut) => sum + cut.monthlySaving, 0) * 12),
    },
    scenariiRambursare: snapshot.payoff
      ? {
          doarRateMinime: {
            luni: formatMonths(snapshot.payoff.minimum.months),
            dobandaTotala: snapshot.payoff.minimum.totalInterest,
          },
          avalansa: {
            luni: formatMonths(snapshot.payoff.avalanche.months),
            dobandaTotala: snapshot.payoff.avalanche.totalInterest,
            ordine: snapshot.payoff.avalanche.order.map((o) => o.name),
          },
          bulgareDeZapada: {
            luni: formatMonths(snapshot.payoff.snowball.months),
            dobandaTotala: snapshot.payoff.snowball.totalInterest,
            ordine: snapshot.payoff.snowball.order.map((o) => o.name),
          },
          dobandaEconomisitaCuAvalansa: round2(
            snapshot.payoff.minimum.totalInterest - snapshot.payoff.avalanche.totalInterest,
          ),
        }
      : null,
    obiective: data.goals.map((g) => ({
      nume: g.name,
      tinta: round2(g.targetAmount),
      strans: round2(g.savedAmount),
      ramasDeStrans: round2(Math.max(0, g.targetAmount - g.savedAmount)),
    })),
    planPasi: plan,
    atentionari: snapshot.alerts.map((a) => ({ nivel: a.level, titlu: a.title, detaliu: a.detail })),
    dateLipsa: snapshot.dataQuality.missing,
  };
}

/**
 * Every number the agent is allowed to state, derived from the facts object.
 * Used to reject an answer that contains invented figures.
 */
export function collectAllowedNumbers(value: unknown, acc = new Set<number>()): Set<number> {
  if (typeof value === "number" && Number.isFinite(value)) {
    add(acc, value);
    return acc;
  }
  if (typeof value === "string") {
    for (const match of value.matchAll(/-?\d+(?:[.,]\d+)?/g)) {
      const parsed = Number(match[0].replace(",", "."));
      if (Number.isFinite(parsed)) add(acc, parsed);
    }
    return acc;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectAllowedNumbers(item, acc);
    return acc;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectAllowedNumbers(item, acc);
    return acc;
  }
  return acc;
}

function add(acc: Set<number>, value: number): void {
  const abs = Math.abs(value);
  acc.add(abs);
  acc.add(Math.round(abs));
  acc.add(Math.round(abs * 10) / 10);
  acc.add(Math.round(abs * 100) / 100);
  acc.add(Math.floor(abs));
  acc.add(Math.ceil(abs));
  // Ratios are often quoted as percentages.
  if (abs > 0 && abs <= 1) {
    acc.add(Math.round(abs * 1000) / 10);
    acc.add(Math.round(abs * 100));
  }
  // Monthly amounts are often quoted per year.
  acc.add(Math.round(abs * 12));
  acc.add(Math.round(abs * 12 * 100) / 100);
}
