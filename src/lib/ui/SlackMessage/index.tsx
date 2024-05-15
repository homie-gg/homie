import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import slackBg from '@/lib/ui/SlackMessage/slack-bg.jpg'

interface SlackMessageProps {
  message: string | null
}

export default function SlackMessage(props: SlackMessageProps) {
  const { message } = props
  return (
    <div className="rounded-md  border overflow-hidden w-full relative">
      <div className="absolute top-[22%] left-[32%] h-[55%] w-[66%] overflow-hidden">
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 75 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -75 }}
              transition={{ ease: 'easeOut', duration: 0.25 }}
            >
              <div className="flex gap-2 h-full">
                <div className="rounded-lg w-[50px] h-[50px] border">
                  <Image
                    src="/homie-taco.png"
                    width={256}
                    height={256}
                    alt="homie"
                  />
                </div>
                <div className="flex flex-col w-full">
                  <p className="font-bold">homie</p>
                  {message && (
                    <div className="overflow-auto flex-1 whitespace-pre-line">
                      {message}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Image src={slackBg} width={2920} height={1562} alt="slack" />
    </div>
  )
}
