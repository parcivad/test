import {createServer} from "node:http"
import {Pool} from "pg"
import {createClient} from "redis"

/*
 * Der Worker — das Bindeglied des Systems.
 *
 * Er ist die EINZIGE Stelle, die die Oberflaeche kennt, und die einzige,
 * die alle drei Dienste kennt. Die Oberflaeche fragt ihn; er fragt
 * weiter und legt die Antworten zusammen.
 *
 *   web-vue ──▶ worker-ts ──┬──▶ api-rust    (Liste der Eintraege)
 *                           ├──▶ api-cpp     (Zaehlwerk)
 *                           └──▶ api-python  (Bericht)
 *                           │
 *                           └──▶ Redis       (Warteschlange fuer tools-js)
 *
 * Warum ein Bindeglied und nicht drei Aufrufe aus dem Browser: die drei
 * Dienste stehen im inneren Netz und haben keinen Grund, von aussen
 * erreichbar zu sein. Wer sie direkt aus dem Browser ruft, muss sie
 * oeffnen — und dann auch dort die Berechtigung pruefen, dreimal statt
 * einmal.
 *
 * Jede Schwester wird ueber ihre eigene Variable erreicht. Kein
 * abgeleiteter Name, kein "gleicher Host, anderer Port": in einer
 * Zelle, einem Container und auf einer Entwicklermaschine liegen sie an
 * drei verschiedenen Orten, und nur die Umgebung weiss, wo.
 */
const port = Number(process.env.PORT ?? 8081)

const API_RUST_URL = process.env.API_RUST_URL ?? "http://127.0.0.1:8082"
const API_CPP_URL = process.env.API_CPP_URL ?? "http://127.0.0.1:8083"
const API_PYTHON_URL = process.env.API_PYTHON_URL ?? "http://127.0.0.1:8084"
const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379"
const QUEUE_NAME = process.env.QUEUE_NAME ?? "jobs"
const LOG_LEVEL = process.env.LOG_LEVEL ?? "info"

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
    console.error("DATABASE_URL fehlt — ohne Datenbank hat dieser Dienst nichts zu tun")
    process.exit(78)
}
const pool = new Pool({connectionString: databaseUrl, max: Number(process.env.DB_POOL_MAX ?? 10)})

const redis = createClient({url: REDIS_URL})
redis.on("error", (e) => {
    if (LOG_LEVEL === "debug") console.error("redis:", e)
})

/**
 * Eine Schwester fragen.
 *
 * Mit Frist und ohne Ausnahme nach aussen: faellt eine Schwester aus,
 * faellt nicht die ganze Seite aus. Der Aufrufer bekommt `null` und
 * entscheidet, was das fuer ihn heisst — hier: das Feld fehlt in der
 * Antwort, statt dass die Antwort fehlt.
 */
async function frage<T>(name: string, url: string, pfad: string): Promise<T | null> {
    const abbruch = AbortSignal.timeout(3000)
    try {
        const r = await fetch(`${url}${pfad}`, {signal: abbruch})
        if (!r.ok) {
            if (LOG_LEVEL === "debug") console.error(`${name} ${pfad}: HTTP ${r.status}`)
            return null
        }
        return (await r.json()) as T
    } catch (e) {
        if (LOG_LEVEL === "debug") console.error(`${name} ${pfad}:`, e)
        return null
    }
}

type Eintrag = {id: number; name: string}

const server = createServer(async (req, res) => {
    const antwort = (code: number, koerper: unknown) => {
        res.writeHead(code, {"content-type": "application/json"})
        res.end(JSON.stringify(koerper))
    }

    if (req.url === "/health") {
        antwort(200, {ok: true, service: "worker-ts"})
        return
    }

    // Wen ich rufe — damit die Karte des Systems nicht nur im Kopf
    // existiert. Jeder Dienst hier beantwortet dieselbe Frage.
    if (req.url === "/topologie") {
        antwort(200, {
            service: "worker-ts",
            ruft: [
                {name: "api-rust", url: API_RUST_URL, warum: "Liste der Eintraege"},
                {name: "api-cpp", url: API_CPP_URL, warum: "Zaehlwerk"},
                {name: "api-python", url: API_PYTHON_URL, warum: "Bericht"},
                {name: "redis", url: REDIS_URL, warum: "Warteschlange"},
                {name: "postgres", url: "(DATABASE_URL)", warum: "eigene Schreibvorgaenge"},
            ],
        })
        return
    }

    // Die eine Seite, die die Oberflaeche braucht: alles auf einmal,
    // ein Netzweg statt drei aus dem Browser.
    if (req.url === "/uebersicht") {
        const [liste, zaehlwerk, bericht] = await Promise.all([
            frage<Eintrag[]>("api-rust", API_RUST_URL, "/items"),
            frage<{count: number}>("api-cpp", API_CPP_URL, "/count"),
            frage<{items: number}>("api-python", API_PYTHON_URL, "/report"),
        ])
        // Teilausfaelle stehen DRIN, statt die Antwort zu verhindern:
        // eine Oberflaeche, die weiss was fehlt, kann es sagen.
        antwort(200, {
            items: liste,
            count: zaehlwerk?.count ?? null,
            report: bericht?.items ?? null,
            fehlend: [
                liste === null ? "api-rust" : null,
                zaehlwerk === null ? "api-cpp" : null,
                bericht === null ? "api-python" : null,
            ].filter(Boolean),
        })
        return
    }

    // Etwas anlegen: schreiben, und die Nacharbeit in die Warteschlange
    // legen. tools-js holt sie dort ab.
    if (req.url === "/items" && req.method === "POST") {
        let koerper = ""
        for await (const stueck of req) koerper += stueck
        let name: string
        try {
            name = String(JSON.parse(koerper).name ?? "").trim()
        } catch {
            antwort(400, {error: "kein JSON"})
            return
        }
        if (!name) {
            antwort(400, {error: "name fehlt"})
            return
        }
        try {
            const {rows} = await pool.query(
                "insert into items(name) values($1) returning id, name",
                [name],
            )
            // Erst geschrieben, DANN in die Warteschlange: andersherum
            // gaebe es Auftraege zu Eintraegen, die es nicht gibt.
            if (redis.isOpen) await redis.rPush(QUEUE_NAME, JSON.stringify({id: rows[0].id}))
            antwort(201, rows[0])
        } catch (e) {
            if (LOG_LEVEL === "debug") console.error(e)
            antwort(503, {error: "database unavailable"})
        }
        return
    }

    antwort(404, {error: "not found"})
})

// **Nicht abwarten.** Redis ist fuer diesen Dienst entbehrlich — ohne
// ihn bleibt nur die Nacharbeit liegen, und das ist etwas anderes als
// "kaputt". Ein `await` hier macht es aber doch unentbehrlich: der
// Client versucht es mit wachsenden Pausen weiter, das Versprechen
// loest sich nie auf, und `listen` wird nie erreicht.
//
// Gemessen beim Bau: mit unerreichbarem Redis antwortete der Worker auf
// gar nichts — auch nicht auf /health, das mit Redis nichts zu tun hat.
// Der Prozess lief, der Hafen war zu, und im Protokoll stand keine
// einzige Zeile.
redis.connect().catch(() => {
    console.error("redis nicht erreichbar — Warteschlange bleibt leer")
})

server.listen(8081, () => {
    console.log(`worker-ts hoert auf ${port}`)
    console.log(`  api-rust   ${API_RUST_URL}`)
    console.log(`  api-cpp    ${API_CPP_URL}`)
    console.log(`  api-python ${API_PYTHON_URL}`)
})
