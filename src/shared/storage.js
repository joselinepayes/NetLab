import { useCallback, useEffect, useState } from 'react'

const PREFIX = 'netlab.'

export function readJSON(key, fallback) {
  try {
    const v = localStorage.getItem(PREFIX + key)
    return v == null ? fallback : JSON.parse(v)
  } catch { return fallback }
}
export function writeJSON(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)) } catch { /* modo privado / sin espacio */ }
}

export function useStored(key, initial) {
  const [value, setValue] = useState(() => readJSON(key, initial))
  useEffect(() => { writeJSON(key, value) }, [key, value])
  const reset = useCallback(() => setValue(initial), [initial])
  return [value, setValue, reset]
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch { return false }
  }
}
