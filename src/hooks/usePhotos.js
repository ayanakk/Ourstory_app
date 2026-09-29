import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useSpace } from './useSpace'

export function usePhotos() {
  const { space } = useSpace()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPhotos = useCallback(async () => {
    if (!space?.id) {
      setPhotos([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from('photos')
        .select('*, memories(id, title, date, place_name)')
        .eq('space_id', space.id)
        .order('created_at', { ascending: false })

      if (fetchErr) {
        console.error('Error fetching photos:', fetchErr)
        setError(fetchErr)
      } else {
        setPhotos(data || [])
      }
    } catch (err) {
      console.error('Unexpected error fetching photos:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [space?.id])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const toggleFavorite = useCallback(async (photoId) => {
    let previous = null
    let next = null
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id !== photoId) return p
        previous = p.is_favorite
        next = !p.is_favorite
        return { ...p, is_favorite: next }
      })
    )

    const { error: updateErr } = await supabase
      .from('photos')
      .update({ is_favorite: next })
      .eq('id', photoId)

    if (updateErr) {
      setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, is_favorite: previous } : p)))
    }
    return { error: updateErr }
  }, [])

  return {
    photos,
    loading,
    error,
    refresh: fetchPhotos,
    toggleFavorite,
  }
}
