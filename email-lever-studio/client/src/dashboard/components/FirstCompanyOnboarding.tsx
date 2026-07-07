import { useCallback, useState, type FormEvent } from 'react'
import { Building07, Trash01 } from '@untitledui/icons'
import { Button } from '@ui/components/base/buttons/button'
import { Input } from '@ui/components/base/input/input'
import { FileUpload } from '@ui/components/application/file-upload/file-upload-base'
import { useAuth } from '../../auth/useAuth'
import AppSnackbar from '../../components/AppSnackbar'

const MAX_LOGO_BYTES = 2 * 1024 * 1024

/**
 * First-run onboarding shown when a signed-in user has no company yet.
 * Captures the core company profile before the dashboard is revealed.
 */
export default function FirstCompanyOnboarding() {
  const { addCompany } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoName, setLogoName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    message: string
    variant: 'error'
  } | null>(null)

  const dismissSnackbar = useCallback(() => setSnackbar(null), [])

  const handleLogoFiles = useCallback((files: FileList) => {
    const file = files.item(0)
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setLogoUrl(typeof reader.result === 'string' ? reader.result : '')
      setLogoName(file.name)
    }
    reader.onerror = () =>
      setSnackbar({ message: 'Could not read that image.', variant: 'error' })
    reader.readAsDataURL(file)
  }, [])

  const clearLogo = useCallback(() => {
    setLogoUrl('')
    setLogoName('')
  }, [])

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()
    if (submitting) return
    if (!name.trim()) {
      setSnackbar({ message: 'Company name is required.', variant: 'error' })
      return
    }

    setSubmitting(true)
    void (async () => {
      try {
        const result = await addCompany(name, {
          description,
          websiteUrl,
          logoUrl,
        })
        if (!result.ok) {
          setSnackbar({ message: result.error, variant: 'error' })
        }
        // On success the account gains a company and the parent re-renders
        // into the dashboard, so no navigation is needed here.
      } finally {
        setSubmitting(false)
      }
    })()
  }

  return (
    <>
      <div className="flex min-h-dvh items-center justify-center bg-secondary p-6">
        <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary_alt">
          <div className="flex flex-col gap-1 border-b border-secondary px-6 py-5">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-brand-primary_alt text-fg-brand-primary">
                <Building07 className="size-5" />
              </span>
              <h1 className="font-display text-display-xs font-semibold text-primary">
                Add your first company
              </h1>
            </div>
            <p className="text-sm text-tertiary">
              Tell us about the business you&apos;ll be creating emails for. You
              can add more companies later.
            </p>
          </div>

          <form className="space-y-4 px-6 py-6" onSubmit={handleSubmit}>
            <Input
              label="Company name"
              placeholder="Company Name"
              value={name}
              onChange={setName}
              isRequired
              autoFocus
            />
            <Input
              label="Description (Optional)"
              hint="A short summary of what the company does."
              placeholder="What does this company do?"
              value={description}
              onChange={setDescription}
            />
            <Input
              label="Website URL (Optional)"
              type="url"
              placeholder="https://mycompany.com"
              value={websiteUrl}
              onChange={setWebsiteUrl}
            />

            <div className="flex flex-col gap-1.5">
              <p className="flex items-center gap-0.5 text-sm font-medium text-secondary">
                Logo (Optional)
              </p>
              {logoUrl ? (
                <div className="flex items-center gap-3 rounded-xl bg-primary p-3 ring-1 ring-secondary ring-inset">
                  <img
                    src={logoUrl}
                    alt="Company logo preview"
                    className="size-12 shrink-0 rounded-lg object-contain ring-1 ring-secondary"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-secondary">
                      {logoName}
                    </p>
                    <p className="text-xs text-tertiary">Ready to save</p>
                  </div>
                  <Button
                    type="button"
                    color="tertiary"
                    size="sm"
                    iconLeading={Trash01}
                    aria-label="Remove logo"
                    onClick={clearLogo}
                  />
                </div>
              ) : (
                <FileUpload.DropZone
                  accept="image/*"
                  allowsMultiple={false}
                  maxSize={MAX_LOGO_BYTES}
                  hint="SVG, PNG, JPG or GIF (max. 2 MB)"
                  onDropFiles={handleLogoFiles}
                  onSizeLimitExceed={() =>
                    setSnackbar({
                      message: 'Logo must be 2 MB or smaller.',
                      variant: 'error',
                    })
                  }
                  onDropUnacceptedFiles={() =>
                    setSnackbar({
                      message: 'Please choose an image file.',
                      variant: 'error',
                    })
                  }
                />
              )}
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                color="primary"
                size="md"
                className="w-full justify-center"
                isLoading={submitting}
                isDisabled={submitting}
              >
                Create company
              </Button>
            </div>
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
