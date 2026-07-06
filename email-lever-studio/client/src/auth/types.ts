import type { ConnectedEmailSettings } from '../dashboard/types'

/** App workspace account — owns companies, settings, and dashboard context. */
export type AppAccount = {
  id: string
  name: string
  email: string
  avatar?: string | null
  companyIds: string[]
  defaultCompanyId: string
  connectedEmail: ConnectedEmailSettings
}

/** Persisted mock session (maps to a future real auth token). */
export type AuthSession = {
  accountId: string
}

export type SignupInput = {
  name: string
  email: string
  password: string
}

export type LoginInput = {
  email: string
  password: string
}
