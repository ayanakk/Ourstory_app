import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { uploadCapsuleFile, deletePhotoFiles } from '../lib/photos'
import { useSpace } from './useSpace'
import { useAuth } from './useAuth'

async function listCapsuleFiles(spaceId, capsuleId) {
  const folder = `${spaceId}/capsules/${capsuleId}`
  const { data } = await supabase.storage.from('photos').list(folder)
  return (data || []).map((f) => `${folder}/${f.name}`)
}

export function useCapsules() {
  const { space } = useSpace()
  const { user } = useAuth()
  const [capsules, setCapsules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!space?.id) {
      setCapsules([])
      setLoading(false)
      return
    }
    const { data, error: rpcErr } = await supabase.rpc('list_capsules')
    if (rpcErr) {
      console.error('Error fetching capsules:', rpcErr)
      setError(rpcErr)
    } else {
      setError(null)
      setCapsules(data || [])
    }
    setLoading(false)
  }, [space?.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  // { kind, toUser, title, body, opensAt (ISO), photos: File[], video: File | null }
  const createCapsule = useCallback(
    async ({ kind, toUser, title, body, opensAt, photos = [], video = null }) => {
      if (!space?.id || !user?.id) return { error: new Error('No active space or user') }
      const id = crypto.randomUUID()
      const uploaded = []
      try {
        const photoPaths = []
        for (const file of photos) {
          const { path, error: upErr } = await uploadCapsuleFile(space.id, id, file)
          if (upErr) throw upErr
          uploaded.push(path)
          photoPaths.push(path)
        }
        let videoPath = null
        if (video) {
          const { path, error: upErr } = await uploadCapsuleFile(space.id, id, video)
          if (upErr) throw upErr
          uploaded.push(path)
          videoPath = path
        }
        const { error: insertErr } = await supabase.from('capsules').insert({
          id,
          space_id: space.id,
          author_id: user.id,
          kind,
          to_user: toUser || null,
          title,
          body: body || null,
          photo_paths: photoPaths,
          video_path: videoPath,
          opens_at: opensAt,
        })
        if (insertErr) throw insertErr
      } catch (err) {
        await deletePhotoFiles(uploaded)
        return { error: err }
      }
      await refresh()
      return { error: null }
    },
    [space?.id, user?.id, refresh]
  )

  // Authors can delete only while the capsule is still sealed (enforced by RLS too)
  const deleteCapsule = useCallback(
    async (capsule) => {
      const { error: deleteErr, count } = await supabase
        .from('capsules')
        .delete({ count: 'exact' })
        .eq('id', capsule.id)
      if (deleteErr) return { error: deleteErr }
      if (!count) return { error: new Error('This capsule can no longer be deleted') }
      await deletePhotoFiles(await listCapsuleFiles(space.id, capsule.id))
      setCapsules((prev) => prev.filter((c) => c.id !== capsule.id))
      return { error: null }
    },
    [space?.id]
  )

  return { capsules, loading, error, refresh, createCapsule, deleteCapsule }
}
