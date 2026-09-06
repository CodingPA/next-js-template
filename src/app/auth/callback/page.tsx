"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

const ERROR_MESSAGES: Record<string, string> = {
  email_taken_by_password: "This email uses a password. Sign in with your password.",
  email_taken_by_provider: "This email uses Google. Sign in with Google.",
  email_taken_no_method: "This account has no sign-in method. Contact support.",
  signup_closed: "Sign-ups are currently closed.",
  access_code_required: "An access code is required.",
  access_code_invalid: "That access code is not valid.",
}

function Callback() {
  const router = useRouter()
  const params = useSearchParams()
  const { refresh } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorCode = params.get("error")
    if (errorCode) {
      setError(ERROR_MESSAGES[errorCode] ?? "Something went wrong signing in.")
      return
    }
    refresh().then(() => router.push("/"))
  }, [params, refresh, router])

  if (error) {
    return (
      <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-16">
        <p className="text-sm text-red-600">{error}</p>
        <a href="/auth/login" className="underline">
          Back to log in
        </a>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-16">
      <p>Signing you in…</p>
    </main>
  )
}

export default function CallbackPage() {
  return (
    <Suspense>
      <Callback />
    </Suspense>
  )
}
