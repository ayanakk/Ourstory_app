import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'
import { getSignedUrl, deletePhotoFiles } from '../lib/photos'
import { useSpace } from './useSpace'
import { useAuth } from './useAuth'

export const getSignedPhotoUrl = getSignedUrl

export function useMemories() {
  const { space } = useSpace()
  const { user } = useAuth()
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMemories = useCallback(async () => {
    if (!space?.id) {
      setMemories([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from('memories')
        .select('*, photos(*)')
        .eq('space_id', space.id)
        .order('date', { ascending: false })

      if (fetchErr) {
        console.error('Error fetching memories:', fetchErr)
        setError(fetchErr)
      } else {
        setMemories(data || [])
      }
    } catch (err) {
      console.error('Unexpected error fetching memories:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [space?.id])

  useEffect(() => {
    fetchMemories()
  }, [fetchMemories])

  const createMemory = useCallback(
    async (memoryData) => {
      if (!space?.id || !user?.id) {
        return { data: null, error: new Error('No active space or user') }
      }

      const { data, error: insertErr } = await supabase
        .from('memories')
        .insert({
          space_id: space.id,
          author_id: user.id,
          date: memoryData.date,
          title: memoryData.title,
          place_name: memoryData.place_name || null,
          mood: memoryData.mood || null,
          body: memoryData.body || null,
          caption: memoryData.caption || null,
          is_favorite: memoryData.is_favorite || false,
        })
        .select('*, photos(*)')
        .single()

      if (!insertErr) {
        await fetchMemories()
      }
      return { data, error: insertErr }
    },
    [space?.id, user?.id, fetchMemories]
  )

  const getMemoryById = useCallback(async (id) => {
    const { data, error: fetchErr } = await supabase
      .from('memories')
      .select('*, photos(*)')
      .eq('id', id)
      .single()
    return { data, error: fetchErr }
  }, [])

  const toggleFavorite = useCallback(
    async (id, nextValue) => {
      const { data, error: updateErr } = await supabase
        .from('memories')
        .update({ is_favorite: nextValue })
        .eq('id', id)
        .select()
        .single()

      if (!updateErr) {
        setMemories((prev) => prev.map((m) => (m.id === id ? { ...m, is_favorite: nextValue } : m)))
      }
      return { data, error: updateErr }
    },
    []
  )

  const updateMemory = useCallback(async (id, fields) => {
    const { data, error: updateErr } = await supabase
      .from('memories')
      .update(fields)
      .eq('id', id)
      .select('*, photos(*)')
      .single()
    if (!updateErr) {
      setMemories((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)))
    }
    return { data, error: updateErr }
  }, [])

  const deleteMemory = useCallback(async (memory) => {
    const paths = (memory.photos || []).map((p) => p.path).filter(Boolean)
    if (paths.length) {
      await deletePhotoFiles(paths)
    }

    const { error: deleteErr } = await supabase.from('memories').delete().eq('id', memory.id)

    if (!deleteErr) {
      setMemories((prev) => prev.filter((m) => m.id !== memory.id))
    }
    return { error: deleteErr }
  }, [])

  return {
    memories,
    loading,
    error,
    refresh: fetchMemories,
    createMemory,
    getMemoryById,
    toggleFavorite,
    updateMemory,
    deleteMemory,
    getSignedUrl: getSignedPhotoUrl,
  }
}
