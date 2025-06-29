import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-emerald-500 focus-visible:shadow-[0_0_0_0.5px_rgb(16,185,129)] disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-300",
        className,
      )}
      ref={ref}
      {...props}
      autoComplete="off"
      spellCheck="false"
    />
  )
})
Input.displayName = "Input"

export { Input }
