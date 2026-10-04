import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useSpace } from './useSpace'

export function useSpecialDates() {
  const { space } = useSpace()
  const [items, setItems] = useState([])

  const fetchItems = useCallback(async () => {
    if (!space?.id) {
      setItems([])
      return
    }
    try {
      const { data, error } = await supabase
        .from('special_dates')
        .select('*')
        .eq('space_id', space.id)
        .order('month', { ascending: true })
        .order('day', { ascending: true })
      if (!error) setItems(data || [])
    } catch (err) {
      console.error('Failed to load special dates:', err)
    }
  }, [space?.id])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const addItem = useCallback(
    async (item) => {
      if (!space?.id) return { data: null, error: new Error('No active space') }
      const { data, error } = await supabase
        .from('special_dates')
        .insert({
          space_id: space.id,
          title: item.title,
          emoji: item.emoji || null,
          month: item.month,
          day: item.day,
          year_started: item.year_started || null,
          note: item.note || null,
        })
        .select()
        .single()
      if (!error) setItems((prev) => [...prev, data])
      return { data, error }
    },
    [space?.id]
  )

  const deleteItem = useCallback(
    async (id) => {
      const removed = items.find((it) => it.id === id)
      setItems((prev) => prev.filter((it) => it.id !== id))
      const { error } = await supabase.from('special_dates').delete().eq('id', id)
      if (error && removed) setItems((prev) => [...prev, removed])
      return { error }
    },
    [items]
  )

  return { items, refresh: fetchItems, addItem, deleteItem }
}
