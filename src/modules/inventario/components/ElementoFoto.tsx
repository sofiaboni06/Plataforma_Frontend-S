import { useEffect, useState } from 'react'
import { getToken } from '@/shared/lib/api'

const blobCache = new Map<string, string>()

function isRemoteFile(src: string) {
  return /^https?:\/\//i.test(src) && !src.includes('/api/v1/')
}

export function fotoUrlDelElemento(id: number, urlFotografia?: string | null) {
  if (!urlFotografia) return null
  if (isRemoteFile(urlFotografia) || urlFotografia.startsWith('/api/')) return urlFotografia
  return `/api/v1/inventario/elementos/${id}/fotografia`
}

export default function ElementoFoto({
  src,
  alt,
  className,
}: {
  src: string | null | undefined
  alt: string
  className?: string
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(() => (src ? (blobCache.get(src) ?? null) : null))
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!src) {
      setBlobUrl(null)
      setFailed(false)
      return
    }
    if (isRemoteFile(src) || src.startsWith('blob:') || src.startsWith('data:')) {
      setBlobUrl(src)
      setFailed(false)
      return
    }

    const cached = blobCache.get(src)
    if (cached) {
      setBlobUrl(cached)
      setFailed(false)
      return
    }

    let cancelled = false
    const token = getToken()
    setBlobUrl(null)
    setFailed(false)

    fetch(src, {
      headers: {
        Accept: 'image/*',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error('foto')
        return response.blob()
      })
      .then((blob) => {
        if (cancelled) return
        const next = URL.createObjectURL(blob)
        blobCache.set(src, next)
        setBlobUrl(next)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [src])

  if (!src || failed) return null
  if (!blobUrl) {
    return <span className={className} aria-hidden />
  }

  return <img src={blobUrl} alt={alt} className={className} />
}
