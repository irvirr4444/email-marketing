import { useEffect, useState } from 'react'
import { Button } from '@ui/components/base/buttons/button'
import { BadgeWithDot } from '@ui/components/base/badges/badges'
import { SlideoutMenu } from '@ui/components/application/slideout-menus/slideout-menu'
import { LinkExternal01, RefreshCw01, Settings01 } from '@untitledui/icons'
import { useAuth } from '../../auth/useAuth'
import {
  createUnipileHostedAuthLink,
  fetchUnipileAccounts,
  type UnipileAccount,
} from '../api'
import ToolbarActionButton from '../components/ToolbarActionButton'

function getAccountLabel(account: UnipileAccount) {
  return account.email ?? account.username ?? account.name ?? account.id
}

export default function SettingsDrawer() {
  const { activeAccount, updateConnectedEmail } = useAuth()
  const settings = activeAccount?.connectedEmail ?? {
    connected: false,
    email: null,
  }
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    setError(null)
  }, [activeAccount?.id])

  const handleConnect = async () => {
    if (!activeAccount) return

    setError(null)
    setIsConnecting(true)
    try {
      const { url } = await createUnipileHostedAuthLink(activeAccount.id)
      window.location.assign(url)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not start Unipile connection.',
      )
    } finally {
      setIsConnecting(false)
    }
  }

  const handleCheckStatus = async () => {
    setError(null)
    setIsChecking(true)
    try {
      const { accounts } = await fetchUnipileAccounts()
      const account = accounts[0]
      if (!account) {
        updateConnectedEmail({ connected: false, email: null })
        setError('No Unipile accounts are connected yet.')
        return
      }

      updateConnectedEmail({
        connected: true,
        email: getAccountLabel(account),
        unipileAccountId: account.id,
        provider: account.provider ?? account.type ?? null,
        status: account.status ?? null,
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not check Unipile accounts.',
      )
    } finally {
      setIsChecking(false)
    }
  }

  const handleDisconnect = () => {
    updateConnectedEmail({ connected: false, email: null })
    setError(null)
  }

  return (
    <SlideoutMenu.Trigger>
      <ToolbarActionButton icon={Settings01}>Settings</ToolbarActionButton>
      <SlideoutMenu>
        {({ close }) => (
          <>
            <SlideoutMenu.Header onClose={close}>
              <h2 className="text-lg font-semibold text-primary">Settings</h2>
              <p className="mt-1 text-sm text-tertiary">
                Email account and sending preferences
              </p>
            </SlideoutMenu.Header>
            <SlideoutMenu.Content className="gap-6">
              <div className="rounded-xl bg-secondary p-4 ring-1 ring-secondary ring-inset">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tertiary">
                  Email connection
                </p>
                {activeAccount && (
                  <p className="mt-1 text-xs text-quaternary">
                    Workspace: {activeAccount.name}
                  </p>
                )}
                {settings.connected && settings.email ? (
                  <div className="mt-3">
                    <BadgeWithDot color="success" type="modern" size="sm">
                      Connected
                    </BadgeWithDot>
                    <p className="mt-3 text-sm font-medium text-primary">
                      Unipile account: {settings.email}
                    </p>
                    {settings.provider && (
                      <p className="mt-1 text-xs text-quaternary">
                        Provider: {settings.provider}
                        {settings.status ? ` - Status: ${settings.status}` : ''}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        color="secondary"
                        size="sm"
                        iconLeading={RefreshCw01}
                        isLoading={isChecking}
                        onClick={handleCheckStatus}
                      >
                        Refresh status
                      </Button>
                      <Button
                        color="secondary"
                        size="sm"
                        onClick={handleDisconnect}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-4">
                    <p className="text-sm text-tertiary">
                      Connect a mailbox through Unipile Hosted Auth so approved
                      emails can be sent from your own domain.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        color="primary"
                        size="md"
                        iconLeading={LinkExternal01}
                        isLoading={isConnecting}
                        showTextWhileLoading
                        onClick={handleConnect}
                      >
                        Connect with Unipile
                      </Button>
                      <Button
                        color="secondary"
                        size="md"
                        iconLeading={RefreshCw01}
                        isLoading={isChecking}
                        onClick={handleCheckStatus}
                      >
                        Check status
                      </Button>
                    </div>
                  </div>
                )}
                {error && (
                  <p className="mt-3 rounded-lg bg-error-primary px-3 py-2 text-sm text-error-primary">
                    {error}
                  </p>
                )}
              </div>
            </SlideoutMenu.Content>
          </>
        )}
      </SlideoutMenu>
    </SlideoutMenu.Trigger>
  )
}
