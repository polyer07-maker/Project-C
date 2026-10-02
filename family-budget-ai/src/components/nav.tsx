"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/panou", label: "Panou" },
  { href: "/venituri", label: "Venituri" },
  { href: "/cheltuieli", label: "Cheltuieli" },
  { href: "/datorii", label: "Datorii" },
  { href: "/obiective", label: "Obiective" },
  { href: "/analiza", label: "Analiză" },
  { href: "/agent", label: "Agent" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden flex-wrap items-center gap-1 md:flex">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname === `${link.href}/`;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-4 gap-0">
          {LINKS.slice(0, 4).map((link) => {
            const active = pathname === link.href || pathname === `${link.href}/`;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex min-h-12 flex-col items-center justify-center px-1 py-2 text-[11px] font-medium ${
                    active ? "text-brand-700" : "text-slate-500"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <ul className="grid grid-cols-3 border-t border-slate-100">
          {LINKS.slice(4).map((link) => {
            const active = pathname === link.href || pathname === `${link.href}/`;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex min-h-11 items-center justify-center px-1 py-2 text-[11px] font-medium ${
                    active ? "text-brand-700" : "text-slate-500"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
