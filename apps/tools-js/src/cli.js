#!/usr/bin/env node
/*
 * Kleines Werkzeug fuer die Warteschlange des Workers.
 *
 *   lily-tools laenge      wie viele Auftraege liegen an
 *   lily-tools arbeiten    Auftraege abholen, beim Worker gegenpruefen
 *   lily-tools leeren      alles wegwerfen (fragt nach)
 */
import {createClient} from "redis"
import {createInterface} from "node:readline/promises"

const url = process.env.REDIS_URL ?? "redis://localhost:6379"
const queue = process.env.QUEUE_NAME ?? "jobs"
const logLevel = process.env.LOG_LEVEL ?? "info"

// Der Worker — dieses Werkzeug fragt ihn, ob er lebt, bevor es eine
// Warteschlange leert, die er gerade fuellt.
const workerUrl = process.env.WORKER_URL ?? "http://127.0.0.1:8081"

const befehl = process.argv[2]

const client = createClient({url})
client.on("error", (e) => {
    if (logLevel === "debug") console.error(e)
})

await client.connect()

if (befehl === "laenge") {
    console.log(await client.lLen(queue))
} else if (befehl === "arbeiten") {
    // Auftraege abholen und beim Worker gegenpruefen. Das ist die eine
    // Stelle, an der dieses Werkzeug ueber das Netz spricht.
    let getan = 0
    for (;;) {
        const roh = await client.lPop(queue)
        if (!roh) break
        const {id} = JSON.parse(roh)
        try {
            const r = await fetch(`${workerUrl}/health`, {signal: AbortSignal.timeout(3000)})
            if (!r.ok) throw new Error(`HTTP ${r.status}`)
        } catch (e) {
            // Zurueck an den ANFANG, nicht ans Ende: sonst wandert ein
            // Auftrag bei jedem Fehlversuch hinter alle anderen und
            // kommt als letzter dran, obwohl er der aelteste ist.
            await client.lPush(queue, roh)
            console.error(`Worker nicht erreichbar (${e instanceof Error ? e.message : e}) — ${getan} erledigt, Rest bleibt liegen`)
            break
        }
        if (logLevel === "debug") console.log(`Auftrag ${id} erledigt`)
        getan++
    }
    console.log(`${getan} Auftraege erledigt`)
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
    console.error("Aufruf: lily-tools <laenge|arbeiten|leeren>")
    process.exitCode = 2
}

await client.quit()
