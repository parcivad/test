<script setup>
import {onMounted, ref} from "vue"

const props = defineProps({workerUrl: {type: String, required: true}})

const items = ref([])
const count = ref(null)
const report = ref(null)
const fehlend = ref([])
const fehler = ref(null)
const neuerName = ref("")

async function laden() {
    try {
        const r = await fetch(`${props.workerUrl}/uebersicht`)
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const d = await r.json()
        items.value = d.items ?? []
        count.value = d.count
        report.value = d.report
        // Der Worker sagt, WEN er nicht erreicht hat. Das ist etwas
        // anderes als eine leere Liste, und die Oberflaeche sagt es
        // weiter statt es zu verschlucken.
        fehlend.value = d.fehlend ?? []
        fehler.value = null
    } catch (e) {
        fehler.value = e instanceof Error ? e.message : String(e)
    }
}

async function anlegen() {
    const name = neuerName.value.trim()
    if (!name) return
    const r = await fetch(`${props.workerUrl}/items`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({name}),
    })
    if (r.ok) {
        neuerName.value = ""
        await laden()
    } else {
        fehler.value = `Anlegen fehlgeschlagen: HTTP ${r.status}`
    }
}

onMounted(laden)
</script>

<template>
  <main>
    <h1>web-vue</h1>

    <p v-if="fehler">Der Worker antwortet nicht: {{ fehler }}</p>

    <template v-else>
      <p v-if="fehlend.length">
        Teilweise unvollstaendig — nicht erreicht: {{ fehlend.join(", ") }}
      </p>

      <dl>
        <dt>Eintraege (api-rust)</dt><dd>{{ items.length }}</dd>
        <dt>Zaehlwerk (api-cpp)</dt><dd>{{ count ?? "—" }}</dd>
        <dt>Bericht (api-python)</dt><dd>{{ report ?? "—" }}</dd>
      </dl>

      <ul>
        <li v-for="i in items" :key="i.id">{{ i.name }}</li>
      </ul>

      <form @submit.prevent="anlegen">
        <input v-model="neuerName" placeholder="Neuer Eintrag" />
        <button type="submit">Anlegen</button>
      </form>
    </template>
  </main>
</template>
