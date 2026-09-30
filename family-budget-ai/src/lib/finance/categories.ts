import type { CategoryKey } from "./types";

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  essentialByDefault: boolean;
  /**
   * Upper bound of the commonly used reference range for this category, as a
   * share of net household income. Used only to flag a category as "peste
   * reperul uzual" - never to invent a target for the user.
   */
  benchmarkMaxShare: number;
  /** Maximum share of the current spend that can realistically be cut. */
  maxRealisticCut: number;
  examples: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    key: "locuinta",
    label: "Locuință",
    essentialByDefault: true,
    benchmarkMaxShare: 0.35,
    maxRealisticCut: 0.1,
    examples: "chirie, rată ipotecară, întreținere, asigurare locuință",
  },
  {
    key: "utilitati",
    label: "Utilități",
    essentialByDefault: true,
    benchmarkMaxShare: 0.1,
    maxRealisticCut: 0.15,
    examples: "curent, gaz, apă, internet, telefon",
  },
  {
    key: "mancare",
    label: "Mâncare (cumpărături)",
    essentialByDefault: true,
    benchmarkMaxShare: 0.2,
    maxRealisticCut: 0.2,
    examples: "cumpărături săptămânale, piață",
  },
  {
    key: "transport",
    label: "Transport",
    essentialByDefault: true,
    benchmarkMaxShare: 0.15,
    maxRealisticCut: 0.2,
    examples: "combustibil, abonament STB, service, RCA",
  },
  {
    key: "sanatate",
    label: "Sănătate",
    essentialByDefault: true,
    benchmarkMaxShare: 0.08,
    maxRealisticCut: 0.05,
    examples: "medicamente, consultații, abonament medical",
  },
  {
    key: "educatie",
    label: "Educație",
    essentialByDefault: true,
    benchmarkMaxShare: 0.1,
    maxRealisticCut: 0.1,
    examples: "taxe școlare, cursuri, rechizite",
  },
  {
    key: "copii",
    label: "Copii",
    essentialByDefault: true,
    benchmarkMaxShare: 0.12,
    maxRealisticCut: 0.15,
    examples: "grădiniță, after-school, activități",
  },
  {
    key: "igiena",
    label: "Igienă și curățenie",
    essentialByDefault: true,
    benchmarkMaxShare: 0.05,
    maxRealisticCut: 0.2,
    examples: "detergenți, cosmetice de bază",
  },
  {
    key: "imbracaminte",
    label: "Îmbrăcăminte",
    essentialByDefault: false,
    benchmarkMaxShare: 0.05,
    maxRealisticCut: 0.5,
    examples: "haine, încălțăminte",
  },
  {
    key: "abonamente",
    label: "Abonamente",
    essentialByDefault: false,
    benchmarkMaxShare: 0.03,
    maxRealisticCut: 0.7,
    examples: "streaming, sală, aplicații",
  },
  {
    key: "restaurante",
    label: "Restaurante și livrări",
    essentialByDefault: false,
    benchmarkMaxShare: 0.06,
    maxRealisticCut: 0.6,
    examples: "mâncare comandată, cafenea, ieșiri în oraș",
  },
  {
    key: "divertisment",
    label: "Divertisment și vacanțe",
    essentialByDefault: false,
    benchmarkMaxShare: 0.07,
    maxRealisticCut: 0.6,
    examples: "cinema, concerte, city break",
  },
  {
    key: "animale",
    label: "Animale de companie",
    essentialByDefault: false,
    benchmarkMaxShare: 0.04,
    maxRealisticCut: 0.25,
    examples: "hrană, veterinar",
  },
  {
    key: "altele",
    label: "Altele",
    essentialByDefault: false,
    benchmarkMaxShare: 0.05,
    maxRealisticCut: 0.4,
    examples: "cheltuieli neîncadrate",
  },
];

const BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]));

export function categoryMeta(key: CategoryKey): CategoryMeta {
  return BY_KEY.get(key) ?? BY_KEY.get("altele")!;
}

export function categoryLabel(key: CategoryKey): string {
  return categoryMeta(key).label;
}

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);
