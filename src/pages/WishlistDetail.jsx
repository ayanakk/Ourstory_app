import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Check, Trash2, ArrowRight, Sparkles, Pencil } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import CreateMemoryWizard from '../components/memory/CreateMemoryWizard'
import { toast } from '../components/ui/Toast'
import AddBucketItemModal, { categoryIcon, CATEGORIES, PRIORITIES } from '../components/home/AddBucketItemModal'
import { useWishlist } from '../hooks/useWishlist'
import { parseYMD, getTodayYMD } from '../lib/milestones'

function formatLongDate(dateStr) {
  const p = parseYMD(dateStr)
  if (!p) return ''
  const d = new Date(p.year, p.month - 1, p.day)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default function WishlistDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { getItemById, updateItem, toggleDone, deleteItem, convertToMemory } = useWishlist()

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  // Go back to wherever we came from; fall back to the bucket list on a direct visit
  const goBack = () => {
    if (location.key !== 'default') navigate(-1)
    else navigate('/wishlist')
  }

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getItemById(id)
    if (!error) setItem(data)
    setLoading(false)
  }, [id, getItemById])

  useEffect(() => {
    load()
  }, [load])

  const handleToggleDone = async () => {
    const next = !item.is_done
    setItem((it) => ({ ...it, is_done: next }))
    const { error } = await toggleDone(item.id, next)
    if (error) {
      setItem((it) => ({ ...it, is_done: !next }))
      toast('Could not update item')
    }
  }

  const handleMemoryCreated = async (createdMemory) => {
    if (createdMemory?.id) {
      await convertToMemory(item.id, createdMemory.id)
      setItem((it) => ({ ...it, converted_memory_id: createdMemory.id }))
    }
    setWizardOpen(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await deleteItem(item.id)
    setDeleting(false)
    if (error) {
      toast('Could not delete item')
      return
    }
    toast('Removed from your bucket list')
    goBack()
  }

  if (loading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-1/2 bg-surface-2 rounded-full" />
          <div className="h-4 w-1/3 bg-surface-2 rounded-full" />
        </div>
      </AppShell>
    )
  }

  if (!item) {
    return (
      <AppShell>
        <div className="py-20 text-center space-y-4">
          <p className="text-xl italic text-ink-muted" style={{ fontFamily: 'var(--font-display)' }}>
            This item could not be found.
          </p>
          <Button variant="secondary" size="sm" onClick={() => navigate('/wishlist')}>
            <ArrowLeft size={14} className="mr-1.5" /> Back to Bucket list
          </Button>
        </div>
      </AppShell>
    )
  }

  const Icon = categoryIcon(item.category)
  const categoryLabel = CATEGORIES.find((c) => c.id === item.category)?.label
  const priorityLabel = PRIORITIES.find((p) => p.value === item.priority)?.label

  return (
    <AppShell>
      <div className="space-y-8 max-w-lg">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent flex items-center gap-1.5">
            <Icon size={13} /> {categoryLabel || 'Bucket list'}
            {priorityLabel && <span className="text-ink-muted normal-case tracking-normal font-medium">· {priorityLabel} priority</span>}
          </p>
          <h1
            className={`text-3xl lg:text-4xl leading-tight ${item.is_done ? 'text-ink-muted line-through' : 'text-ink'}`}
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
          >
            {item.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
            {item.target_date && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} /> {formatLongDate(item.target_date)}
              </span>
            )}
            {item.place_name && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} /> {item.place_name}
              </span>
            )}
          </div>
        </div>

        {item.notes && (
          <p className="text-ink text-base leading-relaxed whitespace-pre-wrap">{item.notes}</p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {/* Once it's a memory the item stays done */}
          {!item.converted_memory_id && (
            <Button variant={item.is_done ? 'secondary' : 'primary'} size="sm" onClick={handleToggleDone}>
              <Check size={14} className="mr-1.5" />
              {item.is_done ? 'Mark as not done' : 'Mark as done'}
            </Button>
          )}
          {item.is_done && !item.converted_memory_id && (
            <Button variant="primary" size="sm" onClick={() => setWizardOpen(true)}>
              <Sparkles size={14} className="mr-1.5" /> Turn into Memory
            </Button>
          )}
          {item.converted_memory_id && (
            <Link
              to={`/memory/${item.converted_memory_id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:opacity-80"
            >
              View the memory <ArrowRight size={14} />
            </Link>
          )}
        </div>

        <div className="pt-4 border-t border-line flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil size={14} className="mr-1.5" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="text-red-500 hover:text-red-600"
          >
            <Trash2 size={14} className="mr-1.5" /> Delete this item
          </Button>
        </div>
      </div>

      <AddBucketItemModal
        open={editOpen}
        item={item}
        onClose={() => setEditOpen(false)}
        onAdd={async (fields) => {
          const res = await updateItem(item.id, fields)
          if (!res.error) setItem(res.data)
          return res
        }}
      />

      <CreateMemoryWizard
        open={wizardOpen}
        initialDate={item.target_date || getTodayYMD()}
        initialTitle={item.title}
        initialPlace={item.place_name}
        onClose={() => setWizardOpen(false)}
        onSuccess={handleMemoryCreated}
      />

      <Modal
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        title="Delete this bucket list item?"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="!bg-red-500 !border-red-500"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        }
      >
        <p className="text-ink-muted text-sm leading-relaxed">
          This will permanently remove "{item.title}". This cannot be undone.
        </p>
      </Modal>
    </AppShell>
  )
}
