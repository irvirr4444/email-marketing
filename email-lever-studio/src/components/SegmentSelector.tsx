import type { CustomerSegment } from '../types'
import {
  CUSTOMER_SEGMENT_OPTIONS,
  labelForSegment,
} from '../types'
import { MaterialIcon } from './MaterialIcon'

type SegmentSelectorProps = {
  value: CustomerSegment | ''
  disabled?: boolean
  onChange: (segment: CustomerSegment | '') => void
}

const SEGMENT_META: Record<
  CustomerSegment,
  { icon: string; hint: string }
> = {
  cold_prospect: { icon: 'person_search', hint: 'No prior relationship' },
  warm_lead: { icon: 'local_fire_department', hint: 'Some awareness or interest' },
  trial_active: { icon: 'science', hint: 'Currently evaluating' },
  trial_expiring: { icon: 'hourglass_top', hint: 'Trial ending soon' },
  first_time_buyer: { icon: 'shopping_bag', hint: 'New customer' },
  repeat: { icon: 'loyalty', hint: 'Has purchased before' },
  vip: { icon: 'workspace_premium', hint: 'High-value relationship' },
  churned: { icon: 'person_off', hint: 'Left or went inactive' },
  win_back: { icon: 'replay', hint: 'Re-engaging after lapse' },
  referral_source: { icon: 'group_add', hint: 'Came through a referral' },
  partner_affiliate: { icon: 'handshake', hint: 'Partner or affiliate' },
  investor_advisor: { icon: 'insights', hint: 'Investor or advisor' },
}

export function SegmentSelector({
  value,
  disabled,
  onChange,
}: SegmentSelectorProps) {
  return (
    <div className="segment-panel">
      <div className="segment-panel-header">
        <div>
          <p className="segment-panel-label">Relationship</p>
          <p className="mt-1 text-[13px] text-[var(--on-surface-variant)]">
            How well do they know you? This shapes tone and style suggestions.
          </p>
        </div>
        {value ? (
          <div className="segment-panel-badge" aria-hidden>
            <MaterialIcon name={SEGMENT_META[value].icon} size={20} />
            <span>{labelForSegment(value)}</span>
          </div>
        ) : null}
      </div>

      <div className="segment-grid" role="radiogroup" aria-label="Relationship">
        {CUSTOMER_SEGMENT_OPTIONS.map((seg) => {
          const meta = SEGMENT_META[seg]
          const selected = value === seg

          return (
            <button
              key={seg}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(selected ? '' : seg)}
              className={`segment-option m-ripple ${selected ? 'selected' : ''}`}
            >
              <span className="segment-option-icon">
                <MaterialIcon name={meta.icon} size={22} />
              </span>
              <span className="segment-option-label">{labelForSegment(seg)}</span>
              <span className="segment-option-hint">{meta.hint}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
