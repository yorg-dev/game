import { useEffect, useRef, useState } from 'react'
import type { DialogLine } from '../../game/dialog/DialogScript'
import { EventBus } from '../../game/EventBus'

interface DialogBoxProps {
  lines: DialogLine[]
  onClose: () => void
}

const TYPEWRITER_MS = 30

// Pixel-perfect border using layered box-shadow:
// black outer → tan highlight → dark wood → black inner
const PIXEL_BORDER: React.CSSProperties = {
  border: '4px solid #0d0705',
  boxShadow: '0 0 0 4px #c8974c, 0 0 0 8px #0d0705, 0 0 0 12px #7c4a1e',
  imageRendering: 'pixelated',
}

// Same stack but thinner — used for the speaker name box
const PIXEL_BORDER_SM: React.CSSProperties = {
  border: '3px solid #0d0705',
  boxShadow: '0 0 0 3px #c8974c, 0 0 0 6px #0d0705',
  imageRendering: 'pixelated',
}

export function DialogBox({ lines, onClose }: DialogBoxProps) {
  const [lineIndex, setLineIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [blink, setBlink] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentLine = lines[lineIndex]
  const isLast = lineIndex === lines.length - 1

  // Typewriter effect
  useEffect(() => {
    setDisplayedText('')
    setIsComplete(false)

    let i = 0
    timerRef.current = setInterval(() => {
      i++
      setDisplayedText(currentLine.text.slice(0, i))
      if (i >= currentLine.text.length) {
        clearInterval(timerRef.current!)
        timerRef.current = null
        setIsComplete(true)
      }
    }, TYPEWRITER_MS)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [lineIndex, currentLine.text])

  // Blink the continue arrow
  useEffect(() => {
    if (!isComplete) return
    const id = setInterval(() => setBlink((b) => !b), 500)
    return () => clearInterval(id)
  }, [isComplete])

  function advance() {
    if (!isComplete) {
      if (timerRef.current) clearInterval(timerRef.current)
      setDisplayedText(currentLine.text)
      setIsComplete(true)
      return
    }
    if (lineIndex < lines.length - 1) {
      setLineIndex((i) => i + 1)
    } else {
      EventBus.emit('dialog-end', undefined)
      onClose()
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName ?? '').toUpperCase()
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    // Backdrop click area — does NOT advance (prevents accidental dismiss)
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-10 px-6">
      {/* Outer pixel frame */}
      <div className="relative w-full max-w-2xl" style={PIXEL_BORDER} onClick={advance}>
        {/* Speaker name — sits above the box, aligned to left */}
        <div
          className="absolute left-4"
          style={{
            top: '-28px',
            ...PIXEL_BORDER_SM,
            background: '#1a0e06',
          }}
        >
          <span
            className="block px-3 py-[3px] text-[11px] font-bold uppercase tracking-widest"
            style={{
              fontFamily: '"Courier New", Courier, monospace',
              color: currentLine.speakerColor ?? '#f0e0c0',
              textShadow: `0 0 6px ${currentLine.speakerColor ?? '#c8974c'}88`,
              letterSpacing: '0.15em',
            }}
          >
            {currentLine.speaker}
          </span>
        </div>

        {/* Main dialog body */}
        <div
          className="flex items-start gap-4 px-5 py-4"
          style={{
            background: '#0d0705',
            minHeight: '88px',
            // Inner highlight top-left, shadow bottom-right
            boxShadow: 'inset 2px 2px 0 #2a1a0e, inset -2px -2px 0 #000',
          }}
        >
          {/* Speaker colour accent bar */}
          <div
            className="shrink-0 w-[3px] self-stretch mt-[2px]"
            style={{ background: currentLine.speakerColor ?? '#c8974c' }}
          />

          {/* Text */}
          <p
            className="flex-1 text-[13px] leading-[1.7]"
            style={{
              fontFamily: '"Courier New", Courier, monospace',
              color: '#f0e0c0',
            }}
          >
            {displayedText}
            {!isComplete && (
              <span
                className="inline-block w-[8px] h-[13px] ml-[2px] align-middle"
                style={{ background: '#f0e0c0', opacity: blink ? 1 : 0 }}
              />
            )}
          </p>

          {/* Continue arrow — pixel blinking ▼ */}
          {isComplete && (
            <div className="shrink-0 self-end mb-[2px]">
              <span
                className="block text-[14px] font-bold"
                style={{
                  fontFamily: 'monospace',
                  color: blink ? (currentLine.speakerColor ?? '#c8974c') : 'transparent',
                  lineHeight: 1,
                }}
              >
                {isLast ? '■' : '▼'}
              </span>
            </div>
          )}
        </div>

        {/* Bottom bar: progress pips + hint */}
        <div
          className="flex items-center justify-between px-4 py-[5px]"
          style={{
            background: '#140a04',
            borderTop: '2px solid #0d0705',
          }}
        >
          {/* Pip progress */}
          <div className="flex gap-[5px] items-center">
            {lines.map((_, i) => (
              <span
                key={i}
                className="inline-block w-[6px] h-[6px]"
                style={{
                  background:
                    i < lineIndex
                      ? '#4a2c14'
                      : i === lineIndex
                        ? (currentLine.speakerColor ?? '#c8974c')
                        : '#2a1608',
                  outline: `1px solid #0d0705`,
                }}
              />
            ))}
          </div>

          {/* Key hint */}
          <span
            className="text-[9px] uppercase tracking-widest"
            style={{ fontFamily: 'monospace', color: '#4a2c14' }}
          >
            {isComplete ? (isLast ? '[space] close' : '[space] next') : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
