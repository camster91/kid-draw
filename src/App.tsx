import { useCallback, useEffect, useRef, useState } from 'react'
import { TEMPLATES, templateToDataUrl, type Template } from './templates'
import { sfx } from './sound'
import './App.css'

type Tool = 'pen' | 'marker' | 'eraser' | 'fill'

const PALETTE = [
  '#000000', '#FFFFFF', '#E74C3C', '#F39C12', '#F1C40F',
  '#2ECC71', '#1ABC9C', '#3498DB', '#9B59B6', '#E91E63',
  '#8B4513', '#FFB6C1', '#FFA500', '#7CFC00', '#00CED1',
]

const BRUSH_SIZES = [
  { label: 'S', px: 6 },
  { label: 'M', px: 14 },
  { label: 'L', px: 26 },
  { label: 'XL', px: 44 },
]

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const lastPtRef = useRef<{ x: number; y: number } | null>(null)
  const startPtRef = useRef<{ x: number; y: number } | null>(null)
  const templateImgRef = useRef<HTMLImageElement | null>(null)
  // Pre-rendered outline-only mask — used as a hard boundary for flood fill
  // so fills stay inside the shape, not the white background.
  const outlineMaskRef = useRef<ImageData | null>(null)
  const historyRef = useRef<ImageData[]>([])

  const [color, setColor] = useState<string>('#E74C3C')
  const [sizeIdx, setSizeIdx] = useState(1)
  const [tool, setTool] = useState<Tool>('pen')
  const [template, setTemplate] = useState<Template>(TEMPLATES[0])
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  const size = BRUSH_SIZES[sizeIdx].px

  // Resize canvas to viewport.
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const w = window.innerWidth
      const h = window.innerHeight
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Re-stamp template onto the freshly sized canvas.
      stampTemplate()
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Load template image, then stamp it as the base layer (and whitewash the
  // rest of the canvas) so the outline stays under the kid's strokes.
  useEffect(() => {
    if (template.id === 'blank') {
      templateImgRef.current = null
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height)
      historyRef.current = []
      return
    }
    const img = new Image()
    img.onload = () => {
      templateImgRef.current = img
      stampTemplate()
    }
    img.src = templateToDataUrl(template)
  }, [template])

  const stampTemplate = useCallback(() => {
    const canvas = canvasRef.current
    const img = templateImgRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0) // identity for full-canvas ops
    // Whitewash the whole canvas first so the outline shows on clean paper.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (!img) { ctx.restore(); outlineMaskRef.current = null; return }
    // Restore DPR transform and fit the template
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const cw = window.innerWidth
    const ch = window.innerHeight
    const scale = Math.min(cw / img.width, ch / img.height) * 0.85
    const w = img.width * scale
    const h = img.height * scale
    const x = (cw - w) / 2
    const y = (ch - h) / 2
    ctx.drawImage(img, x, y, w, h)
    ctx.restore()
    // Build outline-only mask: scan the entire canvas and mark outline pixels
    // (luminance < 50) so the flood fill can use them as hard boundaries.
    const fullImage = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const mask = new Uint8Array(canvas.width * canvas.height) // 1 = outline, 0 = fillable
    const mdata = fullImage.data
    for (let i = 0, p = 0; i < mdata.length; i += 4, p++) {
      const lum = 0.299 * mdata[i] + 0.587 * mdata[i + 1] + 0.114 * mdata[i + 2]
      mask[p] = lum < 50 ? 1 : 0
    }
    // Pack into a synthetic ImageData-like object so we don't allocate
    // an extra full RGBA buffer (we only need the alpha channel).
    outlineMaskRef.current = {
      data: mask,
      width: canvas.width,
      height: canvas.height,
      colorSpace: 'srgb',
    } as unknown as ImageData
    historyRef.current = [] // template change invalidates history
  }, [])

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.getContext('2d')
  }, [])

  const pt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const pushHistory = () => {
    const canvas = canvasRef.current
    const ctx = getCtx()
    if (!canvas || !ctx) return
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    if (historyRef.current.length > 30) historyRef.current.shift()
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    const p = pt(e)
    // Fill tool: single tap, no drag. Push history then fill.
    if (tool === 'fill') {
      pushHistory()
      floodFill(Math.floor(p.x * (window.devicePixelRatio || 1)), Math.floor(p.y * (window.devicePixelRatio || 1)))
      sfx.pop()
      return
    }
    drawingRef.current = true
    lastPtRef.current = p
    startPtRef.current = p
    pushHistory()
    sfx.scribble()
  }

  // Scanline flood fill — uses the pre-built outline mask as a hard boundary
  // so fills stay inside shapes. Kid taps inside a shape, the contiguous
  // fillable region (white or already-colored) gets replaced with the new color.
  const floodFill = (x: number, y: number) => {
    const canvas = canvasRef.current
    const ctx = getCtx()
    if (!canvas || !ctx) return
    const mask = outlineMaskRef.current
    if (!mask) return
    const w = canvas.width
    const h = canvas.height
    if (x < 0 || y < 0 || x >= w || y >= h) return
    // If the tap landed on an outline pixel, do nothing (don't paint over lines)
    if (mask.data[y * w + x]) return
    const img = ctx.getImageData(0, 0, w, h)
    const data = img.data
    const i = (y * w + x) * 4
    const target = [data[i], data[i + 1], data[i + 2], data[i + 3]]
    const fill = hexToRgba(color)
    // No-op if same color
    if (target[0] === fill[0] && target[1] === fill[1] && target[2] === fill[2] && target[3] === fill[3]) return
    const stack: number[] = [x, y]
    const tolerance = 90
    while (stack.length) {
      const cy = stack.pop()!
      const cx = stack.pop()!
      if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue
      // Hard outline boundary from the pre-rendered mask
      if (mask.data[cy * w + cx]) continue
      const ci = (cy * w + cx) * 4
      if (Math.abs(data[ci] - target[0]) > tolerance) continue
      if (Math.abs(data[ci + 1] - target[1]) > tolerance) continue
      if (Math.abs(data[ci + 2] - target[2]) > tolerance) continue
      if (Math.abs(data[ci + 3] - target[3]) > tolerance) continue
      data[ci] = fill[0]
      data[ci + 1] = fill[1]
      data[ci + 2] = fill[2]
      data[ci + 3] = fill[3]
      stack.push(cx + 1, cy)
      stack.push(cx - 1, cy)
      stack.push(cx, cy + 1)
      stack.push(cx, cy - 1)
    }
    ctx.putImageData(img, 0, 0)
  }

  const hexToRgba = (hex: string): [number, number, number, number] => {
    const h = hex.replace('#', '')
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      255,
    ]
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const ctx = getCtx()
    if (!ctx) return
    const p = pt(e)
    const last = lastPtRef.current ?? p
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = size
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color
      if (tool === 'marker') {
        ctx.globalAlpha = 0.55
        ctx.lineWidth = size * 1.4
      } else {
        ctx.globalAlpha = 1
      }
    }
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    // Also draw a dot at the start so single taps register.
    ctx.beginPath()
    ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2)
    ctx.fillStyle = ctx.strokeStyle
    ctx.fill()
    lastPtRef.current = p
  }

  const onPointerUp = () => {
    drawingRef.current = false
    lastPtRef.current = null
    startPtRef.current = null
  }

  const undo = () => {
    const canvas = canvasRef.current
    const ctx = getCtx()
    if (!canvas || !ctx) return
    const prev = historyRef.current.pop()
    if (!prev) return
    ctx.putImageData(prev, 0, 0)
    sfx.pop()
  }

  const clearAll = () => {
    const canvas = canvasRef.current
    const ctx = getCtx()
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    historyRef.current = []
    sfx.clear()
  }

  const saveDrawing = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
    )
    const file = new File([blob], `kid-draw-${Date.now()}.png`, { type: 'image/png' })
    const url = URL.createObjectURL(file)
    // Try native share (iPad share sheet, falls back to download)
    const navAny = navigator as unknown as { canShare?: (d: { files: File[] }) => boolean; share?: (d: ShareData) => Promise<void> }
    if (navAny.canShare?.({ files: [file] })) {
      try {
        await navAny.share?.({ files: [file], title: 'My Drawing' })
        sfx.done()
        setShowSaved(true)
        setTimeout(() => setShowSaved(false), 1800)
        return
      } catch { /* user cancelled */ }
    }
    // Fallback: open in new tab
    window.open(url, '_blank')
    sfx.done()
  }

  const selectColor = (c: string) => { setColor(c); sfx.tap() }
  const selectSize = (i: number) => { setSizeIdx(i); sfx.tap() }
  const selectTool = (t: Tool) => { setTool(t); sfx.tap() }

  return (
    <div className="app">
      <canvas
        ref={canvasRef}
        className="draw-layer"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      />

      {/* Top-right tool stack */}
      <div className="tool-rail">
        <ToolButton active={tool === 'pen'} onClick={() => selectTool('pen')} title="Pen">✏️</ToolButton>
        <ToolButton active={tool === 'marker'} onClick={() => selectTool('marker')} title="Marker">🖍️</ToolButton>
        <ToolButton active={tool === 'fill'} onClick={() => selectTool('fill')} title="Fill">🪣</ToolButton>
        <ToolButton active={tool === 'eraser'} onClick={() => selectTool('eraser')} title="Eraser">🧽</ToolButton>
        <div className="rail-divider" />
        <ToolButton onClick={undo} title="Undo">↩️</ToolButton>
        <ToolButton onClick={clearAll} title="Clear All">🗑️</ToolButton>
        <ToolButton onClick={saveDrawing} title="Save & Share" highlight>📤</ToolButton>
      </div>

      {/* Bottom palette */}
      <div className="palette">
        <div className="palette-row">
          {PALETTE.map((c) => (
            <button
              key={c}
              className={`swatch ${color === c ? 'selected' : ''}`}
              style={{ background: c, borderColor: c === '#FFFFFF' ? '#ddd' : c }}
              onClick={() => selectColor(c)}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
        <div className="size-row">
          {BRUSH_SIZES.map((s, i) => (
            <button
              key={s.label}
              className={`size-btn ${sizeIdx === i ? 'selected' : ''}`}
              onClick={() => selectSize(i)}
              aria-label={`Brush size ${s.label}`}
            >
              <span className="size-dot" style={{ width: s.px, height: s.px }} />
            </button>
          ))}
          <div className="rail-divider v" />
          <button
            className="size-btn"
            onClick={() => { sfx.tap(); setShowTemplates(true) }}
            aria-label="Templates"
            title="Templates"
          >
            <span style={{ fontSize: 28 }}>{template.label}</span>
          </button>
        </div>
      </div>

      {showTemplates && (
        <div className="modal-backdrop" onClick={() => setShowTemplates(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Pick a template</div>
            <div className="template-grid">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  className={`template-btn ${template.id === t.id ? 'selected' : ''}`}
                  onClick={() => { setTemplate(t); setShowTemplates(false); sfx.pop() }}
                >
                  <span style={{ fontSize: 48 }}>{t.label}</span>
                </button>
              ))}
            </div>
            <button className="modal-close" onClick={() => setShowTemplates(false)}>Close</button>
          </div>
        </div>
      )}

      {showSaved && (
        <div className="saved-pill">Saved ✓</div>
      )}
    </div>
  )
}

function ToolButton({
  children, onClick, active, title, highlight,
}: { children: React.ReactNode; onClick: () => void; active?: boolean; title: string; highlight?: boolean }) {
  return (
    <button
      className={`tool-btn ${active ? 'active' : ''} ${highlight ? 'highlight' : ''}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  )
}

export default App
