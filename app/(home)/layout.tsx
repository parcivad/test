import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import Link from 'next/link';
import { appName } from '@/lib/shared';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout {...baseOptions()}>
      {children}
      <footer className="mt-auto border-t border-fd-border bg-fd-card/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-fd-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-semibold text-fd-foreground">{appName}</span>{' '}
            — Beispielprojekt. Produkt und Doku sind frei erfunden.
          </p>
          <nav className="flex gap-6">
            <Link href="/docs" className="transition-colors hover:text-fd-foreground">
              Dokumentation
            </Link>
            <Link
              href="/docs/referenz/cli"
              className="transition-colors hover:text-fd-foreground"
            >
              CLI
            </Link>
            <Link href="/llms.txt" className="transition-colors hover:text-fd-foreground">
              llms.txt
            </Link>
          </nav>
        </div>
      </footer>
    </HomeLayout>
  );
}
