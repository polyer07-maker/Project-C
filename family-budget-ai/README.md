# Buget Familie AI

Aplicație web de bugetare familială: te conectezi cu adresa de Gmail, introduci salariile și cheltuielile, iar aplicația îți dă o analiză financiară completă și un plan concret de scăpare de datorii. Un agent AI ține evidența cheltuielilor și răspunde la întrebări, dar **nu are voie să inventeze cifre**: toate sumele sunt calculate determinist din datele tale, iar orice număr pe care modelul de limbaj îl produce în plus este detectat și răspunsul este respins.

## Ce face

- **Conectare cu Gmail** (Google OAuth, prin Auth.js). Nu se cere parolă și nu se accesează e-mailurile: doar nume, adresă și poză de profil.
- **Venituri** per membru al familiei: salariu, bonus, alocații, chirii. Frecvență lunară, săptămânală, anuală sau ocazională, normalizată automat la lună. Veniturile marcate „variabile” nu sunt folosite ca bază pentru plan.
- **Cheltuieli** pe 14 categorii, fiecare marcată esențială sau opțională, cu echivalent lunar calculat pentru frecvențele neregulate.
- **Datorii** cu sold, dobândă anuală și plată minimă.
- **Analiză financiară**: cât rămâne efectiv după cheltuieli și rate, împărțirea nevoi/dorințe/economii, categoriile care depășesc reperele uzuale, costul lunar al dobânzii, gradul de îndatorare, starea fondului de urgență.
- **Plan de scăpare de datorii**: simulare lună cu lună, comparație între plăți minime, metoda avalanșă și metoda bulgăre de zăpadă, ordinea de atac, dobânda economisită și data la care scapi.
- **Plan de economisire realist**: surplusul real este împărțit între fond de urgență, plăți suplimentare la datorii și obiective, cu un tampon lăsat intenționat nealocat.
- **Agent AI** cu care discuți în română despre bugetul tău: cât poți economisi, unde poți tăia, în cât timp scapi de datorii, dacă îți permiți o anumită cheltuială.

## De ce nu fabulează

Aceasta este partea centrală a aplicației, nu un detaliu:

1. **Motorul de calcul** (`src/lib/finance/`) calculează totul determinist: fluxul lunar, categoriile, amortizarea datoriilor lună cu lună, alocarea surplusului. Este acoperit de teste.
2. **Faptele** (`src/lib/agent/facts.ts`) sunt un obiect JSON cu exact aceste valori calculate.
3. **Răspunsul calculat** (`src/lib/agent/rules.ts`) este formulat direct din fapte, fără model de limbaj. Aplicația funcționează complet și fără nicio cheie de API.
4. **Reformularea** (`src/lib/agent/llm.ts`) este opțională: modelul primește faptele și răspunsul calculat, cu instrucțiunea explicită de a nu introduce cifre noi.
5. **Verificarea** (`src/lib/agent/grounding.ts`) extrage fiecare număr din răspunsul modelului și îl caută în faptele calculate (inclusiv variantele rotunjite, procentuale și anualizate). Dacă apare un număr care nu se regăsește, răspunsul modelului este respins și utilizatorul vede varianta calculată, împreună cu explicația.

În plus, planul în sine este construit să fie realist:

- ținta de economisire nu depășește niciodată banii care rămân efectiv după cheltuieli și rate minime;
- o parte din surplus rămane intenționat nealocată, ca tampon pentru lunile imperfecte;
- reducerile sugerate sunt plafonate per categorie (de exemplu maximum 20% la mâncare, 60% la restaurante) și nu coboară sub reperul uzual pentru venitul respectiv;
- dacă deficitul nu poate fi acoperit prin reduceri, aplicația spune direct că e nevoie de venit suplimentar, renegociere sau refinanțare, în loc să propună o țintă imposibilă;
- dacă plata minimă a unei datorii nu acoperă nici dobânda, situația este marcată ca atare, iar simularea returnează „nu se stinge” în loc de un termen fabricat.

## Instalare

```bash
cd family-budget-ai
npm install
cp .env.example .env.local
npm run dev
```

Aplicația pornește pe `http://localhost:3000`.

### Conectarea cu Gmail

1. Intră în [Google Cloud Console](https://console.cloud.google.com/) și creează un proiect.
2. `APIs & Services` → `OAuth consent screen`: alege „External”, completează datele aplicației și adaugă-ți adresa ca test user.
3. `APIs & Services` → `Credentials` → `Create credentials` → `OAuth client ID` → tip `Web application`.
4. La `Authorized redirect URIs` adaugă:
   - `http://localhost:3000/api/auth/callback/google` pentru dezvoltare;
   - `https://domeniul-tau.ro/api/auth/callback/google` pentru producție.
5. Copiază `Client ID` și `Client secret` în `.env.local`:

```env
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

Cât timp Google nu este configurat, aplicația afișează un buton de **cont demo** cu datele unei familii de exemplu (două salarii, doi copii, trei datorii), ca să poți vedea imediat cum arată analiza. Îl poți forța cu `DEMO_LOGIN=on` sau dezactiva cu `DEMO_LOGIN=off`.

### Reformularea AI (opțională)

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
# opțional, pentru orice provider compatibil cu API-ul OpenAI
OPENAI_BASE_URL=https://...
```

Fără cheie, agentul răspunde cu textele calculate. Cu cheie, răspunsurile sunt reformulate, dar trecute prin verificarea de mai sus.

## Comenzi

| Comandă | Ce face |
| --- | --- |
| `npm run dev` | server de dezvoltare |
| `npm run build` | build de producție |
| `npm start` | rulează build-ul de producție |
| `npm test` | testele motorului financiar și ale agentului |
| `npm run lint` | ESLint |
| `npm run typecheck` | verificare de tipuri (rulează după un `npm run build`, care generează tipurile de rute) |

## Structura

```
src/
├── app/
│   ├── page.tsx              pagina publică + conectare
│   ├── actions.ts            server actions (CRUD + agent)
│   ├── api/auth/             Auth.js
│   └── (app)/                zona autentificată
│       ├── panou/            sumar + alerte
│       ├── venituri/         venituri
│       ├── cheltuieli/       cheltuieli
│       ├── datorii/          datorii + simulare
│       ├── obiective/        obiective + date familie
│       ├── analiza/          analiza completă și planul
│       └── agent/            discuția cu agentul
├── components/               UI (fără dependențe de grafice externe)
└── lib/
    ├── finance/              motorul de calcul (engine, debt, plan, categories)
    ├── agent/                fapte, reguli, LLM, verificare
    ├── db.ts, repo.ts        SQLite
    ├── auth.ts, session.ts   autentificare
    └── seed.ts               datele contului demo
```

## Date și stocare

Datele stau într-o bază SQLite locală (`data/app.db`, configurabilă cu `DATABASE_PATH`) și nu părăsesc serverul. Singura excepție este întrebarea trimisă modelului de limbaj împreună cu faptele calculate, atunci când configurezi o cheie de API.

## Limitări asumate

- Reperele per categorie (procente din venitul net) sunt orientative și calibrate pentru o familie din România; sunt folosite doar ca să semnaleze o categorie ca fiind peste nivelul uzual, niciodată ca țintă impusă.
- Verificarea numerelor nu analizează valorile mai mici sau egale cu 12, pentru că acolo apar numerotări și numărul de luni; cifrele care contează (sume și procente mari) sunt verificate integral.
- Simularea datoriilor presupune dobândă constantă și plăți la termen; nu modelează penalități de întârziere sau dobânzi variabile.
- Aplicația nu oferă consultanță financiară autorizată. În situații de supraîndatorare, discuția cu banca sau cu un consultant rămâne necesară.
