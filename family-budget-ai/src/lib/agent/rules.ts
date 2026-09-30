import { formatMonths, monthsToReach, round2 } from "../finance/debt";
import { formatAmount, formatDecimal, formatPercent } from "../format";
import { buildActionPlan } from "../finance/plan";
import type { Snapshot } from "../finance/types";

export type Intent =
  | "economisire"
  | "datorii"
  | "cheltuieli"
  | "reduceri"
  | "fond_urgenta"
  | "permisiune_cumparatura"
  | "venituri"
  | "plan"
  | "general";

const KEYWORDS: Record<Exclude<Intent, "general">, string[]> = {
  economisire: ["econom", "pun deoparte", "strâng", "strang", "cât pot pune", "cat pot pune", "salvez bani"],
  datorii: ["datori", "credit", "rata", "rată", "rate", "card", "împrumut", "imprumut", "dobând", "doband", "refinanț", "refinant"],
  cheltuieli: ["cheltui", "unde se duc", "pe ce", "categori", "buget pe", "analiz"],
  reduceri: ["reduc", "tai", "tăi", "renunț", "renunt", "unde pot tăia", "unde pot taia", "optimiz"],
  fond_urgenta: ["urgenț", "urgent", "fond", "siguranț", "sigurant", "rezerv"],
  permisiune_cumparatura: ["îmi permit", "imi permit", "pot să cumpăr", "pot sa cumpar", "merită să cumpăr", "merita sa cumpar", "vacanț", "vacant", "mașin", "masin"],
  venituri: ["venit", "salari", "câștig", "castig", "leafa", "leafă"],
  plan: ["plan", "ce fac", "de unde încep", "de unde incep", "pași", "pasi", "strategi"],
};

export function detectIntent(question: string): Intent {
  const q = question.toLowerCase();
  const scores = (Object.entries(KEYWORDS) as [Exclude<Intent, "general">, string[]][])
    .map(([intent, words]) => [intent, words.filter((w) => q.includes(w)).length] as const)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);
  return scores[0]?.[0] ?? "general";
}

/** First monetary amount mentioned in the question, e.g. "o vacanță de 6000 lei". */
export function extractAmount(question: string): number | null {
  const normalized = question.replace(/\./g, "").replace(/,/g, ".");
  const matches = [...normalized.matchAll(/(\d+(?:\.\d+)?)\s*(mii|k|lei|ron|€|eur|euro)?/gi)];
  for (const match of matches) {
    let value = Number(match[1]);
    if (!Number.isFinite(value)) continue;
    const unit = match[2]?.toLowerCase();
    if (unit === "mii" || unit === "k") value *= 1000;
    if (unit === "eur" || unit === "euro" || unit === "€") value *= 5;
    if (value >= 50) return round2(value);
  }
  return null;
}

const money = formatAmount;
const pct = formatPercent;

/**
 * Deterministic answers built straight from the computed snapshot. These are
 * the ground truth of the agent: the language model may only rephrase them,
 * never replace their numbers.
 */
export function answerFromRules(question: string, snapshot: Snapshot): string {
  const c = snapshot.currency;
  const intent = detectIntent(question);

  if (!snapshot.dataQuality.hasIncome || !snapshot.dataQuality.hasExpenses) {
    return [
      "Nu pot să îți dau cifre corecte încă, pentru că lipsesc date esențiale.",
      `Ce lipsește: ${snapshot.dataQuality.missing.join(", ") || "veniturile și cheltuielile"}.`,
      "Adaugă întâi veniturile nete lunare și cheltuielile recurente, iar apoi îți calculez exact cât poți economisi. Prefer să îți spun că nu știu decât să estimez la întâmplare.",
    ].join(" ");
  }

  switch (intent) {
    case "economisire":
      return savingsAnswer(snapshot);
    case "datorii":
      return debtAnswer(snapshot);
    case "cheltuieli":
      return spendingAnswer(snapshot);
    case "reduceri":
      return cutsAnswer(snapshot);
    case "fond_urgenta":
      return emergencyAnswer(snapshot);
    case "permisiune_cumparatura":
      return affordabilityAnswer(question, snapshot);
    case "venituri":
      return incomeAnswer(snapshot);
    case "plan":
      return planAnswer(snapshot);
    default:
      return [
        `Situația pe scurt: venit ${money(snapshot.totalIncome, c)} pe lună, cheltuieli ${money(snapshot.totalExpenses, c)}, rate minime ${money(snapshot.minimumDebtPayments, c)}.`,
        snapshot.freeCashFlow >= 0
          ? `Îți rămân ${money(snapshot.freeCashFlow, c)} pe lună, adică ${pct(snapshot.savingsRate)} din venit.`
          : `Ești pe minus cu ${money(Math.abs(snapshot.freeCashFlow), c)} pe lună.`,
        snapshot.debt.totalBalance > 0
          ? `Datorii totale ${money(snapshot.debt.totalBalance, c)}, dobândă medie ${pct(snapshot.debt.weightedAnnualRate)} pe an.`
          : "Nu ai datorii înregistrate.",
        "Întreabă-mă concret: cât pot economisi, unde pot tăia, în cât timp scap de datorii sau dacă îmi permit o anumită cheltuială.",
      ].join(" ");
  }
}

function savingsAnswer(snapshot: Snapshot): string {
  const c = snapshot.currency;
  const s = snapshot.savings;

  if (snapshot.freeCashFlow <= 0) {
    const cuts = round2(snapshot.cuts.reduce((sum, x) => sum + x.monthlySaving, 0));
    return [
      `Răspunsul sincer: acum nu poți economisi nimic. După cheltuieli (${money(snapshot.totalExpenses, c)}) și ratele minime (${money(snapshot.minimumDebtPayments, c)}), din venitul de ${money(snapshot.totalIncome, c)} ${snapshot.freeCashFlow === 0 ? "nu mai rămâne nimic" : `lipsesc ${money(Math.abs(snapshot.freeCashFlow), c)}`}.`,
      cuts > 0
        ? `Reducerile realiste pe care le văd în datele tale însumează ${money(cuts, c)} pe lună. Dacă le aplici, abia atunci apare spațiu de economisire.`
        : "Nu găsesc reduceri realiste în categoriile actuale, deci soluția trece prin venit suplimentar sau renegocierea ratelor.",
    ].join(" ");
  }

  const total = round2(s.monthlyToEmergencyFund + s.monthlyToGoals);
  return [
    `Poți economisi realist ${money(total, c)} pe lună, adică ${pct(s.realisticSavingsRate)} din venitul net.`,
    `Asta iese din cei ${money(s.freeCashFlow, c)} care îți rămân efectiv: ${money(s.monthlyToEmergencyFund, c)} în fondul de urgență, ${money(s.monthlyExtraToDebt, c)} în plus la datorii, ${money(s.monthlyToGoals, c)} către obiective și ${money(s.monthlyBuffer, c)} tampon nealocat.`,
    `Tamponul rămâne intenționat nealocat: un plan care consumă fiecare leu pică la prima cheltuială neprevăzută.`,
    s.rationale[1] ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

function debtAnswer(snapshot: Snapshot): string {
  const c = snapshot.currency;
  if (snapshot.debt.totalBalance <= 0) {
    return "Nu ai nicio datorie înregistrată. Dacă ai una care nu apare aici, adaug-o ca să pot calcula corect.";
  }

  const payoff = snapshot.payoff!;
  const parts = [
    `Ai ${money(snapshot.debt.totalBalance, c)} datorii, cu rate minime de ${money(snapshot.debt.totalMinPayment, c)} pe lună și o dobândă medie ponderată de ${pct(snapshot.debt.weightedAnnualRate)} pe an. Numai dobânda te costă ${money(snapshot.debt.monthlyInterestCost, c)} lunar.`,
  ];

  if (snapshot.debt.unsustainable.length > 0) {
    parts.push(
      `Atenție: la ${snapshot.debt.unsustainable.join(", ")} plata minimă nu acoperă nici dobânda, deci soldul crește. Aici nu ajută disciplina, ci renegocierea sau refinanțarea.`,
    );
  }

  if (snapshot.savings.monthlyExtraToDebt > 0) {
    parts.push(
      `Cu ${money(snapshot.savings.monthlyExtraToDebt, c)} în plus pe lună (atât permite bugetul tău, nu mai mult), metoda avalanșă trimite extra la ${payoff.avalanche.extraTarget ?? "datoria cu dobânda cea mai mare"} și stinge tot în ${formatMonths(payoff.avalanche.months)} și te costă ${money(payoff.avalanche.totalInterest, c)} dobândă, față de ${formatMonths(payoff.minimum.months)} și ${money(payoff.minimum.totalInterest, c)} cu plăți minime. Economisești ${money(payoff.minimum.totalInterest - payoff.avalanche.totalInterest, c)} din dobândă.`,
      `Ordinea în care se sting: ${payoff.avalanche.order.map((o) => o.name).join(" → ")}.`,
    );
  } else {
    parts.push(
      `În acest moment nu rămâne nimic pentru plăți suplimentare, deci la ritmul actual datoriile se sting în ${formatMonths(payoff.minimum.months)}, cu ${money(payoff.minimum.totalInterest, c)} dobândă plătită. Fiecare leu eliberat din reduceri scurtează acest termen.`,
    );
  }

  if (payoff.snowball.feasible && payoff.avalanche.feasible && payoff.snowball.months !== payoff.avalanche.months) {
    parts.push(
      `Alternativa bulgăre de zăpadă (cea mai mică datorie prima) durează ${formatMonths(payoff.snowball.months)} și costă ${money(payoff.snowball.totalInterest, c)} dobândă. Matematic e mai scumpă, dar dacă ai nevoie de victorii rapide ca să nu renunți, e o opțiune validă.`,
    );
  }

  return parts.join(" ");
}

function spendingAnswer(snapshot: Snapshot): string {
  const c = snapshot.currency;
  const top = snapshot.categories.slice(0, 5);
  const lines = top.map(
    (cat) =>
      `${cat.label}: ${money(cat.monthly, c)} pe lună (${pct(cat.shareOfIncome)} din venit${cat.overBenchmark > 0 ? `, cu ${money(cat.overBenchmark, c)} peste reperul uzual` : ""})`,
  );
  return [
    `Cheltuielile lunare totalizează ${money(snapshot.totalExpenses, c)}: ${money(snapshot.essentialExpenses, c)} esențiale și ${money(snapshot.nonEssentialExpenses, c)} opționale.`,
    `Primele categorii: ${lines.join("; ")}.`,
    snapshot.oneOffThisMonth > 0
      ? `Luna aceasta ai și ${money(snapshot.oneOffThisMonth, c)} cheltuieli excepționale, care nu intră în media lunară.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function cutsAnswer(snapshot: Snapshot): string {
  const c = snapshot.currency;
  if (snapshot.cuts.length === 0) {
    return `Nu găsesc reduceri pe care să ți le propun cu conștiința curată: nicio categorie nu depășește reperele uzuale pentru venitul tău de ${money(snapshot.totalIncome, c)}. Dacă vrei mai mult spațiu în buget, pârghia realistă este venitul, nu tăierile.`;
  }
  const total = round2(snapshot.cuts.reduce((sum, x) => sum + x.monthlySaving, 0));
  const lines = snapshot.cuts.map(
    (cut) =>
      `${cut.label}: de la ${money(cut.currentMonthly, c)} la ${money(cut.suggestedMonthly, c)}, adică ${money(cut.monthlySaving, c)} pe lună`,
  );
  return [
    `Reduceri realiste, în ordinea impactului: ${lines.join("; ")}.`,
    `Total recuperabil: ${money(total, c)} pe lună, adică ${money(total * 12, c)} pe an.`,
    "Nu propun eliminarea completă a niciunei categorii, pentru că planurile de tip „nu mai cheltui nimic pe plăceri” se abandonează în două luni.",
  ].join(" ");
}

function emergencyAnswer(snapshot: Snapshot): string {
  const c = snapshot.currency;
  const s = snapshot.savings;
  const oneMonth = round2(snapshot.essentialExpenses);
  const monthsToOne = monthsToReach(oneMonth, s.monthlyToEmergencyFund, s.emergencyFundCurrent);
  const monthsToFull = monthsToReach(s.emergencyFundTarget, s.monthlyToEmergencyFund, s.emergencyFundCurrent);

  return [
    `Fondul de urgență recomandat este ${money(s.emergencyFundTarget, c)} (3 luni de cheltuieli esențiale de ${money(snapshot.essentialExpenses, c)}). Acum ai ${money(s.emergencyFundCurrent, c)}, adică ${formatDecimal(s.emergencyFundMonthsCovered)} luni acoperite.`,
    s.monthlyToEmergencyFund > 0
      ? `Cu ${money(s.monthlyToEmergencyFund, c)} pe lună ajungi la prima treaptă (o lună, ${money(oneMonth, c)}) în ${formatMonths(monthsToOne)} și la ținta completă în ${formatMonths(monthsToFull)}.`
      : "Momentan bugetul nu permite nicio contribuție lunară, deci prima mișcare este eliberarea de bani din cheltuieli sau venit suplimentar.",
  ].join(" ");
}

function affordabilityAnswer(question: string, snapshot: Snapshot): string {
  const c = snapshot.currency;
  const amount = extractAmount(question);
  const s = snapshot.savings;
  const monthlyForGoals = round2(s.monthlyToGoals + s.monthlyBuffer);

  if (amount === null) {
    return `Spune-mi suma și îți calculez exact. Pentru context: îți rămân ${money(snapshot.freeCashFlow, c)} pe lună, din care ${money(monthlyForGoals, c)} pot merge către cheltuieli planificate fără să strici planul de datorii și fondul de urgență.`;
  }

  if (monthlyForGoals <= 0) {
    return `Pentru ${money(amount, c)} răspunsul este nu, nu acum. După cheltuieli, rate și fondul de urgență nu rămâne nimic pe care să îl pot aloca acestui obiectiv fără să întârzii scăparea de datorii. Ca să nu te mint: ar însemna să plătești din credit, adică o cheltuială mai mare decât pare.`;
  }

  const months = monthsToReach(amount, monthlyForGoals);
  return [
    `Pentru ${money(amount, c)}: poți aloca ${money(monthlyForGoals, c)} pe lună fără să afectezi ratele și fondul de urgență, deci îți ia ${formatMonths(months)} să strângi suma.`,
    snapshot.debt.totalBalance > 0
      ? `Alternativa onestă: aceiași bani puși pe datorii îți scurtează rambursarea, pentru că dobânda medie este ${pct(snapshot.debt.weightedAnnualRate)} pe an. Decizia e a ta, dar acestea sunt costurile reale.`
      : "Nu ai datorii care să concureze cu acest obiectiv, deci e o alocare curată.",
  ].join(" ");
}

function incomeAnswer(snapshot: Snapshot): string {
  const c = snapshot.currency;
  const perMember = snapshot.incomeByMember
    .map((m) => `${m.member}: ${money(m.monthly, c)}`)
    .join("; ");
  return [
    `Venitul lunar al familiei este ${money(snapshot.totalIncome, c)} (${perMember}).`,
    `Din acesta, ${money(snapshot.stableIncome, c)} este stabil și ${money(snapshot.variableIncome, c)} variabil.`,
    snapshot.variableIncome > 0
      ? "Planul de economisire se construiește pe venitul stabil; venitul variabil îl tratez ca bonus, nu ca bază."
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function planAnswer(snapshot: Snapshot): string {
  const steps = buildActionPlan(snapshot);
  const lines = steps.map((step) => `${step.order}. ${step.title} — ${step.detail}`);
  return ["Planul tău, în ordinea în care are sens să îl execuți:", ...lines].join("\n");
}
