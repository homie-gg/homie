'use client'

import MuxPlayer, { MuxPlayerProps } from '@mux/mux-player-react'

interface MuxPlayerClientProps extends MuxPlayerProps {
  style?: Record<string, any>
}

export default function MuxPlayerClient(props: MuxPlayerClientProps) {
  return <MuxPlayer {...props} />
}
