import {defineConfig} from "vite"
import vue from "@vitejs/plugin-vue"

// Der Port steht hier UND im package.json-Skript. Das ist keine
// Doppelung aus Versehen: die Erkennung liest `-p NNNN` aus dem Skript,
// ein Mensch liest diese Datei. Wer eines aendert, muss beides aendern.
export default defineConfig({
    plugins: [vue()],
    server: {port: 5173},
    define: {
        __API_BASE__: JSON.stringify(process.env.VITE_API_BASE ?? "http://localhost:8081"),
    },
})
