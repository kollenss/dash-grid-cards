import { useState, useEffect, useRef } from 'react'

interface StopArea { gid: string; name: string }

function StopAreaSearch({ value, label, onSelect }: {
  value: string; label: string
  onSelect: (gid: string, name: string) => void
}) {
  const [query, setQuery]     = useState(label)
  const [results, setResults] = useState<StopArea[]>([])
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef           = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef            = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(label) }, [label])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/vasttrafik/locations/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setResults((data.results ?? []).filter((r: any) => r.gid))
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 350)
  }

  function handleSelect(stop: StopArea) {
    setQuery(stop.name); setResults([]); setOpen(false); onSelect(stop.gid, stop.name)
  }

  return (
    <div className="stop-search" ref={wrapperRef}>
      <input className="modal-input" type="text" value={query} onChange={handleInput}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        placeholder="Search stop…" autoComplete="off" />
      {value && <div className="stop-search-gid">{value}</div>}
      {open && (results.length > 0 || loading) && (
        <ul className="stop-search-dropdown">
          {loading && <li className="stop-search-loading">Searching…</li>}
          {results.map(stop => (
            <li key={stop.gid}
              className={`stop-search-item ${stop.gid === value ? 'stop-search-item--selected' : ''}`}
              onMouseDown={() => handleSelect(stop)}>
              {stop.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface ConfigUIProps {
  config: Record<string, any>
  onChange: (key: string, value: any) => void
}

export default function AvgangstavlanConfigUI({ config, onChange }: ConfigUIProps) {
  const warnEnabled = !!config.warn_minutes
  return (
    <>
      <label className="modal-label">Hållplats
        <StopAreaSearch
          value={config.stop_area_gid ?? ''}
          label={config.stop_area_name ?? ''}
          onSelect={(gid, name) => { onChange('stop_area_gid', gid); onChange('stop_area_name', name) }}
        />
      </label>
      <label className="modal-label">Antal avgångar
        <input className="modal-input" type="number" min={1} max={20}
          value={config.limit ?? 8} onChange={e => onChange('limit', Number(e.target.value))} />
      </label>
      <label className="modal-label modal-label-check">
        <input type="checkbox" checked={!!config.hide_now}
          onChange={e => onChange('hide_now', e.target.checked || undefined)} />
        Dölj avgångar som redan avgått
      </label>
      <label className="modal-label modal-label-check">
        <input type="checkbox" checked={warnEnabled}
          onChange={e => onChange('warn_minutes', e.target.checked ? 5 : undefined)} />
        Varna när avgång är nära
      </label>
      {warnEnabled && (
        <label className="modal-label">Varningsgräns (minuter)
          <input className="modal-input" type="number" min={1} max={60}
            value={config.warn_minutes ?? 5}
            onChange={e => onChange('warn_minutes', Number(e.target.value))} />
        </label>
      )}
    </>
  )
}
