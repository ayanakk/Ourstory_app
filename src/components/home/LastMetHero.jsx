import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import SignedImage from '../story/SignedImage'

export default function LastMetHero({ memory, daysSince }) {
  if (!memory) return null

  const cover = memory.photos?.find((p) => p.id === memory.cover_photo_id)?.path || memory.photos?.[0]?.path || null

  const line =
    daysSince === 0
      ? 'You were together today.'
      : `It has been ${daysSince} ${daysSince === 1 ? 'day' : 'days'} since your last adventure together.`

  return (
    <Link to={`/memory/${memory.id}`} className="block group">
      <div
        className="relative w-full aspect-[16/9] sm:aspect-[3/1] rounded-[24px] overflow-hidden bg-surface-2"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        {cover && (
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1 }}
            animate={{ scale: 1.08 }}
            transition={{ duration: 18, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
          >
            <SignedImage path={cover} alt={memory.title} className="absolute inset-0 w-full h-full object-cover" />
          </motion.div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 space-y-1.5">
          <p className="text-white text-sm sm:text-base font-medium">{line}</p>
          {memory.place_name && (
            <p className="text-white/80 text-xs flex items-center gap-1">
              <MapPin size={11} /> Last place: {memory.place_name}
            </p>
          )}
          <p className="text-white/80 text-xs">Last memory: {memory.title}</p>
        </div>
      </div>
    </Link>
  )
}
