import { useState, useEffect, useCallback } from 'react'
import { parseIcs, type CalEvent } from './parseIcs'
import './GoogleCalendarCard.css'

interface Props {
  config: {
    title?: string
    ics_url?: string
  }
  colSpan?: number
  rowSpan?: number
}

function startOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatTime(d: Date): string {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatDuration(start: Date, end: Date): string {
  const mins = Math.round((end.getTime() - start.getTime()) / 60000)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function EventModal({ event, onClose }: { event: CalEvent; onClose: () => void }) {
  return (
    <div className="cal-modal-backdrop" onClick={onClose}>
      <div className="cal-modal" onClick={e => e.stopPropagation()}>
        <button className="cal-modal-close" onClick={onClose}>✕</button>
        <div className="cal-modal-title">{event.summary}</div>
        <div className="cal-modal-meta">
          <div className="cal-modal-row">
            <span className="cal-modal-icon">📅</span>
            <span>{formatDate(event.start)}</span>
          </div>
          {event.allDay ? (
            <div className="cal-modal-row">
              <span className="cal-modal-icon">⏱</span>
              <span>All day</span>
            </div>
          ) : (
            <div className="cal-modal-row">
              <span className="cal-modal-icon">⏱</span>
              <span>{formatTime(event.start)} – {formatTime(event.end)} ({formatDuration(event.start, event.end)})</span>
            </div>
          )}
          {event.location && (
            <div className="cal-modal-row">
              <span className="cal-modal-icon">📍</span>
              <span>{event.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GoogleCalendarCard({ config, colSpan = 4, rowSpan = 3 }: Props) {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<CalEvent | null>(null)

  const fetchEvents = useCallback(async () => {
    if (!config.ics_url) return
    setLoading(true)
    try {
      const encoded = encodeURIComponent(config.ics_url)
      const res = await fetch(`/api/plugin-rpc/google-calendar/ical?url=${encoded}`)
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? `HTTP ${res.status}`)
        return
      }
      setEvents(parseIcs(data.ics))
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [config.ics_url])

  useEffect(() => {
    fetchEvents()
    const timer = setInterval(fetchEvents, 15 * 60 * 1000)
    return () => clearInterval(timer)
  }, [fetchEvents])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekStart = startOfWeek(today)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const compact = rowSpan <= 2

  if (!config.ics_url) {
    return (
      <div className="glass-card cal-card">
        <div className="card-label">{config.title ?? 'Calendar'}</div>
        <div className="cal-empty">Add a calendar ICS URL in settings</div>
      </div>
    )
  }

  return (
    <div className="glass-card cal-card">
      {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}

      <div className="cal-header">
        <span className="card-label">{config.title ?? 'Calendar'}</span>
        {loading && <span className="cal-loading">↻</span>}
      </div>

      {error ? (
        <div className="cal-error">{error}</div>
      ) : (
        <div
          className={`cal-week ${compact ? 'cal-week--compact' : ''}`}
          style={{ gridTemplateColumns: `repeat(${colSpan >= 4 ? 7 : colSpan}, 1fr)` }}
        >
          {days.map((day, i) => {
            const isToday = sameDay(day, today)
            const dayEvents = events.filter(e => sameDay(e.start, day))
            const maxEvents = compact ? 1 : Math.max(2, rowSpan - 1)
            const visible = dayEvents.slice(0, maxEvents)
            const overflow = dayEvents.length - visible.length

            return (
              <div key={i} className={`cal-day ${isToday ? 'cal-day--today' : ''}`}>
                <div className="cal-day-header">
                  <span className="cal-day-name">{DAY_LABELS[i]}</span>
                  <span className={`cal-day-num ${isToday ? 'cal-day-num--today' : ''}`}>
                    {day.getDate()}
                  </span>
                </div>
                <div className="cal-events">
                  {visible.map((ev, j) => (
                    <div
                      key={j}
                      className="cal-event"
                      onClick={() => setSelected(ev)}
                      title="Click for details"
                    >
                      {!ev.allDay && (
                        <span className="cal-event-time">{formatTime(ev.start)}</span>
                      )}
                      <span className="cal-event-title">{ev.summary}</span>
                    </div>
                  ))}
                  {overflow > 0 && (
                    <div className="cal-more">+{overflow} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
