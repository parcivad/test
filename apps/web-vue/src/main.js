import {createApp} from "vue"
import App from "./App.vue"

/*
 * Die Oberflaeche kennt GENAU EINEN Dienst: den Worker.
 *
 * Sie ruft nicht api-rust, api-cpp und api-python einzeln — die stehen
 * im inneren Netz. Ein Browser, der sie direkt riefe, verlangte, sie
 * nach aussen zu oeffnen und dort dreimal zu pruefen, was der Worker
 * einmal prueft.
 */
const workerUrl = process.env.WORKER_URL ?? "http://127.0.0.1:8081"

createApp(App, {workerUrl}).mount("#app")
