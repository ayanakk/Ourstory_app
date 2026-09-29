import { useState, useEffect } from 'react'
import { getSignedUrl } from '../../lib/photos'

/**
 * Resolves a private storage path to a signed URL and fades it in,
 * starting blurred, over a surface-2 placeholder while loading.
 */
export default function SignedImage({ path, alt = '', className = '', placeholderClassName, onLoad }) {
  const [url, setUrl] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    setUrl(null)
    setLoaded(false)
    if (!path) return
    getSignedUrl(path).then((signed) => {
      if (active) setUrl(signed)
    })
    return () => {
      active = false
    }
  }, [path])

  if (!url) {
    return <div className={`${placeholderClassName || className} bg-surface-2 animate-pulse`} aria-hidden="true" />
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onLoad={() => {
        setLoaded(true)
        onLoad?.()
      }}
      className={`${className} transition-all duration-700 ease-out ${
        loaded ? 'blur-0 opacity-100 scale-100' : 'blur-md opacity-0 scale-105'
      }`}
    />
  )
}
