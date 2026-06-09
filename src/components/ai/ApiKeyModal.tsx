import { useState } from 'react'
import { Key, Eye, EyeOff, ExternalLink } from 'lucide-react'

interface Props {
  onSave: (key: string) => void
  error?: string | null
}

export function ApiKeyModal({ onSave, error }: Props) {
  const [value, setValue] = useState('')
  const [visible, setVisible] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) onSave(value.trim())
  }

  return (
    <div className="apikey-overlay">
      <div className="apikey-modal">
        <div className="apikey-modal__icon">
          <Key size={22} color="#6366f1" />
        </div>
        <h2 className="apikey-modal__title">Clé API Google AI requise</h2>
        <p className="apikey-modal__desc">
          L'assistant IA utilise Google Gemini. Saisissez votre clé API pour activer le tchat.
          Elle sera stockée uniquement dans votre navigateur (localStorage).
        </p>
        <a
          className="apikey-modal__link"
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
        >
          Obtenir une clé gratuite <ExternalLink size={12} />
        </a>

        <form className="apikey-modal__form" onSubmit={handleSubmit}>
          <div className="apikey-modal__field">
            <input
              type={visible ? 'text' : 'password'}
              className="apikey-modal__input"
              placeholder="AIza..."
              value={value}
              onChange={e => setValue(e.target.value)}
              autoFocus
              spellCheck={false}
            />
            <button
              type="button"
              className="apikey-modal__toggle"
              onClick={() => setVisible(v => !v)}
              tabIndex={-1}
            >
              {visible ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && <div className="apikey-modal__error">{error}</div>}

          <button
            className="apikey-modal__submit"
            type="submit"
            disabled={!value.trim()}
          >
            Enregistrer et activer
          </button>
        </form>

        <p className="apikey-modal__note">
          La clé n'est jamais envoyée à nos serveurs.
        </p>
      </div>
    </div>
  )
}
