"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Nav } from "@/components/nav";
import { useBudget } from "@/lib/budget-store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { ready, state, signOut } = useBudget();
  const router = useRouter();

  useEffect(() => {
    if (ready && !state.signedIn) router.replace("/");
  }, [ready, state.signedIn, router]);

  if (!ready || !state.signedIn) {
    return <p className="p-8 text-sm text-slate-500">Se încarcă bugetul de pe telefon...</p>;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col pb-28 md:pb-0">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              B
            </span>
            <span className="truncate text-sm font-semibold text-slate-900">{state.household.name}</span>
          </div>
          <Nav />
          <button
            type="button"
            onClick={() => {
              signOut();
              router.replace("/");
            }}
            className="text-xs font-medium text-slate-500"
          >
            Ieși
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
