"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBudget } from "@/lib/budget-store";

const FEATURES = [
  {
    title: "Rămâne pe telefon",
    text: "Datele stau în browserul telefonului tău. Nu expiră un tunel, nu depind de un server temporar.",
  },
  {
    title: "Bugetul familiei, nu al unei persoane",
    text: "Adaugi salariul fiecărui adult, alocațiile și cheltuielile. Totul e convertit la lună.",
  },
  {
    title: "Plan de scăpare de datorii",
    text: "Simulare lună cu lună: plăți minime, avalanșă și bulgăre de zăpadă, din banii care îți rămân efectiv.",
  },
  {
    title: "Un agent care nu fabulează",
    text: "Răspunde doar cu cifre calculate din datele tale. Dacă nu are date, spune ce lipsește.",
  },
];

export default function LandingPage() {
  const { ready, state, signIn, loadDemo } = useBudget();
  const router = useRouter();

  useEffect(() => {
    if (ready && state.signedIn) router.replace("/panou");
  }, [ready, state.signedIn, router]);

  if (!ready) {
    return <p className="p-8 text-sm text-slate-500">Se încarcă...</p>;
  }

  return (
    <main className="flex-1">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.15fr_1fr]">
        <section>
          <span className="badge bg-brand-100 text-brand-800">Buget familial · pe telefon</span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Cât poți economisi <span className="text-brand-600">realist</span> luna asta?
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Deschizi site-ul pe telefon, îl poți adăuga pe ecranul principal, și rămâne acolo. Bugetul se salvează pe
            dispozitiv, nu pe un link care expiră.
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

        <section className="lg:pt-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-900">Deschide pe acest telefon</h2>
            <p className="mt-2 text-sm text-slate-600">
              Nu e nevoie de parolă. Intrarea rămâne pe telefonul tău. Pe iPhone/Android: Share → Add to Home Screen,
              ca să îl ai ca aplicație.
            </p>
            <div className="mt-6 space-y-3">
              <button
                type="button"
                className="btn-primary w-full py-3"
                onClick={() => {
                  signIn({ name: "Familia mea", email: "telefon@local" });
                  router.push("/panou");
                }}
              >
                Intră în bugetul familiei
              </button>
              <button
                type="button"
                className="btn-ghost w-full py-3"
                onClick={() => {
                  loadDemo();
                  router.push("/panou");
                }}
              >
                Intră cu date de exemplu
              </button>
            </div>
            <p className="mt-6 text-xs leading-relaxed text-slate-500">
              Dacă ștergi datele site-ului din browser, bugetul dispare de pe acest telefon. Pe același telefon, linkul
              rămâne valabil oricât.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
