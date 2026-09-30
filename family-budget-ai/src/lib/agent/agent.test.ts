import { describe, expect, it } from "vitest";
import { buildSnapshot } from "../finance/engine";
import type { HouseholdData } from "../finance/types";
import { buildFacts, collectAllowedNumbers } from "./facts";
import { extractNumbers, findUngroundedNumbers } from "./grounding";
import { answerFromRules, detectIntent, extractAmount } from "./rules";

const data: HouseholdData = {
  profile: { name: "Familia Test", currency: "RON", adults: 2, children: 2, savingsBalance: 1800 },
  incomes: [
    {
      id: "i1",
      label: "Salariu net",
      memberName: "Andrei",
      amount: 6200,
      frequency: "monthly",
      kind: "salary",
      stability: "stable",
      date: null,
    },
    {
      id: "i2",
      label: "Salariu net",
      memberName: "Ioana",
      amount: 4900,
      frequency: "monthly",
      kind: "salary",
      stability: "stable",
      date: null,
    },
  ],
  expenses: [
    {
      id: "e1",
      label: "Rată ipotecă",
      category: "locuinta",
      amount: 2450,
      frequency: "monthly",
      essential: true,
      date: null,
    },
    {
      id: "e2",
      label: "Cumpărături",
      category: "mancare",
      amount: 620,
      frequency: "weekly",
      essential: true,
      date: null,
    },
    {
      id: "e3",
      label: "Livrări mâncare",
      category: "restaurante",
      amount: 780,
      frequency: "monthly",
      essential: false,
      date: null,
    },
  ],
  debts: [
    { id: "d1", name: "Card de credit", balance: 9800, annualRate: 0.32, minPayment: 420, kind: "credit_card" },
    { id: "d2", name: "Nevoi personale", balance: 21500, annualRate: 0.14, minPayment: 730, kind: "personal_loan" },
  ],
  goals: [{ id: "g1", name: "Vacanță", targetAmount: 6000, savedAmount: 400, deadline: null }],
  month: "2026-01",
};

const snapshot = buildSnapshot(data);

describe("detectIntent", () => {
  it("recognises the common questions", () => {
    expect(detectIntent("Cât pot economisi pe lună?")).toBe("economisire");
    expect(detectIntent("În cât timp scap de datorii?")).toBe("datorii");
    expect(detectIntent("Unde se duc banii?")).toBe("cheltuieli");
    expect(detectIntent("Unde pot tăia?")).toBe("reduceri");
    expect(detectIntent("Ce fac cu fondul de urgență?")).toBe("fond_urgenta");
    expect(detectIntent("Îmi permit o vacanță de 6000 lei?")).toBe("permisiune_cumparatura");
  });
});

describe("extractAmount", () => {
  it("reads the amount from the question", () => {
    expect(extractAmount("Îmi permit o vacanță de 6000 lei?")).toBe(6000);
    expect(extractAmount("Pot să cumpăr o mașină de 12 mii?")).toBe(12000);
    expect(extractAmount("Merită să cumpăr ceva?")).toBeNull();
  });
});

describe("answerFromRules", () => {
  it("answers with the computed savings figure", () => {
    const answer = answerFromRules("Cât pot economisi?", snapshot);
    const expected = snapshot.savings.monthlyToEmergencyFund + snapshot.savings.monthlyToGoals;
    expect(answer).toContain(Math.round(expected).toLocaleString("ro-RO"));
  });

  it("says it has no data instead of estimating", () => {
    const empty = buildSnapshot({ ...data, incomes: [], expenses: [] });
    const answer = answerFromRules("Cât pot economisi?", empty);
    expect(answer).toContain("Nu pot să îți dau cifre corecte");
  });

  it("refuses an unaffordable purchase without inventing a plan", () => {
    const tight = buildSnapshot({
      ...data,
      expenses: [
        {
          id: "e1",
          label: "Rată ipotecă",
          category: "locuinta",
          amount: 10000,
          frequency: "monthly",
          essential: true,
          date: null,
        },
      ],
    });
    const answer = answerFromRules("Îmi permit o vacanță de 6000 lei?", tight);
    expect(answer).toContain("nu acum");
  });

  it("only quotes numbers that exist in the computed facts", () => {
    const facts = buildFacts(snapshot, data);
    const allowed = collectAllowedNumbers(facts);
    for (const question of [
      "Cât pot economisi?",
      "În cât timp scap de datorii?",
      "Unde se duc banii?",
      "Unde pot tăia?",
      "Care e situația fondului de urgență?",
      "Care sunt veniturile?",
      "De unde încep?",
    ]) {
      const answer = answerFromRules(question, snapshot);
      expect(findUngroundedNumbers(answer, allowed)).toEqual([]);
    }
  });
});

describe("grounding", () => {
  it("reads back an amount formatted with Romanian separators", () => {
    const answer = answerFromRules("Care sunt veniturile?", snapshot);
    expect(answer).toContain("11.100 lei");
    expect(extractNumbers(answer)).toContain(snapshot.totalIncome);
  });

  it("parses Romanian and plain number formats", () => {
    expect(extractNumbers("Ai 1.234,56 lei și 780 lei")).toEqual([1234.56, 780]);
    expect(extractNumbers("32% pe an")).toEqual([32]);
  });

  it("catches a number the model invented", () => {
    const facts = buildFacts(snapshot, data);
    const allowed = collectAllowedNumbers(facts);
    const hallucinated = "Poți economisi 4870 lei pe lună dacă renunți la 3 abonamente.";
    expect(findUngroundedNumbers(hallucinated, allowed)).toContain(4870);
  });

  it("accepts a rephrasing that keeps the computed numbers", () => {
    const facts = buildFacts(snapshot, data);
    const allowed = collectAllowedNumbers(facts);
    const grounded = `Venitul vostru este de ${snapshot.totalIncome} lei, iar după cheltuieli rămân ${snapshot.freeCashFlow} lei.`;
    expect(findUngroundedNumbers(grounded, allowed)).toEqual([]);
  });
});
