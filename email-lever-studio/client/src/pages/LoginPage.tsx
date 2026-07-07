import { useCallback, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { Button } from '@ui/components/base/buttons/button'
import { Input } from '@ui/components/base/input/input'
import { SocialButton } from '@ui/components/base/buttons/social-button'
import AppSnackbar from '../components/AppSnackbar'
import { useAuth } from '../auth/useAuth'

type AuthMode = 'login' | 'signup'

export default function LoginPage() {
  const { isAuthenticated, initializing, login, loginWithGoogle, signup } =
    useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<AuthMode>(() =>
    (location.state as { signup?: boolean } | null)?.signup ? 'signup' : 'login',
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [oauthSubmitting, setOauthSubmitting] = useState(false)
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

  const submitCredentials = useCallback(
    async (creds: { name?: string; email: string; password: string }) => {
      if (submitting) return
      setSubmitting(true)
      try {
        const result =
          mode === 'signup'
            ? await signup({
                name: creds.name ?? '',
                email: creds.email,
                password: creds.password,
              })
            : await login({ email: creds.email, password: creds.password })

        if (!result.ok) {
          setSnackbar({ message: result.error, variant: 'error' })
          return
        }
        navigate('/dashboard', { replace: true })
      } catch (err) {
        setSnackbar({
          message: err instanceof Error ? err.message : 'Something went wrong.',
          variant: 'error',
        })
      } finally {
        setSubmitting(false)
      }
    },
    [login, mode, navigate, signup, submitting],
  )

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()
    void submitCredentials({ name, email, password })
  }

  const handleGoogleLogin = () => {
    if (oauthSubmitting) return
    setOauthSubmitting(true)
    void loginWithGoogle().then((result) => {
      if (!result.ok) {
        setOauthSubmitting(false)
        setSnackbar({ message: result.error, variant: 'error' })
      }
    })
  }

  if (initializing) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-secondary">
        <p className="text-sm text-tertiary">Loading…</p>
      </div>
    )
  }

  if (isAuthenticated && !isAddAccount) {
    return <Navigate to={from} replace />
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
              onClick={handleSubmit}
            >
              {mode === 'login' ? 'Log in' : 'Create account'}
            </Button>

            {mode === 'login' && (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border-secondary" />
                  <span className="text-xs font-medium text-tertiary">or</span>
                  <div className="h-px flex-1 bg-border-secondary" />
                </div>

                <SocialButton
                  type="button"
                  social="google"
                  theme="brand"
                  size="lg"
                  className="w-full"
                  disabled={submitting || oauthSubmitting}
                  onClick={handleGoogleLogin}
                >
                  Continue with Google
                </SocialButton>
              </>
            )}

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
