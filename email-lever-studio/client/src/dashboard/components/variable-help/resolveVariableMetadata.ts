import type {
  EmailVariableSnapshot,
  VariableSectionKey,
} from '@shared/email-variables.ts'
import {
  getEmailVariableGlossaryField,
  getEmailVariableGlossaryValue,
} from '@shared/email-variable-glossary.ts'
import {
  STYLE_AUTHOR_DESCRIPTIONS,
  STYLE_AUTHOR_LABELS,
  type StyleKey,
} from '@shared/writing-styles.ts'

export type VariableHelpMeta = {
  whatItIs: string
  designNote?: string
}

function glossaryFieldKey(itemKey: VariableSectionKey): string {
  switch (itemKey) {
    case 'preheader':
      return 'preheaderPresent'
    case 'offer':
      return 'hasOffer'
    default:
      return itemKey
  }
}

export function styleKeyFromAuthorLabel(label: string): StyleKey | undefined {
  const entry = Object.entries(STYLE_AUTHOR_LABELS).find(
    ([, author]) => author === label,
  )
  return entry?.[0] as StyleKey | undefined
}

export function resolveVariableHelp(
  itemKey: VariableSectionKey,
): VariableHelpMeta | null {
  const field = getEmailVariableGlossaryField(glossaryFieldKey(itemKey))
  if (!field) return null

  return {
    whatItIs: field.whatItIs,
    designNote: field.designNote,
  }
}

function resolveFreeFormMeaning(
  glossaryKey: string,
  displayValue: string,
): string | null {
  if (!displayValue) return null

  const field = getEmailVariableGlossaryField(glossaryKey)
  return field?.freeForm?.meaning ?? null
}

function resolvePreheaderValueMeaning(
  snapshot: EmailVariableSnapshot,
): string | null {
  if (!snapshot.preheaderPresent) return null

  const lengthMeaning = getEmailVariableGlossaryValue(
    'preheaderLength',
    snapshot.preheaderLength,
  )?.meaning
  const relationshipMeaning = getEmailVariableGlossaryValue(
    'preheaderRelationship',
    snapshot.preheaderRelationship,
  )?.meaning

  const parts = [lengthMeaning, relationshipMeaning].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : null
}

function resolveOfferValueMeaning(
  snapshot: EmailVariableSnapshot,
): string | null {
  if (!snapshot.hasOffer) return null

  const typeMeaning = snapshot.offerType
    ? getEmailVariableGlossaryValue('offerType', snapshot.offerType)?.meaning
    : null

  if (typeMeaning) return typeMeaning

  return null
}

function stripAuthorPrefix(label: string, description: string): string {
  for (const separator of [' — ', ' - ']) {
    const prefix = `${label}${separator}`
    if (description.startsWith(prefix)) {
      return description.slice(prefix.length)
    }
  }
  return description
}

function resolveWritingStyleValueMeaning(
  snapshot: EmailVariableSnapshot,
): string | null {
  if (!snapshot.writingStyle) return null

  const styleKey = styleKeyFromAuthorLabel(snapshot.writingStyle)
  if (styleKey) {
    return stripAuthorPrefix(
      STYLE_AUTHOR_LABELS[styleKey],
      STYLE_AUTHOR_DESCRIPTIONS[styleKey],
    )
  }

  return (
    getEmailVariableGlossaryValue('writingStyle', snapshot.writingStyle)
      ?.meaning ?? null
  )
}

export function resolveVariableValueMeaning(
  itemKey: VariableSectionKey,
  snapshot: EmailVariableSnapshot,
  displayValue: string,
): string | null {
  switch (itemKey) {
    case 'writingStyle':
      return resolveWritingStyleValueMeaning(snapshot)
    case 'preheader':
      return resolvePreheaderValueMeaning(snapshot)
    case 'offer':
      return resolveOfferValueMeaning(snapshot)
    case 'ctaCopy':
      return resolveFreeFormMeaning('ctaCopy', displayValue)
    default: {
      const field = getEmailVariableGlossaryField(itemKey)
      if (field?.freeForm) {
        return resolveFreeFormMeaning(itemKey, displayValue)
      }

      const raw = snapshot[itemKey as keyof EmailVariableSnapshot]
      const glossaryValue = getEmailVariableGlossaryValue(
        itemKey,
        typeof raw === 'boolean' ? raw : raw,
      )

      return glossaryValue?.meaning ?? null
    }
  }
}
