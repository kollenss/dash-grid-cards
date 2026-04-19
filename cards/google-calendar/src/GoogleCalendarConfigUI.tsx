import type { ConfigUIProps } from '../../../sdk/types'

export default function GoogleCalendarConfigUI({ config, onChange }: ConfigUIProps) {
  return (
    <>
      <label className="modal-label">
        Calendar title
        <input
          className="modal-input"
          value={config.title ?? ''}
          onChange={e => onChange('title', e.target.value)}
          placeholder="Family calendar"
        />
      </label>

      <label className="modal-label">
        ICS URL
        <input
          className="modal-input"
          value={config.ics_url ?? ''}
          onChange={e => onChange('ics_url', e.target.value)}
          placeholder="https://calendar.google.com/calendar/ical/..."
        />
      </label>
      <p style={{ fontSize: 11, color: 'var(--color-text-dim)', margin: '-4px 0 0' }}>
        In Google Calendar: Settings → your calendar → Secret address in iCal format
      </p>
    </>
  )
}
