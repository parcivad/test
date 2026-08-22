import {createServer} from "node:http"
import {createClient} from "redis"

// Ein Endpunkt, mehr nicht: die Laenge der Warteschlange im
// Prometheus-Textformat.
const port = Number(process.env.METRICS_PORT ?? 8085)
const url = process.env.REDIS_URL ?? "redis://localhost:6379"
const queue = process.env.QUEUE_NAME ?? "jobs"

const client = createClient({url})
await client.connect()

createServer(async (_req, res) => {
    const n = await client.lLen(queue)
    res.writeHead(200, {"content-type": "text/plain; version=0.0.4"})
    res.end(`lily_queue_length{queue="${queue}"} ${n}\n`)
}).listen(8085, () => console.log(`metrics auf ${port}`))
