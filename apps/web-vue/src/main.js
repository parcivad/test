import {createApp} from "vue"
import App from "./App.vue"

// Wohin diese Oberflaeche fragt. Ohne Vorgabe der Worker auf 8081 —
// derselbe Wert wie in vite.config.js, damit ein Entwickler ohne
// Umgebung trotzdem etwas sieht.
const apiBase = process.env.VITE_API_BASE ?? "http://localhost:8081"

createApp(App, {apiBase}).mount("#app")
