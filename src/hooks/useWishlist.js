import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useSpace } from './useSpace'

// Dated items first (soonest first), then undated ones in the order they were added
function sortItems(list) {
  return [...list].sort((a, b) => {
    if (a.target_date && b.target_date) return a.target_date.localeCompare(b.target_date)
    if (a.target_date) return -1
    if (b.target_date) return 1
    return 0
  })
}

export function useWishlist() {
  const { space } = useSpace()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    if (!space?.id) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('space_id', space.id)
        .order('created_at', { ascending: true })
      if (!error) setItems(sortItems(data || []))
    } catch (err) {
      console.error('Failed to load wishlist:', err)
    } finally {
      setLoading(false)
    }
  }, [space?.id])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const addItem = useCallback(
    async (item) => {
      if (!space?.id) return { data: null, error: new Error('No active space') }
      const { data, error } = await supabase
        .from('wishlist')
        .insert({
          space_id: space.id,
          title: item.title,
          category: item.category || null,
          priority: item.priority ?? 2,
          notes: item.notes || null,
          target_date: item.target_date || null,
          place_name: item.place_name || null,
        })
        .select()
        .single()
      if (!error) setItems((prev) => sortItems([...prev, data]))
      return { data, error }
    },
    [space?.id]
  )

  const updateItem = useCallback(async (id, fields) => {
    const { data, error } = await supabase.from('wishlist').update(fields).eq('id', id).select().single()
    if (!error) setItems((prev) => sortItems(prev.map((it) => (it.id === id ? data : it))))
    return { data, error }
  }, [])

  const toggleDone = useCallback(async (id, nextValue) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, is_done: nextValue } : it)))
    const { error } = await supabase.from('wishlist').update({ is_done: nextValue }).eq('id', id)
    if (error) {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, is_done: !nextValue } : it)))
    }
    return { error }
  }, [])

  const convertToMemory = useCallback(async (id, memoryId) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, converted_memory_id: memoryId } : it)))
    const { error } = await supabase.from('wishlist').update({ converted_memory_id: memoryId }).eq('id', id)
    return { error }
  }, [])

  const getItemById = useCallback(async (id) => {
    const { data, error } = await supabase.from('wishlist').select('*').eq('id', id).single()
    return { data, error }
  }, [])

  const deleteItem = useCallback(
    async (id) => {
      const removed = items.find((it) => it.id === id)
      setItems((prev) => prev.filter((it) => it.id !== id))
      const { error } = await supabase.from('wishlist').delete().eq('id', id)
      if (error && removed) {
        setItems((prev) => [...prev, removed])
      }
      return { error }
    },
    [items]
  )

  return {
    items,
    loading,
    refresh: fetchItems,
    addItem,
    updateItem,
    toggleDone,
    convertToMemory,
    getItemById,
    deleteItem,
  }
}
