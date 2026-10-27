import { useCallback, useEffect, useRef, useState } from 'react'

export function useProfilePhoto(
  avatarUrl: string,
  loadPhoto: () => Promise<Blob>,
  version: number
) {
  const [src, setSrc] = useState<string | null>(null)
  const loadRef = useRef(loadPhoto)
  const currentUrl = useRef<string | null>(null)
  loadRef.current = loadPhoto

  const replace = useCallback((next: string | null) => {
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current)
    currentUrl.current = next
    setSrc(next)
  }, [])

  useEffect(
    () => () => {
      if (currentUrl.current) URL.revokeObjectURL(currentUrl.current)
    },
    []
  )

  useEffect(() => {
    if (!avatarUrl) {
      replace(null)
      return
    }

    let cancelled = false
    loadRef
      .current()
      .then((blob) => {
        if (!cancelled) replace(URL.createObjectURL(blob))
      })
      .catch(() => {
        if (!cancelled) replace(null)
      })

    return () => {
      cancelled = true
    }
  }, [avatarUrl, version, replace])

  return src
}