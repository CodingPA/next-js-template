import { API_URL } from "./config"
import type { AllauthError, AppConfig, EmailStatus, User } from "./types"

function csrfToken() {
  return document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/)?.[1] ?? ""
}

// Read the CSRF cookie fresh on every call — Django rotates it on login, so a
// value captured earlier is stale and the first post-login mutation 403s.
export async function api(path: string, init: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.method && init.method !== "GET"
        ? { "X-CSRFToken": csrfToken() }
        : {}),
      ...init.headers,
    },
  })
}

export class ApiError extends Error {
  status: number
  errors: AllauthError["errors"]

  constructor(body: AllauthError) {
    super(body.errors?.[0]?.message ?? "Request failed")
    this.status = body.status
    this.errors = body.errors ?? []
  }

  code() {
    return this.errors[0]?.code
  }
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(body ?? { status: res.status, errors: [] })
  return body as T
}

export function getConfig() {
  return api("/api/config/").then((res) => parseOrThrow<AppConfig>(res))
}

export function getEmailStatus(email: string) {
  return api(`/api/auth/email-status/?email=${encodeURIComponent(email)}`).then(
    (res) => {
      if (res.status === 404) return null
      return parseOrThrow<EmailStatus>(res)
    }
  )
}

export function validateAccessCode(code: string) {
  return api("/api/auth/access-code/", {
    method: "POST",
    body: JSON.stringify({ code }),
  })
}

// --- allauth ---

export async function getSession(): Promise<User | null> {
  const res = await api("/_allauth/browser/v1/auth/session")
  if (res.status === 401) return null
  const body = await parseOrThrow<{ data: { user: User } }>(res)
  return body.data.user
}

export function login(email: string, password: string) {
  return api("/_allauth/browser/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }).then((res) => parseOrThrow<{ data: { user: User } }>(res))
}

export function signup(
  email: string,
  password: string,
  access_code?: string
) {
  return api("/_allauth/browser/v1/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, access_code }),
  }).then((res) => parseOrThrow<{ data: { user: User } }>(res))
}

export async function logout() {
  // Responds 401, not 200 — the body is the new, unauthenticated session
  // state. That's success, not failure.
  await api("/_allauth/browser/v1/auth/session", { method: "DELETE" })
}

export function requestPasswordReset(email: string) {
  return api("/_allauth/browser/v1/auth/password/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

export function resetPassword(key: string, password: string) {
  return api("/_allauth/browser/v1/auth/password/reset", {
    method: "POST",
    body: JSON.stringify({ key, password }),
  })
}

export function googleRedirect(process: "login" | "connect" = "login") {
  const form = document.createElement("form")
  form.method = "POST"
  form.action = `${API_URL}/_allauth/browser/v1/auth/provider/redirect`
  const fields = {
    provider: "google",
    callback_url: `${window.location.origin}/auth/callback`,
    process,
    csrfmiddlewaretoken: csrfToken(),
  }
  for (const [k, v] of Object.entries(fields)) {
    const input = document.createElement("input")
    input.type = "hidden"
    input.name = k
    input.value = v
    form.appendChild(input)
  }
  document.body.appendChild(form)
  form.submit()
}
