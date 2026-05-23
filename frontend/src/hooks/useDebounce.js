import { useState, useEffect } from 'react'
export function useDebounce(value, delay = 400) {
  const [dv, setDv] = useState(value)
  useEffect(() => {
    const h = setTimeout(() => setDv(value), delay)
    return () => clearTimeout(h)
  }, [value, delay])
  return dv
}
