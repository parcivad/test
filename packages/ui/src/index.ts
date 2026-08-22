/**
 * Gemeinsames Kleinzeug fuer die Oberflaechen des Monorepos.
 *
 * Kein Rendering: `apps/docs` ist Next.js, `apps/web-vue` ist Vue —
 * eine gemeinsame Komponente muesste beides koennen und koennte am Ende
 * keines von beidem richtig. Was hier liegt, ist rahmenfrei.
 */

/** Die Adresse des Workers, aus der Umgebung. */
export function apiBase(): string {
    return process.env.NEXT_PUBLIC_API_BASE ?? process.env.VITE_API_BASE ?? "http://localhost:8081"
}

/** Bytes so, dass ein Mensch sie liest. */
export function groesse(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    const einheiten = ["KB", "MB", "GB", "TB"]
    let wert = bytes / 1024
    let i = 0
    while (wert >= 1024 && i < einheiten.length - 1) {
        wert /= 1024
        i++
    }
    // Eine Nachkommastelle bis 10, danach keine: "1,4 MB" ist
    // hilfreich, "847,3 MB" ist Rauschen.
    return `${wert < 10 ? wert.toFixed(1) : Math.round(wert)} ${einheiten[i]}`
}

/** Ein Fehler, den man dem Nutzer zeigen kann. */
export function lesbar(e: unknown): string {
    if (e instanceof Error) return e.message
    return String(e)
}
