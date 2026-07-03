import { useState } from 'react'
import { Button } from '@ui/components/base/buttons/button'
import { Badge } from '@ui/components/base/badges/badges'
import { NativeSelect } from '@ui/components/base/select/select-native'
import { SlideoutMenu } from '@ui/components/application/slideout-menus/slideout-menu'
import { FilterLines } from '@untitledui/icons'
import {
  FILTER_BODY_LENGTH_OPTIONS,
  FILTER_CTA_TYPE_OPTIONS,
  FILTER_EMOTION_OPTIONS,
  FILTER_HAS_OFFER_OPTIONS,
  FILTER_INTENT_OPTIONS,
  FILTER_PERSUASION_OPTIONS,
  FILTER_PERSONALIZATION_OPTIONS,
  FILTER_SPECIFICITY_OPTIONS,
  FILTER_SP_TYPE_OPTIONS,
  FILTER_WRITING_STYLE_OPTIONS,
} from '@shared/email-variables.ts'
import EngagementFilters from '../components/EngagementFilters'
import { FilterSectionBlock } from '../components/FilterSection'
import ToolbarActionButton from '../components/ToolbarActionButton'
import { ENGAGEMENT_KEYS } from '../emailEngagement'
import { FRAMEWORK_FILTER_OPTIONS } from '../mock'
import type { EmailFilters } from '../types'
import { DEFAULT_FILTERS } from '../types'

function hasActiveFilters(filters: EmailFilters) {
  return (
    filters.status !== 'all' ||
    ENGAGEMENT_KEYS.some((key) => filters.engagement[key] !== null) ||
    filters.framework != null ||
    filters.intent != null ||
    filters.ctaType != null ||
    filters.emotion != null ||
    filters.persuasion != null ||
    filters.specificity != null ||
    filters.personalization != null ||
    filters.socialProofType != null ||
    filters.bodyLength != null ||
    filters.writingStyle != null ||
    filters.hasOffer != null
  )
}

type Props = {
  filters: EmailFilters
  onChange: (filters: EmailFilters) => void
}

function FiltersDrawerPanel({
  appliedFilters,
  onApply,
  close,
}: {
  appliedFilters: EmailFilters
  onApply: (filters: EmailFilters) => void
  close: () => void
}) {
  const [draft, setDraft] = useState<EmailFilters>(() => appliedFilters)

  const handleApply = () => {
    onApply(draft)
    close()
  }

  const handleReset = () => {
    onApply(DEFAULT_FILTERS)
    close()
  }

  return (
    <>
      <SlideoutMenu.Header onClose={close}>
        <h2 className="text-lg font-semibold text-primary">Filters</h2>
      </SlideoutMenu.Header>
      <SlideoutMenu.Content className="gap-6">
        <EngagementFilters filters={draft} onChange={setDraft} />

        <FilterSectionBlock title="Variables">
          <div className="flex flex-col gap-4">
        <NativeSelect
          label="Intent"
          size="md"
          value={draft.intent ?? ''}
          onChange={(e) =>
            setDraft({
              ...draft,
              intent: e.target.value || null,
            })
          }
          options={[
            { value: '', label: 'Any intent' },
            ...FILTER_INTENT_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          ]}
        />

        <NativeSelect
          label="Framework"
          size="md"
          value={draft.framework ?? ''}
          onChange={(e) =>
            setDraft({
              ...draft,
              framework: e.target.value || null,
            })
          }
          options={[
            { value: '', label: 'Any framework' },
            ...FRAMEWORK_FILTER_OPTIONS.map((f) => ({ value: f, label: f })),
          ]}
        />

        <NativeSelect
          label="Emotion"
          size="md"
          value={draft.emotion ?? ''}
          onChange={(e) =>
            setDraft({
              ...draft,
              emotion: e.target.value || null,
            })
          }
          options={[
            { value: '', label: 'Any emotion' },
            ...FILTER_EMOTION_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          ]}
        />

        <NativeSelect
          label="Persuasion"
          size="md"
          value={draft.persuasion ?? ''}
          onChange={(e) =>
            setDraft({
              ...draft,
              persuasion: e.target.value || null,
            })
          }
          options={[
            { value: '', label: 'Any persuasion' },
            ...FILTER_PERSUASION_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          ]}
        />

        <NativeSelect
          label="Specificity"
          size="md"
          value={draft.specificity ?? ''}
          onChange={(e) =>
            setDraft({
              ...draft,
              specificity: e.target.value || null,
            })
          }
          options={[
            { value: '', label: 'Any specificity' },
            ...FILTER_SPECIFICITY_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          ]}
        />

        <NativeSelect
          label="Personalization"
          size="md"
          value={draft.personalization ?? ''}
          onChange={(e) =>
            setDraft({
              ...draft,
              personalization: e.target.value || null,
            })
          }
          options={[
            { value: '', label: 'Any personalization' },
            ...FILTER_PERSONALIZATION_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          ]}
        />

        <NativeSelect
          label="Writing style"
          size="md"
          value={draft.writingStyle ?? ''}
          onChange={(e) =>
            setDraft({
              ...draft,
              writingStyle: e.target.value || null,
            })
          }
          options={[
            { value: '', label: 'Any author' },
            ...FILTER_WRITING_STYLE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          ]}
        />

        <NativeSelect
          label="Body length"
          size="md"
          value={draft.bodyLength ?? ''}
          onChange={(e) =>
            setDraft({
              ...draft,
              bodyLength: e.target.value || null,
            })
          }
          options={[
            { value: '', label: 'Any length' },
            ...FILTER_BODY_LENGTH_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          ]}
        />

        <NativeSelect
          label="Social proof"
          size="md"
          value={draft.socialProofType ?? ''}
          onChange={(e) =>
            setDraft({
              ...draft,
              socialProofType: e.target.value || null,
            })
          }
          options={[
            { value: '', label: 'Any social proof' },
            ...FILTER_SP_TYPE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          ]}
        />

        <NativeSelect
          label="CTA type"
          size="md"
          value={draft.ctaType ?? ''}
          onChange={(e) =>
            setDraft({
              ...draft,
              ctaType: e.target.value || null,
            })
          }
          options={[
            { value: '', label: 'Any CTA' },
            ...FILTER_CTA_TYPE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          ]}
        />

        <NativeSelect
          label="Offer"
          size="md"
          value={draft.hasOffer ?? ''}
          onChange={(e) =>
            setDraft({
              ...draft,
              hasOffer:
                e.target.value === 'yes' || e.target.value === 'no'
                  ? e.target.value
                  : null,
            })
          }
          options={[...FILTER_HAS_OFFER_OPTIONS]}
        />
          </div>
        </FilterSectionBlock>
      </SlideoutMenu.Content>
      <SlideoutMenu.Footer className="flex gap-2">
        <Button
          color="secondary"
          className="flex-1"
          onClick={handleReset}
        >
          Clear
        </Button>
        <Button color="primary" className="flex-1" onClick={handleApply}>
          Apply
        </Button>
      </SlideoutMenu.Footer>
    </>
  )
}

export default function FiltersDrawer({ filters, onChange }: Props) {
  return (
    <SlideoutMenu.Trigger>
      <ToolbarActionButton
        icon={FilterLines}
        trailing={
          hasActiveFilters(filters) ? (
            <Badge color="brand" size="sm">
              On
            </Badge>
          ) : undefined
        }
      >
        Filters
      </ToolbarActionButton>
      <SlideoutMenu>
        {({ close }) => (
          <FiltersDrawerPanel
            appliedFilters={filters}
            onApply={onChange}
            close={close}
          />
        )}
      </SlideoutMenu>
    </SlideoutMenu.Trigger>
  )
}
