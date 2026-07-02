export {
  WRITING_STYLES,
  STYLE_AUTHOR_LABELS,
  resolveStyle,
  type StyleKey,
} from '../shared/writing-styles.ts'

import { WRITING_STYLES, resolveStyle, type StyleKey } from '../shared/writing-styles.ts'

/** CLI flag resolver — exits on invalid key. */
export function resolveStyleFromFlag(
  flag: string | undefined,
): { key: StyleKey; text: string } | undefined {
  if (!flag) return undefined

  const key = flag.toLowerCase() as StyleKey
  if (!(key in WRITING_STYLES)) {
    console.error(
      `Invalid --style "${flag}". Choose: ${Object.keys(WRITING_STYLES).join(', ')}`,
    )
    process.exit(1)
  }

  const resolved = resolveStyle(key)
  return { key: resolved.key, text: resolved.text }
}

/** @deprecated Use resolveStyleFromFlag for CLI; resolveStyle from shared for typed keys. */
export const resolveStyleFlag = resolveStyleFromFlag
