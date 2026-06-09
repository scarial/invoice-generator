import { useState, useCallback } from 'react'

const STORAGE_KEY = 'google_ai_api_key'

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  })

  const saveApiKey = useCallback((key: string) => {
    const trimmed = key.trim()
    localStorage.setItem(STORAGE_KEY, trimmed)
    setApiKeyState(trimmed)
  }, [])

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setApiKeyState('')
  }, [])

  return { apiKey, saveApiKey, clearApiKey, hasKey: apiKey.length > 0 }
}
