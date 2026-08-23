# xleonplayz/test — ein Monorepo mit vielen Apps

Ein Prüfstand für die Erkennung: acht Apps in sechs Sprachen, verteilt
über die Verzeichnisse, in denen ein Monorepo sie üblicherweise ablegt.

```
                    ┌──────────────┐
   Browser ────────▶│   web-vue    │  Vite, 5173
                    └──────┬───────┘
                           │  WORKER_URL
                    ┌──────▼───────┐
                    │  worker-ts   │  8081 — das Bindeglied
                    └──┬────┬───┬──┘
        API_RUST_URL   │    │   │   API_PYTHON_URL
              ┌────────▼─┐  │   └────────────┐
              │ api-rust │  │ API_CPP_URL    │
              │   8082   │  │           ┌────▼───────┐
              └────┬─────┘  │           │ api-python │
                   │   ┌────▼────┐      │    8084    │
                   │   │ api-cpp │◀─────┤            │
                   │   │  8083   │      └────┬───────┘
                   │   └────┬────┘           │
                   └────────┴────────────────┘
                            │
                        Postgres

   worker-ts ──▶ Redis ◀── tools-js   (Warteschlange)
```

| Pfad | Sprache | Hafen | Ruft | Gerufen von |
|---|---|---|---|---|
| `apps/web-vue` | Vue 3 + Vite | 5173 | worker-ts | Browser |
| `apps/worker-ts` | TypeScript | 8081 | api-rust, api-cpp, api-python, Redis, Postgres | web-vue |
| `apps/api-rust` | Rust + Axum | 8082 | Postgres | worker-ts |
| `apps/api-cpp` | C++ + libpq | 8083 | Postgres | worker-ts, api-python |
| `services/api-python` | Python | 8084 | api-cpp, Postgres | worker-ts |
| `apps/tools-js` | JavaScript | 8085 | Redis, worker-ts | Mensch (CLI) |
| `apps/docs` | Next.js | 3000 | — | Browser |
| `packages/ui` | TypeScript | — | — | (Bibliothek) |

## Wie das System zusammenhängt

**Ein Bindeglied, nicht drei Wege aus dem Browser.** Die Oberfläche kennt
genau einen Dienst. Die drei dahinter stehen im inneren Netz und haben
keinen Grund, von außen erreichbar zu sein — wer sie direkt aus dem
Browser riefe, müsste sie öffnen und dort dreimal prüfen, was der Worker
einmal prüft.

**Jede Schwester über ihre eigene Variable.** Kein abgeleiteter Name,
kein „gleicher Host, anderer Port": in einer Zelle, in einem Container
und auf einer Entwicklermaschine liegen sie an drei verschiedenen Orten,
und nur die Umgebung weiß, wo. Deshalb `API_RUST_URL`, `API_CPP_URL`,
`API_PYTHON_URL` — und dieselben Binärdateien überall.

**Ein Teilausfall ist eine Antwort, kein Fehler.** Fällt eine Schwester
aus, kommt die Übersicht trotzdem — das fehlende Feld auf `null`, der
Name in `fehlend`. Nachgemessen mit abgeschossenem `api-cpp`:

```
alle drei da:              items=2  count=2     report=2  fehlend=[]
nur api-cpp abgeschossen:  items=2  count=None  report=2  fehlend=['api-cpp']
```

Eine Oberfläche, die weiß *was* fehlt, kann es sagen. Eine, die nur eine
Ausnahme bekommt, zeigt eine leere Seite.

**Jeder Dienst beantwortet `/topologie`** — wen er ruft und von wem er
gerufen wird. So steht die Karte in den Diensten selbst und nicht nur in
der Zeichnung oben, die veraltet.

### Was beim Bauen dieses Systems auffiel

**Redis darf den Start nicht blockieren.** Der Worker hatte
`await redis.connect()` vor `server.listen()`. Redis ist für ihn
entbehrlich — ohne ihn bleibt nur die Nacharbeit liegen. Das `await`
machte es doch unentbehrlich: der Client versucht es mit wachsenden
Pausen weiter, das Versprechen löst sich nie auf, und `listen` wird nie
erreicht. Der Prozess lief, der Hafen war zu, und im Protokoll stand
**keine einzige Zeile** — auch `/health` antwortete nicht, das mit Redis
nichts zu tun hat.

## Starten

```bash
docker compose up --build
curl localhost:8081/uebersicht
curl localhost:8081/topologie
open http://localhost:5173
```

`deploy/schema.sql` legt die Tabelle an, um die sich alles dreht. Sie
liegt dort und nicht bei einem der vier Dienste, die sie lesen — sonst
gäbe es vier Wahrheiten darüber, wie sie aussieht.

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

****Die Wurzel zählt NICHT mehr mit.** Sie tat es bis zum 23.08.: diese
`package.json` macht das Repo zu einem npm-Workspace, und die Erkennung
meldete die Wurzel deshalb als neunte App. Weil die Oberfläche alle
Funde vorauswählt, war sie angehakt — und die Vollanalyse geht rekursiv
durch das gewählte Verzeichnis. Die Wurzel bekam dreizehn Variablen und
drei Häfen zugeschrieben, von denen keiner einzigen ihr gehörte:

```
DATABASE_URL   ./services/api-python/api_python/server.py
REDIS_URL      ./apps/tools-js/src/cli.js
API_RUST_PORT  ./apps/api-rust/src/main.rs
```

Seit Raptor `70a310d` gilt: wo `"workspaces"` in der `package.json`
steht oder eine `pnpm-workspace.yaml` daneben liegt, ist das der
**Behälter** der Apps und nicht selbst eine. Kein Ratespiel — es steht
da.

Eine gewöhnliche App an der Wurzel wird weiterhin gemeldet, und ein
Workspace ohne Kinder auch: gar nichts zu melden wäre schlechter als
eine fragwürdige Wurzel.

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
