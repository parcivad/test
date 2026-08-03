'use client'

import { useState } from 'react'

export default function Home() {
  const [count, setCount] = useState(0)

  return (
    <main>
      <h1>Hallo von Next.js</h1>
      <p>Eine ganz simple Frontend-Anwendung.</p>
      <button onClick={() => setCount(count + 1)}>
        Geklickt: {count}
      </button>
    </main>
  )
}
