import {createServer} from "node:http"
import {Pool} from "pg"

/*
 * Der Worker hinter der Oberflaeche.
 *
 * Alles, was hier aus der Umgebung kommt, ist bewusst OHNE eingebauten
 * Ersatzwert fuer die Datenbank: eine App, die ohne Zugangsdaten
 * anlaeuft und dann bei der ersten Anfrage umfaellt, verschiebt den
 * Fehler nur dorthin, wo er niemand mehr etwas sagt.
 */
const port = Number(process.env.PORT ?? 8081)

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
    console.error("DATABASE_URL fehlt — ohne Datenbank hat dieser Dienst nichts zu tun")
    process.exit(78)
}

const pool = new Pool({
    connectionString: databaseUrl,
    max: Number(process.env.DB_POOL_MAX ?? 10),
})

const logLevel = process.env.LOG_LEVEL ?? "info"

const server = createServer(async (req, res) => {
    if (req.url === "/health") {
        res.writeHead(200, {"content-type": "application/json"})
        res.end(JSON.stringify({ok: true}))
        return
    }
    if (req.url === "/items") {
        try {
            const {rows} = await pool.query("select id, name from items order by id limit 100")
            res.writeHead(200, {"content-type": "application/json"})
            res.end(JSON.stringify(rows))
        } catch (e) {
            if (logLevel === "debug") console.error(e)
            // 503, nicht 500: die Datenbank ist weg, nicht der Code kaputt.
            res.writeHead(503, {"content-type": "application/json"})
            res.end(JSON.stringify({error: "database unavailable"}))
        }
        return
    }
    res.writeHead(404, {"content-type": "application/json"})
    res.end(JSON.stringify({error: "not found"}))
})

server.listen(8081, () => {
    console.log(`worker-ts hoert auf ${port}`)
})
