<script setup>
import {onMounted, ref} from "vue"

const props = defineProps({apiBase: {type: String, required: true}})
const items = ref([])
const fehler = ref(null)

onMounted(async () => {
    try {
        const r = await fetch(`${props.apiBase}/items`)
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        items.value = await r.json()
    } catch (e) {
        // Kein leerer Zustand, der wie "nichts da" aussieht: ein
        // unerreichbarer Worker ist etwas anderes als eine leere Liste.
        fehler.value = e instanceof Error ? e.message : String(e)
    }
})
</script>

<template>
  <main>
    <h1>web-vue</h1>
    <p v-if="fehler">Der Worker antwortet nicht: {{ fehler }}</p>
    <ul v-else>
      <li v-for="i in items" :key="i.id">{{ i.name }}</li>
    </ul>
  </main>
</template>
