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

## Was hier absichtlich schiefgeht

Der Prüfstand ist nicht nur dafür da, zu zeigen, dass es klappt.

**Die Vollanalyse liest `.rs` und `.cpp` nicht.** Sie sucht Umgebungs-
variablen als `process.env.X` und `os.environ['X']`, und nur in
`*.js *.ts *.jsx *.tsx *.mjs *.py *.go *.env*`. Ports findet sie über
`listen(NNNN` in denselben Dateien. Ein Rust- oder C++-Server wird also
als App **erkannt**, seine Konfiguration aber **nicht gefunden** — obwohl
sie danebensteht.

`apps/api-rust` und `apps/api-cpp` tragen trotzdem eine `.env.example`.
Sie hilft der Analyse **nicht** — nachgemessen, nicht vermutet:

```
$ find apps/api-rust -name '*.env*'
apps/api-rust/.env.example          ← die Datei WIRD gefunden
$ grep -c 'process\.env\.' apps/api-rust/.env.example
0                                    ← und kein Muster greift darin
```

Die Datei landet in der Dateiliste, aber die beiden Muster suchen
Code-Formen. `DATABASE_URL=…` trifft keines. `*.env*` steht damit in der
Liste, ohne dass irgendetwas es liest. Die `.env.example` ist hier für
Menschen da, nicht für die Analyse.

**`os.environ.get()` wird nicht gefunden.** Das Muster trifft nur die
Klammerform `os.environ['NAME']`. `services/api-python` benutzt deshalb
durchweg die Klammerform — mit `.get()` bekäme man eine Variable, die
niemandem vorgeschlagen wird.

**Die Analyse liest auch Kommentare.** Beim ersten Bau dieses Repos stand
`os.environ['X']` in einem Docstring, und die Analyse schlug prompt eine
Variable namens `X` vor. Sie greppt Text, nicht Syntax.

**Die Wurzel zählt mit.** Diese `package.json` macht das Repo zu einem
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
