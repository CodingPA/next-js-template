// Hand-written for now. Once a real backend is running, generate these from
// /api/schema/ (openapi-typescript or orval) instead of maintaining by hand.

export interface User {
  id: string // opaque 8-char id, e.g. "VW9HGKDB" — never a number
  email: string
  [key: string]: unknown
}

export interface AppConfig {
  project_name: string
  project_slug: string
  signup_enabled: boolean
  signup_requires_access_code: boolean
  social_providers: string[]
}

export interface AllauthError {
  status: number
  errors: Array<{ message: string; code: string; param?: string }>
}

export type EmailStatusMethod = "password" | "google" | null

export interface EmailStatus {
  exists: boolean
  method: EmailStatusMethod
}
