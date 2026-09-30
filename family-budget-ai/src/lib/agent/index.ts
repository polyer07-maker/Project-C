import type { HouseholdData, Snapshot } from "../finance/types";
import { buildFacts, collectAllowedNumbers } from "./facts";
import { findUngroundedNumbers } from "./grounding";
import { llmConfigured, narrate } from "./llm";
import { answerFromRules } from "./rules";

export type AgentSource = "calculat" | "ai-verificat" | "ai-respins";

export interface AgentReply {
  answer: string;
  source: AgentSource;
  rejectedNumbers: number[];
}

/**
 * The agent never lets a language model produce figures on its own: the
 * numbers are computed from the household data, the model only rephrases
 * them, and the result is rejected if it contains a figure that cannot be
 * traced back to those computations.
 */
export async function askAgent(args: {
  question: string;
  snapshot: Snapshot;
  data: HouseholdData;
  history: { role: "user" | "agent"; content: string }[];
}): Promise<AgentReply> {
  const { question, snapshot, data, history } = args;
  const computed = answerFromRules(question, snapshot);

  if (!llmConfigured()) {
    return { answer: computed, source: "calculat", rejectedNumbers: [] };
  }

  const facts = buildFacts(snapshot, data);
  const narrated = await narrate({ question, facts, computedAnswer: computed, history });
  if (!narrated) {
    return { answer: computed, source: "calculat", rejectedNumbers: [] };
  }

  const allowed = collectAllowedNumbers(facts);
  collectAllowedNumbers(computed, allowed);
  const ungrounded = findUngroundedNumbers(narrated, allowed);

  if (ungrounded.length > 0) {
    return {
      answer: computed,
      source: "ai-respins",
      rejectedNumbers: ungrounded,
    };
  }

  return { answer: narrated, source: "ai-verificat", rejectedNumbers: [] };
}
