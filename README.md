# xleonplayz/test — ein Monorepo mit vielen Apps

Ein Prüfstand für die Erkennung: acht Apps in sechs Sprachen, verteilt
über die Verzeichnisse, in denen ein Monorepo sie üblicherweise ablegt.

| Pfad | Sprache | Woran man es erkennt | Trägt |
|---|---|---|---|
| `apps/docs` | Next.js | `package.json` mit `next` | `NEXT_PUBLIC_SITE_URL` |
| `apps/web-vue` | Vue 3 + Vite | `package.json` | `VITE_API_BASE`, Port 5173 |
| `apps/worker-ts` | TypeScript | `package.json` | `DATABASE_URL`, Port 8081, Postgres (`pg`) |
| `apps/tools-js` | JavaScript | `package.json` | `LOG_LEVEL`, Redis |
| `apps/api-rust` | Rust | `Cargo.toml` | Port 8082, Postgres |
| `apps/api-cpp` | C++ | `CMakeLists.txt` | Port 8083, Postgres |
| `services/api-python` | Python | `pyproject.toml` | `PYTHON_API_PORT`, Port 8084 |
| `packages/ui` | TypeScript | `package.json` | gemeinsame Komponenten |

## Was dieser Prüfstand zutage gefördert hat

Am 22.08.2026 gegen den echten Void gefahren. Drei Apps hatten einen
**leeren** Vorschlag — null Variablen, null Ports, null Datenbanken —,
obwohl alles davon in der Datei nebenan stand:

| App | vorher | nachher |
|---|---|---|
| `apps/api-cpp` | 0 / 0 / 0 | **4 / 1 / 1** |
| `apps/api-rust` | 0 / 0 / 0 | **5 / 1 / 1** |
| `services/api-python` | 3 / 0 / 0 | **3 / 1 / 1** |

*(Variablen / Ports / Datenbanken)*

Drei Ursachen, alle im Raptor behoben (`1dc9f9b`):

1. **`.rs` und `.cpp` standen nicht in der Dateiliste.** Sie wurden nie
   durchsucht. Ein Rust- oder C++-Server wurde als App *erkannt* und
   danach zu null analysiert — für den Betrachter sah das aus wie „diese
   App hat keine Konfiguration".
2. **Die Muster kannten nur JS und Python.** Jetzt auch `env::var` /
   `env::var_os` (Rust), `getenv` (C/C++), `os.environ.get` und
   `os.getenv` (Python), `os.Getenv` (Go).
3. **`.env*` stand seit jeher in der Liste und wurde von keinem Muster
   gelesen.** Die anderen suchen *Aufrufe*, und `NAME=value` ist keiner.
   Eine `.env.example` mit vier Zeilen ergab null Funde.

Ports fanden sich nur über `listen(NNNN` — die Node-Form und sonst fast
nichts. Jetzt dazu das Tupel `("host", NNNN)` (Python, Rust),
`htons(NNNN)` (C) und aus einer `.env` jeder Name mit `PORT` darin.

## Was weiterhin gilt

**Die Analyse greppt Text, nicht Syntax.** Beim Bau dieses Repos stand
`os.environ['X']` in einem Doc-Kommentar — und die Analyse schlug prompt
eine Variable namens `X` vor. Wer in einem Kommentar ein Muster zitiert,
bekommt es als Fund zurück.

**Ein Name, der durch eine Variable geht, ist unsichtbar.**
`apps/api-cpp` liest drei seiner vier Werte über einen Helfer
`wert(name, vorgabe)` — dort steht `getenv(name)`, und `name` ist kein
Name, den man lesen kann. Nur `DATABASE_URL` steht wörtlich im
Quelltext; die anderen drei kommen aus der `.env.example`.

**`apps/docs` hat keinen Port.** Das ist richtig: Next.js nimmt ohne
Angabe 3000, und diese Zahl steht nirgends im Repo. Was nicht
dasteht, kann nicht gefunden werden.

****Die Wurzel zählt mit.** Diese `package.json` macht das Repo zu einem
npm-Workspace — und die Erkennung meldet die Wurzel deshalb als eigene
App (`javascript`). Das ist kein Fehler, sondern die Regel: wo eine
`package.json` liegt, ist eine App.

**Nur eine Ebene tief.** Gesucht wird in `apps packages services examples
tools libs backend frontend`, jeweils direkt darunter. Ein
`apps/gruppe/app` bliebe unsichtbar.

**Wer die Wurzel auswählt, bekommt alles auf einmal.** Die Analyse geht
rekursiv durch das gewählte Verzeichnis. Wählt man `.`, schreibt sie die
Variablen *jeder* Unter-App der Wurzel zu — `REDIS_URL`, `VITE_API_BASE`
und `DATABASE_URL` stehen dann nebeneinander, als gehörten sie einer App.
Gemessen an diesem Repo:

```
ENV  .  REDIS_URL      ./apps/tools-js/src/cli.js
ENV  .  VITE_API_BASE  ./apps/web-vue/src/main.js
ENV  .  DB_POOL_MAX    ./apps/worker-ts/src/server.ts
```

Die Fundstelle verrät es — aber die Liste sieht aus wie eine App mit
sehr vielen Variablen. In einem Monorepo wählt man die Apps einzeln.
