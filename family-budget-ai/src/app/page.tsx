import { redirect } from "next/navigation";
import { signInWithDemo, signInWithGoogle } from "./auth-actions";
import { demoLoginEnabled, googleConfigured } from "@/lib/auth";
import { getSessionContext } from "@/lib/session";

const FEATURES = [
  {
    title: "Bugetul familiei, nu al unei persoane",
    text: "Adaugi salariul fiecărui adult, alocațiile și venitul variabil, apoi toate cheltuielile: rate, utilități, mâncare, copii, abonamente. Aplicația normalizează totul la lună, inclusiv cheltuielile anuale sau săptămânale.",
  },
  {
    title: "Analiză financiară, nu impresii",
    text: "Vezi cât îți rămâne efectiv după cheltuieli și rate, cum se împarte venitul între nevoi, dorințe și economii, ce categorii depășesc reperele uzuale și cât te costă dobânda în fiecare lună.",
  },
  {
    title: "Plan concret de scăpare de datorii",
    text: "Simulare lună cu lună a rambursării, cu metoda avalanșă și bulgăre de zăpadă, ordinea în care ataci datoriile, data la care scapi de ele și dobânda economisită față de plata minimă.",
  },
  {
    title: "Un agent care nu fabulează",
    text: "Agentul răspunde folosind exclusiv cifrele calculate din datele tale. Orice sumă pe care modelul de limbaj o inventează este detectată automat și răspunsul este înlocuit cu varianta calculată.",
  },
];

export default async function LandingPage() {
  const context = await getSessionContext();
  if (context) redirect("/panou");

  return (
    <main className="flex-1">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[1.15fr_1fr] lg:py-20">
        <section>
          <span className="badge bg-brand-100 text-brand-800">Buget familial · România</span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Cât poți economisi <span className="text-brand-600">realist</span> luna asta?
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Introduci veniturile și cheltuielile familiei, iar aplicația îți spune exact câți bani îți rămân, unde se
            duc și în cât timp poți scăpa de datorii. Fără ținte inventate: fiecare cifră este calculată din bugetul
            tău, iar agentul AI are voie să folosească doar aceste cifre.
          </p>

          <dl className="mt-10 grid gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature.title}>
                <dt className="text-base font-semibold text-slate-900">{feature.title}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-slate-600">{feature.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="lg:pt-10">
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900">Intră în cont</h2>
            <p className="mt-2 text-sm text-slate-600">
              Te conectezi cu adresa de Gmail. Nu cerem parolă și nu avem acces la e-mailurile tale: primim doar numele,
              adresa de e-mail și poza de profil.
            </p>

            <div className="mt-6 space-y-3">
              {googleConfigured ? (
                <form action={signInWithGoogle}>
                  <button type="submit" className="btn-primary w-full py-2.5">
                    <GoogleIcon />
                    Continuă cu Gmail
                  </button>
                </form>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-medium">Conectarea cu Gmail nu este configurată pe acest server.</p>
                  <p className="mt-1">
                    Adaugă <code className="font-mono text-xs">AUTH_GOOGLE_ID</code> și{" "}
                    <code className="font-mono text-xs">AUTH_GOOGLE_SECRET</code> în fișierul{" "}
                    <code className="font-mono text-xs">.env.local</code> (instrucțiunile complete sunt în README).
                  </p>
                </div>
              )}

              {demoLoginEnabled && (
                <form action={signInWithDemo}>
                  <button type="submit" className="btn-ghost w-full py-2.5">
                    Intră în contul demo (date de exemplu)
                  </button>
                </form>
              )}
            </div>

            <p className="mt-6 text-xs leading-relaxed text-slate-500">
              Datele rămân pe serverul pe care rulează aplicația, într-o bază de date SQLite locală. Nu sunt trimise
              nicăieri, cu excepția întrebărilor puse agentului atunci când configurezi o cheie de API pentru un model
              de limbaj.
            </p>
          </div>

          <div className="card mt-6 bg-slate-900 text-slate-100">
            <h3 className="text-sm font-semibold tracking-wide text-brand-300 uppercase">De ce „realist”</h3>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-slate-300">
              <li>Nu îți propune să economisești mai mult decât îți rămâne după cheltuieli și rate.</li>
              <li>Lasă intenționat un tampon nealocat, pentru că lunile perfecte nu există.</li>
              <li>Reducerile sugerate sunt plafonate la cât se poate tăia dintr-o categorie fără să fie absurd.</li>
              <li>Când problema nu se rezolvă din economii, ți-o spune direct în loc să îți vândă optimism.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#fff"
        d="M21.35 11.1h-9.17v2.96h5.27c-.24 1.4-1.66 4.1-5.27 4.1-3.18 0-5.77-2.63-5.77-5.87s2.59-5.87 5.77-5.87c1.8 0 3.02.77 3.71 1.43l2.53-2.44C16.75 3.9 14.68 3 12.18 3 6.98 3 2.77 7.2 2.77 12.29s4.21 9.29 9.41 9.29c5.43 0 9.02-3.82 9.02-9.2 0-.62-.07-1.09-.15-1.28Z"
      />
    </svg>
  );
}
