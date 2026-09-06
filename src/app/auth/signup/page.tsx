"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ApiError,
  getConfig,
  getEmailStatus,
  googleRedirect,
  signup,
  validateAccessCode,
} from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { AppConfig } from "@/lib/types"

const ERROR_MESSAGES: Record<string, string> = {
  email_taken: "An account with this email already exists.",
  access_code_required: "An access code is required.",
  access_code_invalid: "That access code is not valid.",
  signup_closed: "Sign-ups are currently closed.",
}

export default function SignupPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [accessCodeValid, setAccessCodeValid] = useState(false)
  const [emailHint, setEmailHint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getConfig().then(setConfig).catch(() => setConfig(null))
  }, [])

  const requiresAccessCode = config?.signup_requires_access_code ?? false
  const googleEnabled =
    (config?.social_providers.includes("google") ?? false) &&
    (!requiresAccessCode || accessCodeValid)

  async function onEmailBlur() {
    if (!email) return
    const status = await getEmailStatus(email).catch(() => null)
    if (!status) return
    if (status.exists && status.method === "google") {
      setEmailHint("This email uses Google. Sign in with Google.")
    } else if (status.exists && status.method === "password") {
      setEmailHint("This email uses a password. Sign in with your password.")
    } else {
      setEmailHint(null)
    }
  }

  async function onAccessCodeBlur() {
    if (!accessCode) return
    try {
      await validateAccessCode(accessCode)
      setAccessCodeValid(true)
    } catch {
      setAccessCodeValid(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signup(email, password, requiresAccessCode ? accessCode : undefined)
      await refresh()
      router.push("/")
    } catch (err) {
      if (err instanceof ApiError) {
        const code = err.code()
        setError((code && ERROR_MESSAGES[code]) ?? err.message)
      } else {
        setError("Something went wrong.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (config && !config.signup_enabled) {
    return (
      <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-16">
        <p>Sign-ups are currently closed.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Sign up</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={onEmailBlur}
          className="rounded border px-3 py-2"
        />
        {emailHint && <p className="text-sm text-amber-600">{emailHint}</p>}
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border px-3 py-2"
        />
        {requiresAccessCode && (
          <input
            type="text"
            placeholder="Access code"
            required
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            onBlur={onAccessCodeBlur}
            className="rounded border px-3 py-2"
          />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || (requiresAccessCode && !accessCodeValid)}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "Signing up…" : "Sign up"}
        </button>
      </form>

      {config?.social_providers.includes("google") && (
        <button
          onClick={() => googleRedirect("login")}
          disabled={!googleEnabled}
          className="rounded border px-3 py-2 disabled:opacity-50"
        >
          Continue with Google
        </button>
      )}

      <p className="text-sm">
        Already have an account?{" "}
        <a href="/auth/login" className="underline">
          Log in
        </a>
      </p>
    </main>
  )
}
