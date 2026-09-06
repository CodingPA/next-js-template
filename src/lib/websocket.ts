import { API_URL } from "./config"

export type WsStatus = "connecting" | "open" | "closed"

export interface WsHandlers {
  onStatus?: (status: WsStatus) => void
  onMessage?: (event: MessageEvent) => void
  onAuthError?: (code: 4401 | 4403) => void
}

// Opens a websocket at `path` (relative, e.g. "/ws/echo/") and reconnects
// with backoff on any ordinary disconnect. 4401 (not authenticated) and 4403
// (session revoked/disabled) are terminal — the caller decides what to do
// next (redirect to login, show a message) instead of silently retrying.
export function connectWebSocket(path: string, handlers: WsHandlers = {}) {
  let socket: WebSocket | null = null
  let attempt = 0
  let stopped = false
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  const url = `${API_URL.replace(/^http/, "ws")}${path}`

  function connect() {
    if (stopped) return
    handlers.onStatus?.("connecting")
    socket = new WebSocket(url)

    socket.onopen = () => {
      attempt = 0
      handlers.onStatus?.("open")
    }

    socket.onmessage = (event) => handlers.onMessage?.(event)

    socket.onclose = (event) => {
      handlers.onStatus?.("closed")
      if (event.code === 4401 || event.code === 4403) {
        handlers.onAuthError?.(event.code)
        return
      }
      if (stopped) return
      const delay = Math.min(1000 * 2 ** attempt, 30_000)
      attempt += 1
      retryTimer = setTimeout(connect, delay)
    }
  }

  connect()

  return {
    close() {
      stopped = true
      if (retryTimer) clearTimeout(retryTimer)
      socket?.close()
    },
    send(data: string) {
      socket?.send(data)
    },
  }
}
