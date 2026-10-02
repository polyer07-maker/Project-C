"use client";

import { BudgetProvider } from "@/lib/budget-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return <BudgetProvider>{children}</BudgetProvider>;
}
