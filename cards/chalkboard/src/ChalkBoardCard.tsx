import { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { CardProps } from '../../../sdk/types'

const BOARD_COLOR = '#2c5f2e'
const CHALK_COLORS = ['#ffffff', '#fffacd', '#ffd080', '#ff9090', '#90e890', '#90c8ff', '#ffb0e8', '#c8a0ff', '#ff9060']
const BASE_CHALK_SIZE = 8
const BASE_ERASER_SIZE = 52

function drawChalkSegment(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string,
  size: number
) {
  const dist = Math.hypot(x2 - x1, y2 - y1)
  const steps = Math.max(1, Math.ceil(dist))
  const angle = dist > 0 ? Math.atan2(y2 - y1, x2 - x1) : 0

  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps
    const x = x1 + (x2 - x1) * t
    const y = y1 + (y2 - y1) * t

    ctx.save()
    ctx.globalAlpha = 0.45 + Math.random() * 0.45
    ctx.fillStyle = color
    ctx.translate(
      x + (Math.random() - 0.5) * size * 0.25,
      y + (Math.random() - 0.5) * size * 0.25
    )
    ctx.rotate(angle + (Math.random() - 0.5) * 0.5)
    const w = size * (0.55 + Math.random() * 0.55)
    const h = size * (0.14 + Math.random() * 0.18)
    ctx.fillRect(-w / 2, -h / 2, w, h)
    ctx.restore()

    if (Math.random() < 0.25) {
      ctx.globalAlpha = 0.08 + Math.random() * 0.12
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(
        x + (Math.random() - 0.5) * size * 2,
        y + (Math.random() - 0.5) * size * 2,
        Math.random() * 1.5 + 0.5,
        0, Math.PI * 2
      )
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
}

interface OverlayProps {
  aspectW: number
  aspectH: number
  savedData: string | null
  onClose: (data: string) => void
}

function ChalkBoardOverlay({ aspectW, aspectH, savedData, onClose }: OverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<'chalk' | 'eraser'>('chalk')
  const [color, setColor] = useState(CHALK_COLORS[0])
  const drawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null)

  const canvasSize = useCallback(() => {
    const ratio = aspectW / aspectH
    const maxW = window.innerWidth * 0.9
    const maxH = window.innerHeight * 0.78
    let w = maxW
    let h = w / ratio
    if (h > maxH) { h = maxH; w = h * ratio }
    return { w: Math.floor(w), h: Math.floor(h) }
  }, [aspectW, aspectH])

  const [size] = useState(canvasSize)
  const dpr = window.devicePixelRatio || 1

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = BOARD_COLOR
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < 600; i++) {
      ctx.globalAlpha = 0.012
      ctx.fillStyle = '#000'
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 4 + 1, 1)
    }
    ctx.globalAlpha = 1

    if (savedData) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = savedData
    }
  }, [savedData])

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }, [])

  const eraseAt = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.fillStyle = BOARD_COLOR
    ctx.beginPath()
    ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 0.15
    ctx.fillStyle = '#4a7a4c'
    ctx.beginPath()
    ctx.arc(x + (Math.random() - 0.5) * 4, y + (Math.random() - 0.5) * 4, size * 0.35, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }, [])

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    drawing.current = true
    const pos = getPos(e, canvas)
    lastPos.current = pos
    const ctx = canvas.getContext('2d')!
    const chalkSize = BASE_CHALK_SIZE * dpr
    const eraserSize = BASE_ERASER_SIZE * dpr
    if (tool === 'eraser') {
      eraseAt(ctx, pos.x, pos.y, eraserSize)
    } else {
      drawChalkSegment(ctx, pos.x, pos.y, pos.x + 0.1, pos.y + 0.1, color, chalkSize)
    }
  }, [tool, color, dpr, getPos, eraseAt])

  const continueDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if ('clientX' in e && tool === 'eraser') {
      setEraserPos({ x: e.clientX, y: e.clientY })
    }
    if (!drawing.current || !lastPos.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    const chalkSize = BASE_CHALK_SIZE * dpr
    const eraserSize = BASE_ERASER_SIZE * dpr

    if (tool === 'eraser') {
      const dist = Math.hypot(pos.x - lastPos.current.x, pos.y - lastPos.current.y)
      const steps = Math.max(1, Math.ceil(dist / (eraserSize * 0.3)))
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        eraseAt(
          ctx,
          lastPos.current.x + (pos.x - lastPos.current.x) * t,
          lastPos.current.y + (pos.y - lastPos.current.y) * t,
          eraserSize
        )
      }
    } else {
      drawChalkSegment(ctx, lastPos.current.x, lastPos.current.y, pos.x, pos.y, color, chalkSize)
    }
    lastPos.current = pos
  }, [tool, color, dpr, getPos, eraseAt])

  const endDraw = useCallback(() => {
    drawing.current = false
    lastPos.current = null
  }, [])

  const clearBoard = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = BOARD_COLOR
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < 600; i++) {
      ctx.globalAlpha = 0.012
      ctx.fillStyle = '#000'
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 4 + 1, 1)
    }
    ctx.globalAlpha = 1
  }, [])

  const handleClose = useCallback(() => {
    const canvas = canvasRef.current
    onClose(canvas ? canvas.toDataURL() : '')
  }, [onClose])

  const handleCanvasMouseEnter = useCallback((e: React.MouseEvent) => {
    if (tool === 'eraser') setEraserPos({ x: e.clientX, y: e.clientY })
  }, [tool])

  const handleCanvasMouseLeave = useCallback(() => {
    setEraserPos(null)
    endDraw()
  }, [endDraw])

  // Show eraser ring when switching to eraser tool
  useEffect(() => {
    if (tool !== 'eraser') setEraserPos(null)
  }, [tool])

  const overlay = (
    <div className="chalk-overlay" onMouseDown={handleClose}>
      <div className="chalk-overlay-inner" onMouseDown={e => e.stopPropagation()}>
        <canvas
          ref={canvasRef}
          className={`chalk-canvas${tool === 'eraser' ? ' chalk-cursor-eraser' : ' chalk-cursor-chalk'}`}
          width={size.w * dpr}
          height={size.h * dpr}
          style={{ width: size.w, height: size.h }}
          onMouseDown={startDraw}
          onMouseMove={continueDraw}
          onMouseUp={endDraw}
          onMouseEnter={handleCanvasMouseEnter}
          onMouseLeave={handleCanvasMouseLeave}
          onTouchStart={startDraw}
          onTouchMove={continueDraw}
          onTouchEnd={endDraw}
        />
        <div className="chalk-toolbar">
          {CHALK_COLORS.map(c => (
            <button
              key={c}
              className={`chalk-color-btn${color === c && tool === 'chalk' ? ' active' : ''}`}
              style={{ background: c }}
              onMouseDown={e => { e.stopPropagation(); setColor(c); setTool('chalk') }}
              title={c}
            />
          ))}
          <div className="chalk-toolbar-sep" />
          <button
            className={`chalk-tool-btn${tool === 'eraser' ? ' active' : ''}`}
            onMouseDown={e => { e.stopPropagation(); setTool('eraser') }}
            title="Eraser (sponge)"
          >🧽</button>
          <button
            className="chalk-tool-btn"
            onMouseDown={e => { e.stopPropagation(); clearBoard() }}
            title="Clear board"
          >🗑️</button>
          <button className="chalk-close-btn" onMouseDown={e => { e.stopPropagation(); handleClose() }}>✕</button>
        </div>
      </div>

      {/* Eraser size cursor ring */}
      {tool === 'eraser' && eraserPos && (
        <div
          className="chalk-eraser-ring"
          style={{
            left: eraserPos.x - BASE_ERASER_SIZE / 2,
            top:  eraserPos.y - BASE_ERASER_SIZE / 2,
            width:  BASE_ERASER_SIZE,
            height: BASE_ERASER_SIZE,
          }}
        />
      )}
    </div>
  )

  return createPortal(overlay, document.body)
}

export default function ChalkBoardCard({ config }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [cardPx, setCardPx] = useState({ w: 224, h: 195 })
  const [savedDrawing, setSavedDrawing] = useState<string | null>(null)

  const openBoard = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      setCardPx({ w: rect.width, h: rect.height })
    }
    setOpen(true)
  }

  const closeBoard = (data: string) => {
    setSavedDrawing(data)
    setOpen(false)
  }

  return (
    <>
      <div ref={cardRef} className="chalk-card glass-card" onClick={openBoard} title={config.title || 'Chalkboard'}>
        <div className="chalk-card-bg">
          {savedDrawing ? (
            <img className="chalk-card-thumbnail" src={savedDrawing} alt="" draggable={false} />
          ) : (
            <div className="chalk-card-empty">
              <span className="chalk-card-icon">✏️</span>
              <span className="chalk-card-hint">Tap to draw</span>
            </div>
          )}
        </div>
      </div>
      {open && (
        <ChalkBoardOverlay
          aspectW={cardPx.w}
          aspectH={cardPx.h}
          savedData={savedDrawing}
          onClose={closeBoard}
        />
      )}
    </>
  )
}
