const CURRENCY_LABEL: Record<string, string> = {
  RON: "lei",
  EUR: "€",
  USD: "$",
  MDL: "lei MD",
};

export function formatMoney(value: number, currency = "RON", decimals = 0): string {
  const formatted = value.toLocaleString("ro-RO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formatted} ${CURRENCY_LABEL[currency] ?? currency}`;
}

export function formatPercent(ratio: number, decimals = 1): string {
  return `${(ratio * 100).toFixed(decimals).replace(".", ",")}%`;
}

export function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });
}

export const FREQUENCY_LABEL: Record<string, string> = {
  monthly: "lunar",
  weekly: "săptămânal",
  yearly: "anual",
  one_off: "o singură dată",
};

export const DEBT_KIND_LABEL: Record<string, string> = {
  credit_card: "Card de credit",
  personal_loan: "Credit nevoi personale",
  mortgage: "Credit ipotecar",
  car_loan: "Credit auto",
  overdraft: "Descoperit de cont",
  family: "Împrumut de la cineva apropiat",
  other: "Altă datorie",
};

export const INCOME_KIND_LABEL: Record<string, string> = {
  salary: "Salariu",
  bonus: "Bonus / primă",
  benefit: "Alocație / ajutor",
  rent: "Chirie încasată",
  other: "Alt venit",
};
