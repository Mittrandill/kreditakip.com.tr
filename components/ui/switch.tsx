"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  size?: "sm" | "default" | "lg"
  className?: string
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, disabled = false, size = "default", className, ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-7",
      default: "h-6 w-11",
      lg: "h-8 w-14",
    }

    const thumbSizeClasses = {
      sm: "h-3 w-3 data-[state=checked]:translate-x-3",
      default: "h-5 w-5 data-[state=checked]:translate-x-5",
      lg: "h-7 w-7 data-[state=checked]:translate-x-6",
    }

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-primary" : "bg-input",
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
            thumbSizeClasses[size],
          )}
        />
      </button>
    )
  },
)
Switch.displayName = "Switch"

export { Switch }
