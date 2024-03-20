import { Tooltip, TooltipContent, TooltipTrigger } from '@/lib/ui/Tooltip'
import { QuestionMarkCircledIcon } from '@radix-ui/react-icons'
import { TooltipContentProps } from '@radix-ui/react-tooltip'

interface TooltipQuestionProps {
  children: TooltipContentProps['children']
}

export default function TooltipQuestion(props: TooltipQuestionProps) {
  const { children } = props
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger>
        <QuestionMarkCircledIcon className="text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  )
}
