import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, ChevronDown, Send, Sparkles, RotateCcw } from 'lucide-react'
import { extractInvoiceFromText, type ExtractionResult, type ChatMessage } from '../../lib/invoiceExtractor'
import './AIAssistantBar.css'

interface Props {
  onExtracted: (result: ExtractionResult) => void
  invoiceKey?: string
}

// Extend window type for Web Speech API (not in lib.dom.d.ts)
interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

interface SpeechRecognitionEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : undefined

export function AIAssistantBar({ onExtracted, invoiceKey }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const [transcript, setTranscript] = useState('')
  const [listening, setListening] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])

  const [pendingResult, setPendingResult] = useState<ExtractionResult | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Reset when invoice changes
  useEffect(() => {
    setChatHistory([])
    setWarnings([])
    setError(null)
    setPendingResult(null)
  }, [invoiceKey])

  // Auto-expand when conversation starts
  useEffect(() => {
    if (chatHistory.length > 0) setExpanded(true)
  }, [chatHistory.length])

  // Scroll to bottom when history grows
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory.length, processing])

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  const startListening = () => {
    if (!SpeechRecognitionAPI) return
    setTranscript('')
    setError(null)

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'fr-FR'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('')
      setTranscript(result)
      if (event.results[event.results.length - 1].isFinal) {
        setText(result)
      }
    }

    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
    setTranscript(t => {
      setText(prev => prev || t)
      return t
    })
  }

  const handleSubmit = async () => {
    const input = text.trim()
    if (!input || processing) return

    setProcessing(true)
    setError(null)
    setWarnings([])
    setPendingResult(null)

    try {
      const { result, updatedHistory } = await extractInvoiceFromText(input, chatHistory)

      if (result.confidence === 'low') {
        setPendingResult(result)
        setChatHistory(updatedHistory)
        const lowWarnings = ['Confiance faible — vérifiez les données avant de les appliquer.', ...result.warnings]
        if (result.tva !== null) lowWarnings.push(`TVA détectée (${result.tva}%) — à saisir manuellement.`)
        setWarnings(lowWarnings)
        setProcessing(false)
        return
      }

      setChatHistory(updatedHistory)
      const allWarnings = [...result.warnings]
      if (result.tva !== null) {
        allWarnings.push(`TVA détectée (${result.tva}%) — à saisir manuellement dans le résumé.`)
      }
      if (allWarnings.length > 0) setWarnings(allWarnings)

      onExtracted(result)
      setText('')
      setTranscript('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setProcessing(false)
    }
  }

  const handleConfirmLow = () => {
    if (!pendingResult) return
    onExtracted(pendingResult)
    setPendingResult(null)
    setWarnings([])
    setText('')
    setTranscript('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleReset = () => {
    setChatHistory([])
    setWarnings([])
    setError(null)
    setPendingResult(null)
    setText('')
    setTranscript('')
  }

  const hasPending = pendingResult !== null
  const userMessages = chatHistory.filter(m => m.role === 'user')
  const hasHistory = userMessages.length > 0

  return (
    <div className={`ai-bar ${expanded ? 'ai-bar--expanded' : 'ai-bar--collapsed'}`}>
      <button className="ai-bar__header" onClick={() => setExpanded(v => !v)} type="button">
        <Sparkles size={13} color="#94a3b8" />
        <span className="ai-bar__label">
          Assistant IA
          {hasHistory && <span className="ai-bar__count">{userMessages.length}</span>}
        </span>
        {processing && <div className="ai-bar__spinner" />}
        <ChevronDown
          size={14}
          className={`ai-bar__chevron ${expanded ? 'ai-bar__chevron--open' : ''}`}
        />
      </button>

      {expanded && (
        <div className="ai-bar__body">
          {hasHistory && (
            <div className="ai-bar__history">
              {userMessages.map((msg, i) => (
                <div key={i} className="ai-bar__bubble">
                  <span className="ai-bar__bubble-text">{msg.text}</span>
                  <span className="ai-bar__bubble-check">✓</span>
                </div>
              ))}
              {processing && (
                <div className="ai-bar__bubble ai-bar__bubble--thinking">
                  <div className="ai-bar__spinner" />
                  <span>Analyse en cours…</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          <div className="ai-bar__controls">
            {SpeechRecognitionAPI && (
              <button
                className={`ai-bar__mic ${listening ? 'ai-bar__mic--listening' : ''}`}
                onClick={listening ? stopListening : startListening}
                title={listening ? 'Arrêter' : 'Dicter'}
                type="button"
              >
                {listening ? <div className="ai-bar__pulse" /> : <Mic size={14} color="#64748b" />}
              </button>
            )}
            {!SpeechRecognitionAPI && (
              <div className="ai-bar__mic" title="Voix non supportée" style={{ cursor: 'default' }}>
                <MicOff size={14} color="#cbd5e1" />
              </div>
            )}
            <input
              className="ai-bar__input"
              placeholder={hasHistory ? 'Précisez ou ajoutez…' : 'Décrivez la facture en langage naturel…'}
              value={text}
              onChange={e => {
                setText(e.target.value)
                if (pendingResult) setPendingResult(null)
              }}
              onKeyDown={handleKeyDown}
              disabled={processing}
            />
            <button
              className="ai-bar__send"
              onClick={hasPending ? handleConfirmLow : handleSubmit}
              disabled={processing || (!hasPending && !text.trim())}
              type="button"
            >
              {hasPending ? 'Confirmer' : <Send size={13} />}
            </button>
            {hasHistory && (
              <button
                className="ai-bar__reset"
                onClick={handleReset}
                title="Réinitialiser la conversation"
                type="button"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>

          {transcript && !text && (
            <div className="ai-bar__transcript">{transcript}</div>
          )}

          {error && <div className="ai-bar__error">{error}</div>}

          {warnings.length > 0 && (
            <div className="ai-bar__warnings">
              {warnings.map((w, i) => (
                <div key={i} className="ai-bar__warning">{w}</div>
              ))}
              {hasPending && (
                <div className="ai-bar__warning" style={{ fontStyle: 'italic' }}>
                  Appuyez sur Confirmer pour appliquer quand même, ou modifiez le texte et réessayez.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
