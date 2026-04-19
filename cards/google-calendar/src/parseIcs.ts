export interface CalEvent {
  uid: string
  summary: string
  start: Date
  end: Date
  allDay: boolean
  location?: string
}

const NO_TITLE = '(No title)'

function parseIcsDate(value: string): { date: Date; allDay: boolean } {
  // All-day: YYYYMMDD
  if (/^\d{8}$/.test(value)) {
    const y = +value.slice(0, 4)
    const m = +value.slice(4, 6) - 1
    const d = +value.slice(6, 8)
    return { date: new Date(y, m, d), allDay: true }
  }
  // Date-time local: YYYYMMDDTHHmmss
  if (/^\d{8}T\d{6}$/.test(value)) {
    const y = +value.slice(0, 4)
    const m = +value.slice(4, 6) - 1
    const d = +value.slice(6, 8)
    const h = +value.slice(9, 11)
    const min = +value.slice(11, 13)
    const s = +value.slice(13, 15)
    return { date: new Date(y, m, d, h, min, s), allDay: false }
  }
  // Date-time UTC: YYYYMMDDTHHmmssZ
  if (/^\d{8}T\d{6}Z$/.test(value)) {
    return { date: new Date(value.replace(
      /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
      '$1-$2-$3T$4:$5:$6Z'
    )), allDay: false }
  }
  return { date: new Date(value), allDay: false }
}

export function parseIcs(ics: string): CalEvent[] {
  const events: CalEvent[] = []
  const lines = ics.replace(/\r\n[ \t]/g, '').split(/\r?\n/)

  let inEvent = false
  let current: Partial<CalEvent> & { allDay?: boolean } = {}

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line === 'BEGIN:VEVENT') {
      inEvent = true
      current = {}
      continue
    }
    if (line === 'END:VEVENT') {
      inEvent = false
      if (current.uid && current.start && current.end) {
        if (!current.summary) current.summary = NO_TITLE
        events.push(current as CalEvent)
      }
      continue
    }
    if (!inEvent) continue

    const colon = line.indexOf(':')
    if (colon < 0) continue
    const key = line.slice(0, colon).split(';')[0].toUpperCase()
    const val = line.slice(colon + 1)

    switch (key) {
      case 'UID':
        current.uid = val
        break
      case 'SUMMARY':
        current.summary = val.replace(/\\,/g, ',').replace(/\\n/g, ' ').trim()
        break
      case 'LOCATION':
        current.location = val.replace(/\\,/g, ',').replace(/\\n/g, ' ').trim()
        break
      case 'DTSTART': {
        const { date, allDay } = parseIcsDate(val)
        current.start = date
        current.allDay = allDay
        break
      }
      case 'DTEND': {
        current.end = parseIcsDate(val).date
        break
      }
    }
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime())
}
