"use client"

import { useEffect, useRef, useState } from "react"
import { connectWebSocket, type WsStatus } from "@/lib/websocket"

export function EchoDemo() {
  const [status, setStatus] = useState<WsStatus>("connecting")
  const [messages, setMessages] = useState<string[]>([])
  const [draft, setDraft] = useState("")
  const connRef = useRef<ReturnType<typeof connectWebSocket> | null>(null)

  useEffect(() => {
    const conn = connectWebSocket("/ws/echo/", {
      onStatus: setStatus,
      onMessage: (event) => setMessages((prev) => [...prev, String(event.data)]),
      onAuthError: () => setStatus("closed"),
    })
    connRef.current = conn
    return () => conn.close()
  }, [])

  return (
    <div className="flex flex-col gap-3 rounded border p-4">
      <p className="text-sm">
        WebSocket status: <span className="font-mono">{status}</span>
      </p>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message"
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          onClick={() => {
            connRef.current?.send(draft)
            setDraft("")
          }}
          disabled={status !== "open"}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
      <ul className="flex flex-col gap-1 text-sm font-mono">
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  )
}
