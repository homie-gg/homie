import * as React from 'react'

import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-lg border border-primary-light bg-background px-3 py-2 text-primary text-baae shadow-[0px_1px_2px_0px_#1018280d] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-primary/50 focus-visible:outline-none  focus-visible:ring-1 focus-visible:ring-secondary focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
