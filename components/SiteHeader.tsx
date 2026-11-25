import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-paper focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="shrink-0" aria-label="Badr University in Cairo, home">
          <Image src="/buc-logo.png" alt="Badr University in Cairo" width={528} height={192} priority className="h-12 w-auto sm:h-14" />
        </Link>
        <div className="sm:text-right">
          <p className="font-serif text-lg font-semibold leading-tight">Faculty of Engineering &amp; Technology</p>
          <p className="mt-1 text-sm leading-snug text-muted">
            Basic Science Department · Math 3 (BAS 113) · Fall 2026–2027
          </p>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-8 text-sm text-muted sm:flex-row sm:justify-between sm:px-6">
        <p>Badr University in Cairo · Faculty of Engineering &amp; Technology</p>
        <p className="font-mono text-[13px]">Basic Science Department · Math 3 (BAS 113) · Fall 2026–2027</p>
      </div>
    </footer>
  );
}
