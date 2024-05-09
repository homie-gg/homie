'use client'

import { PropsWithChildren, useEffect, useRef } from 'react'
import { motion, useInView, useAnimation } from 'framer-motion'

interface OnScrollRevealerProps extends PropsWithChildren {}

export default function OnScrollRevealer(props: OnScrollRevealerProps) {
  const { children } = props

  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -30% 0px' })
  const mainControls = useAnimation()

  useEffect(() => {
    if (isInView) {
      mainControls.start('visible')
    }
  }, [mainControls, isInView])

  return (
    <div ref={ref} className="relative overflow-hidden">
      <motion.div
        variants={{
          hidden: {
            opacity: 0,
            y: 75,
          },
          visible: {
            opacity: 1,
            y: 0,
          },
        }}
        initial="hidden"
        animate={mainControls}
        transition={{ ease: 'easeOut', duration: 0.25 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
