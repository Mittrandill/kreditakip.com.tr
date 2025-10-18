import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Base styles
        "flex min-h-[80px] w-full rounded-lg px-3 py-2 text-sm transition-all duration-200",
        // Light mode
        "border border-gray-200 bg-white text-gray-900 placeholder:text-gray-500",
        // Dark mode
        "dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400",
        // Focus styles - remove browser default outline and add custom
        "focus-visible:outline-none focus-visible:ring-0",
        "focus-visible:border-emerald-500 focus-visible:shadow-[0_0_0_1px_rgb(16,185,129)]",
        "dark:focus-visible:border-emerald-400 dark:focus-visible:shadow-[0_0_0_1px_rgb(52,211,153)]",
        // Hover styles
        "hover:border-gray-300 dark:hover:border-gray-500",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Resize
        "resize-none",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
