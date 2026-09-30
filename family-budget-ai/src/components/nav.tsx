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
  { href: "/agent", label: "Agent AI" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {LINKS.map((link) => {
        const active = pathname === link.href;
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
  );
}
