import Image from "next/image";
import Link from "next/link";
import { signOutAction } from "../auth-actions";
import { Nav } from "@/components/nav";
import { requireSessionContext } from "@/lib/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { user, household } = await requireSessionContext();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/panou" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                B
              </span>
              <span className="text-sm font-semibold text-slate-900">{household.name}</span>
            </Link>
          </div>

          <Nav />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {user.image ? (
                <Image
                  src={user.image}
                  alt=""
                  width={28}
                  height={28}
                  className="rounded-full"
                  unoptimized
                />
              ) : (
                <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                  {(user.name ?? user.email).slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="hidden text-xs text-slate-500 sm:block">{user.email}</span>
            </div>
            <form action={signOutAction}>
              <button type="submit" className="text-xs font-medium text-slate-500 transition hover:text-slate-900">
                Ieși
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>

      <footer className="border-t border-slate-200 bg-white py-5">
        <p className="mx-auto max-w-6xl px-6 text-xs leading-relaxed text-slate-500">
          Aplicația calculează pe baza datelor pe care le introduci tu. Nu oferă consultanță financiară autorizată și nu
          înlocuiește discuția cu banca sau cu un consultant, mai ales în situații de supraîndatorare.
        </p>
      </footer>
    </div>
  );
}
