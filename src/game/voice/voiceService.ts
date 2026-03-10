// ---------------------------------------------------------------------------
// VoiceService
//
// Thin wrapper around the browser's Web Speech API (SpeechRecognition).
// Fires interim transcript callbacks for live UI feedback and final
// transcript callbacks for command dispatch.
// ---------------------------------------------------------------------------

type InterimHandler = (text: string) => void
type FinalHandler = (text: string) => void

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionCtor = new () => any

// Normalise across browser prefixes.
function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  return (
    (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor })
      .webkitSpeechRecognition ??
    null
  )
}

class VoiceService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any | null = null
  private interimHandlers: Set<InterimHandler> = new Set()
  private finalHandlers: Set<FinalHandler> = new Set()

  isSupported(): boolean {
    return getSpeechRecognitionCtor() !== null
  }

  get isListening(): boolean {
    return this.recognition !== null
  }

  start(): void {
    if (this.recognition) return
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return

    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = false

    rec.onresult = (e: any) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      if (interim) this.interimHandlers.forEach((fn) => fn(interim))
      if (final) this.finalHandlers.forEach((fn) => fn(final.trim()))
    }

    rec.onend = () => {
      this.recognition = null
    }

    this.recognition = rec
    rec.start()
  }

  stop(): void {
    this.recognition?.stop()
    this.recognition = null
  }

  onInterim(handler: InterimHandler): () => void {
    this.interimHandlers.add(handler)
    return () => this.interimHandlers.delete(handler)
  }

  onFinal(handler: FinalHandler): () => void {
    this.finalHandlers.add(handler)
    return () => this.finalHandlers.delete(handler)
  }
}

export const voiceService = new VoiceService()
