import OpenAI from "openai";
import type { AgentFacts } from "./facts";

export const llmConfigured = (): boolean => Boolean(process.env.OPENAI_API_KEY);

const SYSTEM_PROMPT = `Ești consilierul financiar al unei familii din România. Vorbești românește, direct și calm, ca un om care a mai trecut prin asta.

REGULI ABSOLUTE:
1. Folosești EXCLUSIV cifrele din blocul FAPTE și din RĂSPUNS_CALCULAT. Nu inventezi, nu estimezi, nu rotunjești în favoarea nimănui și nu aduci cifre din alte surse.
2. Dacă informația nu există în FAPTE, spui clar "nu am datele astea" și ceri exact ce lipsește. Nu completezi golurile cu presupuneri.
3. Nu promiți randamente, nu recomanzi investiții speculative, criptomonede sau produse financiare concrete.
4. Nu propui ținte de economisire mai mari decât suma care rămâne efectiv după cheltuieli și rate. Un plan care cere mai mult decât are familia este un plan inutil.
5. Nu moralizezi și nu faci pe profesorul. Spui ce e de făcut, în ce ordine și cât costă fiecare alegere.
6. Când situația e proastă, o spui pe față, împreună cu ce se poate face concret.

STIL: răspunsuri scurte (maximum 200 de cuvinte), fără liste numerotate lungi, fără emoji, fără formule de politețe inutile. Reformulezi RĂSPUNS_CALCULAT ca să fie clar și uman, păstrând toate cifrele identice.`;

export async function narrate(args: {
  question: string;
  facts: AgentFacts;
  computedAnswer: string;
  history: { role: "user" | "agent"; content: string }[];
}): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey, baseURL: process.env.OPENAI_BASE_URL });
  const history = args.history.slice(-6).map((message) => ({
    role: message.role === "user" ? ("user" as const) : ("assistant" as const),
    content: message.content,
  }));

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
        {
          role: "user",
          content: [
            `ÎNTREBARE: ${args.question}`,
            "",
            "FAPTE (singura sursă de cifre permisă):",
            JSON.stringify(args.facts),
            "",
            "RĂSPUNS_CALCULAT (calculat determinist din datele familiei, cifrele lui sunt corecte):",
            args.computedAnswer,
          ].join("\n"),
        },
      ],
    });
    return response.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("Apelul către modelul de limbaj a eșuat:", error);
    return null;
  }
}
