'use client'

import confetti from 'canvas-confetti'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect } from 'react'

export default function SetupCompleteConfetti() {
  const [showConfetti, setConfetti] = useQueryState(
    'confetti',
    parseAsBoolean.withDefault(false),
  )

  useEffect(() => {
    if (showConfetti) {
      confetti({
        particleCount: 200,
        spread: 400,
        origin: { y: 1.1 },
      })

      setConfetti(null)
    }
  }, [showConfetti, setConfetti])
  return null
}
