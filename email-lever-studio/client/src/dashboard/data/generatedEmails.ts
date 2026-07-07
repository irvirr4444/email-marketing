import { requireSupabase } from '../../lib/supabase'
import type {
  GeneratedEmailRow,
  GeneratedEmailSendRow,
} from '../../lib/database.types'

/** A generated email joined with its writing-style author label. */
export type GeneratedEmailWithStyle = GeneratedEmailRow & {
  writing_style_author: string | null
}

type JoinedRow = GeneratedEmailRow & {
  writing_style_ref: { author_label: string; key: string } | null
}

/** Generated email templates for a campaign, newest first, with style labels. */
export async function listGeneratedEmailsForCampaign(
  campaignId: string,
): Promise<GeneratedEmailWithStyle[]> {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('generated_email')
    .select('*, writing_style_ref:writing_style_id (author_label, key)')
    .eq('campaign_id', campaignId)
    .order('index_in_batch', { ascending: true })
  if (error) throw new Error(error.message)

  return ((data as JoinedRow[]) ?? []).map((row) => {
    const { writing_style_ref, ...rest } = row
    return {
      ...rest,
      writing_style_author:
        writing_style_ref?.author_label ?? rest.writing_style ?? null,
    }
  })
}

/**
 * Record that a generated template was sent as a concrete email_message.
 * Connects generated_email -> email_message via generated_email_send.
 */
export async function recordGeneratedEmailSend(
  generatedEmailId: string,
  messageId: string,
): Promise<GeneratedEmailSendRow> {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('generated_email_send')
    .insert({ generated_email_id: generatedEmailId, message_id: messageId })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as GeneratedEmailSendRow
}
