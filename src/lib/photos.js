import imageCompression from 'browser-image-compression'
import { supabase } from './supabase'

const signedUrlCache = new Map()

/**
 * Resolves a private storage path to a signed, time-limited URL.
 * Caches results in-memory until ~1min before expiry.
 */
export async function getSignedUrl(path, expiresIn = 3600) {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path
  }

  const cached = signedUrlCache.get(path)
  const now = Date.now()
  if (cached && cached.expiresAt > now + 60000) {
    return cached.url
  }

  try {
    const { data, error } = await supabase.storage
      .from('photos')
      .createSignedUrl(path, expiresIn)

    if (error || !data?.signedUrl) {
      console.warn('Could not create signed url for', path, error)
      return null
    }

    signedUrlCache.set(path, {
      url: data.signedUrl,
      expiresAt: now + expiresIn * 1000,
    })
    return data.signedUrl
  } catch (err) {
    console.error('Failed to get signed photo URL:', err)
    return null
  }
}

/**
 * Batch-resolves multiple storage paths to signed URLs in one request,
 * filling the shared cache. Returns a map of path -> url (or null on failure).
 */
export async function getSignedUrls(paths, expiresIn = 3600) {
  const result = {}
  const now = Date.now()
  const toFetch = []

  for (const path of paths || []) {
    if (!path) continue
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
      result[path] = path
      continue
    }
    const cached = signedUrlCache.get(path)
    if (cached && cached.expiresAt > now + 60000) {
      result[path] = cached.url
    } else {
      toFetch.push(path)
    }
  }

  if (toFetch.length) {
    try {
      const { data, error } = await supabase.storage
        .from('photos')
        .createSignedUrls(toFetch, expiresIn)

      if (error) {
        console.warn('Could not create signed urls', error)
      } else {
        for (const entry of data || []) {
          if (entry.signedUrl && !entry.error) {
            signedUrlCache.set(entry.path, {
              url: entry.signedUrl,
              expiresAt: now + expiresIn * 1000,
            })
            result[entry.path] = entry.signedUrl
          } else {
            result[entry.path] = null
          }
        }
      }
    } catch (err) {
      console.error('Failed to batch-create signed photo URLs:', err)
    }
  }

  return result
}

export async function deletePhotoFiles(paths) {
  if (!paths?.length) return
  const { error } = await supabase.storage.from('photos').remove(paths)
  if (error) console.error('Failed to delete photo files:', error)
}

/** Compresses an image file client-side before upload; falls back to the original on failure. */
export async function compressImage(file) {
  try {
    return await imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 2000,
      useWebWorker: true,
      fileType: 'image/jpeg',
    })
  } catch (err) {
    console.warn('Image compression failed, using original file:', err)
    return file
  }
}

/** Uploads a photo file to the private bucket at {spaceId}/{memoryId}/{uuid}.jpg */
export async function uploadPhoto(spaceId, memoryId, file) {
  const filename = `${spaceId}/${memoryId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('photos').upload(filename, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  })
  if (error) return { path: null, error }
  return { path: filename, error: null }
}
