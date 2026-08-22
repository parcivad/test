#!/usr/bin/env node
/*
 * Kleines Werkzeug fuer die Warteschlange des Workers.
 *
 *   lily-tools laenge      wie viele Auftraege liegen an
 *   lily-tools leeren      alles wegwerfen (fragt nach)
 */
import {createClient} from "redis"
import {createInterface} from "node:readline/promises"

const url = process.env.REDIS_URL ?? "redis://localhost:6379"
const queue = process.env.QUEUE_NAME ?? "jobs"
const logLevel = process.env.LOG_LEVEL ?? "info"

const befehl = process.argv[2]

const client = createClient({url})
client.on("error", (e) => {
    if (logLevel === "debug") console.error(e)
})

await client.connect()

if (befehl === "laenge") {
    console.log(await client.lLen(queue))
} else if (befehl === "leeren") {
    // Fragt nach, und zwar mit der ZAHL: "wirklich?" ohne Menge ist
    // eine Frage, die man wegklickt.
    const n = await client.lLen(queue)
    const rl = createInterface({input: process.stdin, output: process.stdout})
    const antwort = await rl.question(`${n} Auftraege in "${queue}" wegwerfen? [nein/ja] `)
    rl.close()
    if (antwort.trim() === "ja") {
        await client.del(queue)
        console.log(`${n} weggeworfen`)
    } else {
        console.log("nichts geaendert")
    }
} else {
    console.error("Aufruf: lily-tools <laenge|leeren>")
    process.exitCode = 2
}

await client.quit()
