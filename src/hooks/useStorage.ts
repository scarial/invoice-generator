import { useState } from 'react'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const setStoredValue = (newValue: T | ((prev: T) => T)) => {
    setValue(prev => {
      const resolved = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue
      try {
        localStorage.setItem(key, JSON.stringify(resolved))
      } catch (err) {
        // F6: surface storage quota/private mode errors to the console
        console.warn(`[useLocalStorage] Failed to persist "${key}":`, err)
      }
      return resolved
    })
  }

  return [value, setStoredValue] as const
}
