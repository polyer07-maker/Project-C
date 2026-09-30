"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { askAgent } from "@/lib/agent";
import { buildSnapshot } from "@/lib/finance/engine";
import { CATEGORY_KEYS } from "@/lib/finance/categories";
import {
  addDebt,
  addExpense,
  addGoal,
  addIncome,
  addMessage,
  clearMessages,
  deleteDebt,
  deleteExpense,
  deleteGoal,
  deleteIncome,
  listMessages,
  loadHouseholdData,
  updateHousehold,
} from "@/lib/repo";
import { requireSessionContext } from "@/lib/session";
import { seedDemoHousehold } from "@/lib/seed";

export interface ActionState {
  ok: boolean;
  message: string;
}

const amount = z.coerce.number().finite().min(0, "Suma nu poate fi negativă").max(100_000_000);
const frequency = z.enum(["monthly", "weekly", "yearly", "one_off"]);

function fail(error: unknown): ActionState {
  if (error instanceof z.ZodError) {
    return { ok: false, message: error.issues[0]?.message ?? "Date invalide" };
  }
  console.error(error);
  return { ok: false, message: "Nu am putut salva. Încearcă din nou." };
}

function revalidateAll(): void {
  for (const path of ["/panou", "/venituri", "/cheltuieli", "/datorii", "/obiective", "/analiza", "/agent"]) {
    revalidatePath(path);
  }
}

const incomeSchema = z.object({
  label: z.string().trim().min(2, "Dă o denumire venitului").max(80),
  memberName: z.string().trim().max(60).optional(),
  amount,
  frequency,
  kind: z.enum(["salary", "bonus", "benefit", "rent", "other"]),
  stability: z.enum(["stable", "variable"]),
});

export async function createIncome(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  try {
    const { household } = await requireSessionContext();
    const input = incomeSchema.parse(Object.fromEntries(formData));
    addIncome(household.id, {
      label: input.label,
      memberName: input.memberName?.trim() ? input.memberName.trim() : null,
      amount: input.amount,
      frequency: input.frequency,
      kind: input.kind,
      stability: input.stability,
    });
    revalidateAll();
    return { ok: true, message: `Am adăugat „${input.label}”.` };
  } catch (error) {
    return fail(error);
  }
}

export async function removeIncome(formData: FormData): Promise<void> {
  const { household } = await requireSessionContext();
  const id = z.string().min(1).parse(formData.get("id"));
  deleteIncome(household.id, id);
  revalidateAll();
}

const expenseSchema = z.object({
  label: z.string().trim().min(2, "Dă o denumire cheltuielii").max(80),
  category: z.enum(CATEGORY_KEYS as [string, ...string[]]),
  amount,
  frequency,
  essential: z.union([z.literal("on"), z.literal("true"), z.literal("false")]).optional(),
  date: z.string().trim().optional(),
});

export async function createExpense(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  try {
    const { household } = await requireSessionContext();
    const input = expenseSchema.parse(Object.fromEntries(formData));
    addExpense(household.id, {
      label: input.label,
      category: input.category as (typeof CATEGORY_KEYS)[number],
      amount: input.amount,
      frequency: input.frequency,
      essential: input.essential === "on" || input.essential === "true",
      date: input.frequency === "one_off" ? input.date || new Date().toISOString().slice(0, 10) : null,
    });
    revalidateAll();
    return { ok: true, message: `Am adăugat „${input.label}”.` };
  } catch (error) {
    return fail(error);
  }
}

export async function removeExpense(formData: FormData): Promise<void> {
  const { household } = await requireSessionContext();
  const id = z.string().min(1).parse(formData.get("id"));
  deleteExpense(household.id, id);
  revalidateAll();
}

const debtSchema = z.object({
  name: z.string().trim().min(2, "Dă un nume datoriei").max(80),
  kind: z.enum(["credit_card", "personal_loan", "mortgage", "car_loan", "overdraft", "family", "other"]),
  balance: amount,
  annualRatePercent: z.coerce.number().min(0).max(500),
  minPayment: amount,
});

export async function createDebt(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  try {
    const { household } = await requireSessionContext();
    const input = debtSchema.parse(Object.fromEntries(formData));
    addDebt(household.id, {
      name: input.name,
      kind: input.kind,
      balance: input.balance,
      annualRate: input.annualRatePercent / 100,
      minPayment: input.minPayment,
    });
    revalidateAll();
    return { ok: true, message: `Am adăugat „${input.name}”.` };
  } catch (error) {
    return fail(error);
  }
}

export async function removeDebt(formData: FormData): Promise<void> {
  const { household } = await requireSessionContext();
  const id = z.string().min(1).parse(formData.get("id"));
  deleteDebt(household.id, id);
  revalidateAll();
}

const goalSchema = z.object({
  name: z.string().trim().min(2, "Dă un nume obiectivului").max(80),
  targetAmount: amount,
  savedAmount: amount,
  deadline: z.string().trim().optional(),
});

export async function createGoal(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  try {
    const { household } = await requireSessionContext();
    const input = goalSchema.parse(Object.fromEntries(formData));
    addGoal(household.id, {
      name: input.name,
      targetAmount: input.targetAmount,
      savedAmount: input.savedAmount,
      deadline: input.deadline || null,
    });
    revalidateAll();
    return { ok: true, message: `Am adăugat obiectivul „${input.name}”.` };
  } catch (error) {
    return fail(error);
  }
}

export async function removeGoal(formData: FormData): Promise<void> {
  const { household } = await requireSessionContext();
  const id = z.string().min(1).parse(formData.get("id"));
  deleteGoal(household.id, id);
  revalidateAll();
}

const householdSchema = z.object({
  name: z.string().trim().min(2, "Dă un nume familiei").max(80),
  currency: z.enum(["RON", "EUR", "USD", "MDL"]),
  adults: z.coerce.number().int().min(1).max(10),
  children: z.coerce.number().int().min(0).max(15),
  savingsBalance: amount,
});

export async function saveHousehold(_prev: ActionState | undefined, formData: FormData): Promise<ActionState> {
  try {
    const { household } = await requireSessionContext();
    const input = householdSchema.parse(Object.fromEntries(formData));
    updateHousehold(household.id, input);
    revalidateAll();
    return { ok: true, message: "Am salvat datele familiei." };
  } catch (error) {
    return fail(error);
  }
}

export async function loadExampleData(): Promise<void> {
  const { household } = await requireSessionContext();
  seedDemoHousehold(household.id);
  revalidateAll();
}

export interface AgentActionResult {
  ok: boolean;
  answer: string;
  source: string;
  note: string | null;
}

export async function sendAgentMessage(question: string): Promise<AgentActionResult> {
  const { household } = await requireSessionContext();
  const trimmed = question.trim().slice(0, 500);
  if (trimmed.length < 2) {
    return { ok: false, answer: "Scrie o întrebare.", source: "calculat", note: null };
  }

  const data = loadHouseholdData(household);
  const snapshot = buildSnapshot(data);
  const history = listMessages(household.id, 10).map((message) => ({
    role: message.role,
    content: message.content,
  }));

  addMessage(household.id, "user", trimmed);
  const reply = await askAgent({ question: trimmed, snapshot, data, history });
  addMessage(household.id, "agent", reply.answer);
  revalidatePath("/agent");

  return {
    ok: true,
    answer: reply.answer,
    source: reply.source,
    note:
      reply.source === "ai-respins"
        ? `Răspunsul modelului de limbaj a fost respins: conținea cifre care nu există în datele tale (${reply.rejectedNumbers.join(", ")}). Îți arăt varianta calculată direct din buget.`
        : null,
  };
}

export async function resetConversation(): Promise<void> {
  const { household } = await requireSessionContext();
  clearMessages(household.id);
  revalidatePath("/agent");
}
