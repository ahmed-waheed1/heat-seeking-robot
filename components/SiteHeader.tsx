import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/#simulation", label: "Simulation" },
  { href: "/#model", label: "Model" },
  { href: "/#code", label: "Code" },
  { href: "/#team", label: "Team" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-forest/15 bg-paper">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="shrink-0" aria-label="Badr University in Cairo, home">
          <Image src="/buc-logo.png" alt="Badr University in Cairo" width={528} height={192} priority className="h-12 w-auto sm:h-14" />
        </Link>
        <p className="text-sm leading-snug text-muted sm:text-right">
          Faculty of Engineering &amp; Technology
          <br />
          Basic Science Department
          <br />
          <span className="font-mono text-[13px] text-ink">Math 3 · BAS 113 · Fall 2026–2027</span>
        </p>
      </div>
      <nav aria-label="Main" className="border-t border-forest/10">
        <ul className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-1 gap-y-2 px-4 py-2.5 sm:px-6">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-forest hover:bg-card">
                {l.label}
              </Link>
            </li>
          ))}
          <li className="ml-auto">
            <Link
              href="/explore"
              className="inline-block rounded-[12px] bg-ember px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
            >
              3D hill →
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-forest text-[#d6e3d9]">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm sm:flex-row sm:justify-between sm:px-6">
        <p>
          <span className="font-serif text-base text-white">Following the Heat to Its Source</span>
          <br />
          Badr University in Cairo · Faculty of Engineering &amp; Technology
        </p>
        <p className="sm:text-right">
          Basic Science Department
          <br />
          <span className="font-mono">Math 3 (BAS 113) · Fall 2026–2027</span>
        </p>
      </div>
    </footer>
  );
}
