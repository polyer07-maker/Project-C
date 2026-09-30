import { AgentChat, type ChatMessage } from "@/components/agent-chat";
import { llmConfigured } from "@/lib/agent/llm";
import { formatMoney, formatPercent } from "@/lib/format";
import { loadCurrentHousehold } from "@/lib/load";
import { listMessages } from "@/lib/repo";

export default async function AgentPage() {
  const { household, snapshot } = await loadCurrentHousehold();
  const currency = snapshot.currency;
  const history: ChatMessage[] = listMessages(household.id, 40).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
  }));
  const aiActive = llmConfigured();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Agentul care îți ține evidența</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
          Agentul lucrează în doi pași: mai întâi calculează răspunsul din datele tale, apoi (dacă este configurat un
          model de limbaj) îl reformulează ca să fie ușor de citit. Orice cifră din formularea finală este verificată
          față de calcule, iar dacă apare una care nu există în bugetul tău, răspunsul modelului este respins și vezi
          varianta calculată.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <AgentChat initialMessages={history} />

        <aside className="space-y-4">
          <div className="card">
            <h2 className="card-title">Ce știe agentul despre voi</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Venit lunar" value={formatMoney(snapshot.totalIncome, currency)} />
              <Row label="Cheltuieli lunare" value={formatMoney(snapshot.totalExpenses, currency)} />
              <Row label="Rate minime" value={formatMoney(snapshot.minimumDebtPayments, currency)} />
              <Row label="Rămâne lunar" value={formatMoney(snapshot.freeCashFlow, currency)} />
              <Row
                label="Economisire realistă"
                value={`${formatMoney(snapshot.savings.monthlyToEmergencyFund + snapshot.savings.monthlyToGoals, currency)} (${formatPercent(snapshot.savings.realisticSavingsRate, 0)})`}
              />
              <Row label="Datorii" value={formatMoney(snapshot.debt.totalBalance, currency)} />
              <Row label="Categorii urmărite" value={String(snapshot.categories.length)} />
            </dl>
            {snapshot.dataQuality.missing.length > 0 && (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                Ca să fie mai precis, mai are nevoie de: {snapshot.dataQuality.missing.join(", ")}.
              </p>
            )}
          </div>

          <div className="card">
            <h2 className="card-title">Mod de lucru</h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
              <li>
                <strong className="text-slate-800">Motor de calcul:</strong> activ mereu. Bugetul, planul de datorii și
                ținta de economisire se calculează determinist.
              </li>
              <li>
                <strong className="text-slate-800">Reformulare AI:</strong>{" "}
                {aiActive
                  ? "activă. Modelul primește doar faptele calculate și nu are voie să adauge cifre noi."
                  : "inactivă. Fără cheie de API configurată, primești direct răspunsurile calculate. Funcționează complet și așa."}
              </li>
              <li>
                <strong className="text-slate-800">Verificare:</strong> fiecare număr din răspuns este căutat în
                faptele calculate; ce nu se regăsește duce la respingerea răspunsului.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-slate-200 pb-1.5 last:border-0">
      <dt className="text-slate-600">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
