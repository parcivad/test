import Link from 'next/link';
import {
  ArrowRight,
  Package,
  Cpu,
  ListOrdered,
  RefreshCw,
  Clock,
  ShieldCheck,
  Terminal,
  Gauge,
} from 'lucide-react';

const features = [
  {
    icon: Package,
    title: 'Jobs sind Funktionen',
    body: 'Kein Scheduler-Objekt, das herumgereicht wird. Der Aufruf von job() ist gleichzeitig die Registrierung.',
    href: '/docs/konzepte/jobs',
  },
  {
    icon: ShieldCheck,
    title: 'Typen bleiben erhalten',
    body: 'Die Nutzlast von enqueue() hat denselben Typ wie der Parameter von run(). Kein any dazwischen.',
    href: '/docs/konzepte/jobs',
  },
  {
    icon: RefreshCw,
    title: 'Wiederholungen mit Backoff',
    body: 'Abstände verdoppeln sich, plus Zufallszuschlag — damit tausend gescheiterte Jobs nicht gleichzeitig wiederkommen.',
    href: '/docs/konzepte/wiederholungen',
  },
  {
    icon: ListOrdered,
    title: 'Warteschlangen trennen',
    body: 'Damit fünfhundert Berichte à zwei Minuten die Anmelde-Mails nicht zwanzig Stunden warten lassen.',
    href: '/docs/konzepte/warteschlangen',
  },
  {
    icon: Cpu,
    title: 'Worker skalieren einzeln',
    body: 'Starte so viele Prozesse, wie du willst. Sie koordinieren sich über den Speicher, nicht untereinander.',
    href: '/docs/konzepte/worker',
  },
  {
    icon: Terminal,
    title: 'CLI für den Ernstfall',
    body: 'Warteschlange anhalten, Gescheitertes ansehen, nach dem Fix erneut einreihen — ohne Code zu schreiben.',
    href: '/docs/referenz/cli',
  },
];

const codeDefinieren = `import { job } from 'wisp';

export const willkommensmail = job('willkommensmail', {
  wiederholungen: 5,
  async run({ nutzerId }: { nutzerId: string }, ctx) {
    const nutzer = await db.nutzer.find(nutzerId);
    ctx.log(\`schicke an \${nutzer.email}\`);
    await mail.send(nutzer.email, 'willkommen');
  },
});`;

const codeEinreihen = `// irgendwo im Anwendungscode
await willkommensmail.enqueue({ nutzerId: '42' });

// verzögert
await erinnerung.enqueue({ id }, { verzoegerung: '10m' });

// mit Vorrang
await mahnung.enqueue({ kundeId }, { prioritaet: 10 });`;

const logAusgabe = `$ npx wisp worker --nebenlaeufig 4

wisp  bereit — 3 Jobs registriert, Speicher: postgres
wisp  ▸ willkommensmail  #a91f  Versuch 1
      schicke an lena@example.org
wisp  ✓ willkommensmail  #a91f  240 ms
wisp  ▸ bild-umrechnen   #b30c  Versuch 1
wisp  ✗ bild-umrechnen   #b30c  EACCES: permission denied
wisp    → Wiederholung in 2 s (Versuch 2 von 5)`;

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden border-b border-fd-border">
        <div className="pointer-events-none absolute inset-0 hero-glow" aria-hidden />
        <div className="pointer-events-none absolute inset-0 hero-grid-bg" aria-hidden />

        <div className="relative mx-auto w-full max-w-6xl px-6 pt-20 pb-20 sm:pt-28 sm:pb-24">
          <div className="grid gap-12 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card/70 px-3 py-1 text-xs font-medium text-fd-muted-foreground backdrop-blur">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-fd-primary opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-fd-primary" />
                </span>
                v2.4 · Postgres und Redis
              </div>

              <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Hintergrundjobs, die sich wie{' '}
                <span className="bg-gradient-to-r from-fd-primary to-fd-primary/60 bg-clip-text text-transparent">
                  normaler Code
                </span>{' '}
                lesen.
              </h1>

              <p className="mt-6 max-w-xl text-lg text-fd-muted-foreground text-pretty">
                Wisp nimmt Arbeit entgegen, die nicht in den Request gehört:
                Mails, Bilder, nächtliche Berichte. Du schreibst eine Funktion —
                Reihenfolge, Wiederholungen und Ausfallsicherheit übernimmt Wisp.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/docs/erste-schritte/schnellstart"
                  className="group inline-flex items-center gap-2 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground transition-opacity hover:opacity-90"
                >
                  Schnellstart
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-card px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-fd-accent"
                >
                  Dokumentation
                </Link>
                <code className="rounded-lg border border-fd-border bg-fd-background px-3 py-2.5 font-mono text-sm text-fd-muted-foreground">
                  npm install wisp
                </code>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-background shadow-xl shadow-black/5">
              <div className="flex items-center gap-2 border-b border-fd-border px-4 py-2.5">
                <span className="size-2.5 rounded-full bg-fd-muted-foreground/30" />
                <span className="size-2.5 rounded-full bg-fd-muted-foreground/30" />
                <span className="size-2.5 rounded-full bg-fd-muted-foreground/30" />
                <span className="ml-2 font-mono text-xs text-fd-muted-foreground">
                  jobs/willkommensmail.ts
                </span>
              </div>
              <pre className="overflow-x-auto px-4 py-4 font-mono text-[12px] leading-[1.7]">
                <code>{codeDefinieren}</code>
              </pre>
            </div>
          </div>

          <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            {[
              ['2', 'Speicher-Adapter'],
              ['0', 'zusätzliche Dienste'],
              ['30 s', 'Pacht je Versuch'],
              ['~9 kB', 'gepackt'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-2xl font-semibold tabular-nums">{value}</dt>
                <dd className="mt-0.5 text-sm text-fd-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-fd-muted-foreground">
          Was drin ist
        </h2>
        <p className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Genug für den Ernstfall, wenig genug zum Behalten.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body, href }) => (
            <Link
              key={title}
              href={href}
              className="group relative flex flex-col rounded-xl border border-fd-border bg-fd-card p-5 transition-all hover:border-fd-primary/40 hover:shadow-lg hover:shadow-fd-primary/5"
            >
              <div className="flex size-9 items-center justify-center rounded-lg border border-fd-border bg-fd-background text-fd-primary">
                <Icon className="size-4.5" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
                {body}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-fd-primary">
                Lesen
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- Einreihen + Log ---------------- */}
      <section className="border-y border-fd-border bg-fd-card/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
          <div className="grid gap-10 [&>*]:min-w-0 lg:grid-cols-2 lg:gap-12">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-fd-muted-foreground">
                Einreihen
              </h2>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-balance">
                Ein Aufruf, kein Warten.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-fd-muted-foreground">
                <code className="font-mono">enqueue()</code> kehrt zurück,
                sobald der Job im Speicher liegt — nicht, wenn er fertig ist.
                Verzögerung und Vorrang sind Optionen, keine eigenen APIs.
              </p>
              <div className="mt-6 overflow-hidden rounded-xl border border-fd-border bg-fd-background">
                <pre className="overflow-x-auto px-4 py-4 font-mono text-[12px] leading-[1.7]">
                  <code>{codeEinreihen}</code>
                </pre>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-fd-muted-foreground">
                Zusehen
              </h2>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-balance">
                Fehlschläge sind eingeplant.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-fd-muted-foreground">
                Der Worker sagt dir, welcher Versuch läuft, woran er gescheitert
                ist und wann der nächste kommt. Nach dem letzten landet der Job
                in der Ablage — und bleibt dort, bis du ihn ansiehst.
              </p>
              <div className="mt-6 overflow-hidden rounded-xl border border-fd-border bg-fd-background">
                <pre className="overflow-x-auto px-4 py-4 font-mono text-[12px] leading-[1.7]">
                  <code>{logAusgabe}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Die Pacht ---------------- */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
        <div className="grid gap-10 [&>*]:min-w-0 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-14">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-fd-muted-foreground">
              Warum nichts verloren geht
            </h2>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Ein Worker bekommt den Job nicht. Er pachtet ihn.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-fd-muted-foreground">
              Solange die Pacht läuft, ist der Job für alle anderen unsichtbar.
              Stirbt der Worker, läuft sie ab und der nächste übernimmt. Daraus
              folgt beides: kein Job geht verloren — und ein Job kann mehr als
              einmal laufen.
            </p>
            <Link
              href="/docs/konzepte/warteschlangen"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-fd-primary hover:underline"
            >
              Wie die Pacht funktioniert
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: Clock,
                label: 'Pacht läuft ab',
                body: 'Nach 30 Sekunden ohne Lebenszeichen wird der Job wieder sichtbar.',
              },
              {
                icon: RefreshCw,
                label: 'Automatisch verlängert',
                body: 'Solange der Prozess lebt und die Ereignisschleife frei ist.',
              },
              {
                icon: ShieldCheck,
                label: 'Schlüssel gegen Doppel',
                body: 'Gleicher Eindeutigkeitsschlüssel — kein zweiter wartender Eintrag.',
              },
              {
                icon: Gauge,
                label: 'Sichtbar in Metriken',
                body: 'wisp_pacht_abgelaufen_gesamt zeigt, wie oft ein Worker starb.',
              },
            ].map(({ icon: Icon, label, body }) => (
              <div
                key={label}
                className="rounded-xl border border-fd-border bg-fd-card p-4"
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-fd-primary" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="relative overflow-hidden border-t border-fd-border">
        <div className="pointer-events-none absolute inset-0 hero-glow opacity-70" aria-hidden />
        <div className="relative mx-auto w-full max-w-6xl px-6 py-20 text-center sm:py-24">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Zehn Minuten bis zum ersten Job.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-fd-muted-foreground text-pretty">
            Installieren, Speicher wählen, Worker starten — der Schnellstart
            führt dich einmal durch alles, samt Fehlschlag zum Zusehen.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/docs/erste-schritte/schnellstart"
              className="group inline-flex items-center gap-2 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground transition-opacity hover:opacity-90"
            >
              Schnellstart lesen
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/docs/referenz/konfiguration"
              className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-card px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-fd-accent"
            >
              Konfiguration
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
