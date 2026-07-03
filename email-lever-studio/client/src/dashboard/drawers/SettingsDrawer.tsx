import { useState } from 'react'
import { Button } from '@ui/components/base/buttons/button'
import { BadgeWithDot } from '@ui/components/base/badges/badges'
import { Input } from '@ui/components/base/input/input'
import { SlideoutMenu } from '@ui/components/application/slideout-menus/slideout-menu'
import { Settings01 } from '@untitledui/icons'
import ToolbarActionButton from '../components/ToolbarActionButton'
import { MOCK_CONNECTED_EMAIL } from '../mock'
import type { ConnectedEmailSettings } from '../types'

export default function SettingsDrawer() {
  const [settings, setSettings] = useState<ConnectedEmailSettings>(
    MOCK_CONNECTED_EMAIL,
  )
  const [draftEmail, setDraftEmail] = useState(settings.email ?? '')

  const handleConnect = () => {
    if (!draftEmail.trim()) return
    setSettings({ connected: true, email: draftEmail.trim() })
  }

  const handleDisconnect = () => {
    setSettings({ connected: false, email: null })
    setDraftEmail('')
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
              <div className="rounded-xl ring-1 ring-secondary_alt bg-secondary p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tertiary">
                  Email connection
                </p>
                {settings.connected && settings.email ? (
                  <div className="mt-3">
                    <BadgeWithDot color="success" type="modern" size="sm">
                      Connected
                    </BadgeWithDot>
                    <p className="mt-3 text-sm font-medium text-primary">
                      Email connected: {settings.email}
                    </p>
                    <Button
                      color="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={handleDisconnect}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 space-y-4">
                    <p className="text-sm text-tertiary">
                      Connect an email account to send approved emails from the
                      dashboard.
                    </p>
                    <Input
                      label="Email address"
                      placeholder="you@company.com"
                      value={draftEmail}
                      onChange={setDraftEmail}
                    />
                    <Button color="primary" size="md" onClick={handleConnect}>
                      Connect email
                    </Button>
                  </div>
                )}
              </div>
            </SlideoutMenu.Content>
          </>
        )}
      </SlideoutMenu>
    </SlideoutMenu.Trigger>
  )
}
