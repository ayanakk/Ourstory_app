import { createContext, useContext, useEffect, useState, useCallback, useMemo, createElement } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const SpaceContext = createContext(null)

export function SpaceProvider({ children }) {
  const { user } = useAuth()
  const [space, setSpace] = useState(null)
  const [member, setMember] = useState(null)
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchSpaceData = useCallback(async () => {
    if (!user) {
      setSpace(null)
      setMember(null)
      setPartner(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // 1. Query members table for the current user's membership
      const { data: myMember, error: memberErr } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (memberErr) {
        console.error('Error fetching member:', memberErr)
        setMember(null)
        setSpace(null)
        setPartner(null)
        setLoading(false)
        return
      }

      if (!myMember) {
        setMember(null)
        setSpace(null)
        setPartner(null)
        setLoading(false)
        return
      }

      // 2. Fetch the corresponding space
      const { data: spaceData, error: spaceErr } = await supabase
        .from('spaces')
        .select('*')
        .eq('id', myMember.space_id)
        .single()

      if (spaceErr) {
        console.error('Error fetching space:', spaceErr)
      }

      // 3. Fetch the partner's member row (if any)
      const { data: partnerData, error: partnerErr } = await supabase
        .from('members')
        .select('*')
        .eq('space_id', myMember.space_id)
        .neq('user_id', user.id)
        .maybeSingle()

      if (partnerErr) {
        console.error('Error fetching partner:', partnerErr)
      }

      setMember(myMember)
      setSpace(spaceData ?? null)
      setPartner(partnerData ?? null)
    } catch (err) {
      console.error('Unexpected error fetching space data:', err)
      setMember(null)
      setSpace(null)
      setPartner(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchSpaceData()
  }, [fetchSpaceData])

  const createSpace = useCallback(
    async (name, startDate, displayName) => {
      const { data, error } = await supabase.rpc('create_space', {
        p_name: name,
        p_start_date: startDate || null,
        p_display_name: displayName,
      })

      if (!error) {
        await fetchSpaceData()
      }
      return { data, error }
    },
    [fetchSpaceData]
  )

  const joinSpace = useCallback(
    async (code, displayName) => {
      const { data, error } = await supabase.rpc('join_space', {
        p_code: code?.trim(),
        p_display_name: displayName,
      })

      if (!error) {
        await fetchSpaceData()
      }
      return { data, error }
    },
    [fetchSpaceData]
  )

  const updateSpace = useCallback(
    async ({ name, startDate }) => {
      if (!space?.id) return { error: new Error('No active space') }
      const { data, error } = await supabase
        .from('spaces')
        .update({ name, start_date: startDate || null })
        .eq('id', space.id)
        .select()
        .single()
      if (!error) setSpace(data)
      return { data, error }
    },
    [space]
  )

  const updateDisplayName = useCallback(
    async (displayName) => {
      if (!member?.user_id) return { error: new Error('No active member') }
      const { data, error } = await supabase
        .from('members')
        .update({ display_name: displayName })
        .eq('user_id', member.user_id)
        .select()
        .single()
      if (!error) setMember(data)
      return { data, error }
    },
    [member]
  )

  const value = useMemo(
    () => ({
      space,
      member,
      partner,
      loading,
      createSpace,
      joinSpace,
      updateSpace,
      updateDisplayName,
      refresh: fetchSpaceData,
    }),
    [space, member, partner, loading, createSpace, joinSpace, updateSpace, updateDisplayName, fetchSpaceData]
  )

  return createElement(SpaceContext.Provider, { value }, children)
}

export function useSpace() {
  const context = useContext(SpaceContext)
  if (!context) {
    throw new Error('useSpace must be used within a SpaceProvider')
  }
  return context
}
