# Beispiel: Fumadocs-Doku-Site

Eine vollständige Dokumentations-Site auf [Fumadocs](https://fumadocs.dev)
(Next.js 16, App Router, Tailwind v4) — Landing Page, Doku, Volltextsuche,
deutsche Oberfläche.

> **Der Inhalt ist frei erfunden.** „Wisp" ist ein ausgedachtes Produkt, das
> nur dazu dient, die Seite mit realistischem Text zu füllen. Es gibt kein
> solches Paket auf npm.

```bash
npm install
npm run dev     # http://localhost:3000
```

Build und Produktionsstart:

```bash
npm run build
npm start
```

## Struktur

| Pfad | Zweck |
|---|---|
| `content/docs/**.mdx` | der Doku-Inhalt; `meta.json` steuert Reihenfolge und Gruppen |
| `app/(home)/page.tsx` | Landing Page |
| `app/docs/[[...slug]]` | Doku-Layout und -Seiten |
| `app/api/search/route.ts` | Volltextsuche (Orama, serverseitig aus `source`) |
| `lib/source.ts` | Content-Adapter (`loader()` + `defineDocs`) |
| `lib/i18n.ts` | deutsche UI-Strings — Fumadocs liefert kein DE-Paket mit |
| `lib/layout.shared.tsx` | Navigation und Logo, geteilt zwischen Home und Docs |

## Eine Seite hinzufügen

MDX-Datei unter `content/docs/` anlegen, Frontmatter mit `title`,
`description` und optional `icon` (Lucide-Name), dann in der `meta.json` des
Ordners in `pages` eintragen. Ohne Eintrag erscheint sie alphabetisch hinter
den gelisteten.

Komponenten werden pro Datei importiert, z. B.:

```mdx
import { Callout } from 'fumadocs-ui/components/callout';
import { Steps, Step } from 'fumadocs-ui/components/steps';
```

Verfügbar sind unter anderem `callout`, `card`, `steps`, `tabs`, `accordion`,
`files` und `type-table`.

## Nebenrouten

`/llms.txt` und `/llms-full.txt` geben den Inhalt maschinenlesbar aus,
`/docs/<pfad>.md` liefert eine einzelne Seite als Markdown. Die
OG-Vorschaubilder werden unter `/og/docs/**/image.png` erzeugt.

Für Produktions-Deployments `NEXT_PUBLIC_SITE_URL` setzen — sonst zeigen die
OG-Metadaten auf `localhost:3000`.
