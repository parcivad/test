import {defineConfig} from "vite"
import vue from "@vitejs/plugin-vue"

// Der Port steht hier UND im package.json-Skript. Keine Doppelung aus
// Versehen: die Erkennung liest `-p NNNN` aus dem Skript, ein Mensch
// liest diese Datei. Wer eines aendert, muss beides aendern.
export default defineConfig({
    plugins: [vue()],
    server: {port: 5173},
    define: {
        __WORKER_URL__: JSON.stringify(process.env.WORKER_URL ?? "http://127.0.0.1:8081"),
    },
})
