import { useCallback, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { Button } from '@ui/components/base/buttons/button'
import { Input } from '@ui/components/base/input/input'
import AppSnackbar from '../components/AppSnackbar'
import { useAuth } from '../auth/useAuth'

type AuthMode = 'login' | 'signup'

export default function LoginPage() {
  const { isAuthenticated, login, signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<AuthMode>(() =>
    (location.state as { signup?: boolean } | null)?.signup ? 'signup' : 'login',
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    message: string
    variant: 'error'
  } | null>(null)

  const dismissSnackbar = useCallback(() => setSnackbar(null), [])

  const locationState = location.state as {
    from?: string
    signup?: boolean
  } | null
  const isAddAccount = locationState?.signup === true
  const from = locationState?.from ?? '/dashboard'

  if (isAuthenticated && !isAddAccount) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()
    if (submitting) return

    setSubmitting(true)

    const result =
      mode === 'login'
        ? login({ email, password })
        : signup({ name, email, password })

    setSubmitting(false)

    if (!result.ok) {
      setSnackbar({ message: result.error, variant: 'error' })
      return
    }

    navigate('/dashboard', { replace: true })
  }

  return (
    <>
      <div className="flex min-h-dvh items-center justify-center bg-secondary px-4 py-10">
        <div className="w-full max-w-md rounded-2xl bg-primary p-6 shadow-md ring-1 ring-secondary_alt md:p-8">
          <div className="mb-6">
            <p className="font-display text-display-xs font-semibold text-primary">
              Sigil AI
            </p>
            <h1 className="mt-2 text-lg font-semibold text-primary">
              {mode === 'login' ? 'Log in to your account' : 'Create an account'}
            </h1>
            <p className="mt-1 text-sm text-tertiary">
              {mode === 'login'
                ? 'Access your campaigns and email workspace.'
                : 'Start with a new workspace account.'}
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <Input
                label="Name"
                placeholder="Your name"
                value={name}
                onChange={setName}
                autoComplete="name"
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={setPassword}
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
            />

            <Button
              type="submit"
              color="primary"
              size="md"
              className="w-full"
              isLoading={submitting}
              isDisabled={submitting}
            >
              {mode === 'login' ? 'Log in' : 'Create account'}
            </Button>

            <Button
              type="button"
              color="link-color"
              size="sm"
              className="self-center"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setSnackbar(null)
              }}
            >
              {mode === 'login'
                ? 'Need an account? Sign up'
                : 'Already have an account? Log in'}
            </Button>
          </form>

          {mode === 'login' && (
            <p className="mt-6 border-t border-secondary pt-4 text-xs text-tertiary">
              Demo accounts:{' '}
              <span className="text-secondary">caitlyn@untitledui.com</span> or{' '}
              <span className="text-secondary">sienna@untitledui.com</span> (any
              password)
            </p>
          )}
        </div>
      </div>

      {snackbar && (
        <AppSnackbar
          message={snackbar.message}
          variant={snackbar.variant}
          onDismiss={dismissSnackbar}
        />
      )}
    </>
  )
}
