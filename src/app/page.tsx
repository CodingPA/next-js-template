"use client"

import { useRouter } from "next/navigation"
import { EchoDemo } from "@/components/EchoDemo"
import { useAuth } from "@/lib/auth-context"

export default function Home() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p>Loading…</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Next.js Template</h1>
        <p className="text-sm">You&apos;re not signed in.</p>
        <div className="flex justify-center gap-3">
          <a href="/auth/login" className="rounded bg-black px-3 py-2 text-white">
            Log in
          </a>
          <a href="/auth/signup" className="rounded border px-3 py-2">
            Sign up
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Signed in</h1>
        <button
          onClick={async () => {
            await logout()
            router.push("/auth/login")
          }}
          className="rounded border px-3 py-2 text-sm"
        >
          Log out
        </button>
      </div>
      <p className="text-sm">
        {user.email} <span className="text-neutral-500">({user.id})</span>
      </p>
      <EchoDemo />
    </main>
  )
}
