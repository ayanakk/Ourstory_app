import { useEffect, useState, useRef } from 'react'
import { animate } from 'framer-motion'

function CountUp({ value }) {
  const [display, setDisplay] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (hasAnimated.current) {
      setDisplay(value)
      return
    }
    hasAnimated.current = true
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [value])

  return <span>{display}</span>
}

export default function StoryStats({ memories, photos, places }) {
  return (
    <p className="text-sm text-ink-muted">
      <span className="text-ink font-semibold">
        <CountUp value={memories} />
      </span>{' '}
      memories
      <span className="mx-1.5">·</span>
      <span className="text-ink font-semibold">
        <CountUp value={photos} />
      </span>{' '}
      photos
      <span className="mx-1.5">·</span>
      <span className="text-ink font-semibold">
        <CountUp value={places} />
      </span>{' '}
      places
    </p>
  )
}
