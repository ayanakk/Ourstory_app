import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo, createElement } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const SpaceContext = createContext(null)

export function SpaceProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? null
  const hasLoadedRef = useRef(false)
  const [space, setSpace] = useState(null)
  const [member, setMember] = useState(null)
  const [partner, setPartner] = useState(null)
  const [fetching, setFetching] = useState(true)
  const [loadedFor, setLoadedFor] = useState(null) // user id whose space data has been fetched

  const fetchSpaceData = useCallback(async () => {
    if (!userId) {
      hasLoadedRef.current = false
      setSpace(null)
      setMember(null)
      setPartner(null)
      setFetching(false)
      return
    }

    // Only show the full-screen loader on the first load; later refreshes are silent
    if (!hasLoadedRef.current) setFetching(true)
    try {
      // 1. Query members table for the current user's membership
      const { data: myMember, error: memberErr } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (memberErr) {
        console.error('Error fetching member:', memberErr)
        // Keep what we have on a failed silent refresh (e.g. flaky mobile network)
        if (!hasLoadedRef.current) {
          setMember(null)
          setSpace(null)
          setPartner(null)
        }
        setFetching(false)
        return
      }

      if (!myMember) {
        setMember(null)
        setSpace(null)
        setPartner(null)
        setFetching(false)
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
        .neq('user_id', userId)
        .maybeSingle()

      if (partnerErr) {
        console.error('Error fetching partner:', partnerErr)
      }

      setMember(myMember)
      setSpace(spaceData ?? null)
      setPartner(partnerData ?? null)
    } catch (err) {
      console.error('Unexpected error fetching space data:', err)
      if (!hasLoadedRef.current) {
        setMember(null)
        setSpace(null)
        setPartner(null)
      }
    } finally {
      hasLoadedRef.current = true
      setLoadedFor(userId)
      setFetching(false)
    }
  }, [userId])

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

  const checkDeleteAccount = useCallback(async () => {
    const { data, error } = await supabase.rpc('delete_account_check')
    return { data, error }
  }, [])

  const deleteAccount = useCallback(async (password) => {
    const { data, error } = await supabase.functions.invoke('delete-account', { body: { password } })
    if (!error) return { data, error: null, code: null }
    // Non-2xx responses carry the error code in the response body
    let code = null
    try {
      code = (await error.context.json()).error
    } catch {
      // network failure etc.
    }
    return { data: null, error, code }
  }, [])

  // Stay in "loading" until auth has resolved and this user's space has been fetched,
  // so route guards never see "signed in, no space" for a render and redirect to onboarding.
  const loading = authLoading || fetching || (!!userId && loadedFor !== userId)

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
      checkDeleteAccount,
      deleteAccount,
      refresh: fetchSpaceData,
    }),
    [space, member, partner, loading, createSpace, joinSpace, updateSpace, updateDisplayName, checkDeleteAccount, deleteAccount, fetchSpaceData]
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
