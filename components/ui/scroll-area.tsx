"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Temporary simple implementation without radix-ui dependency
const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("relative overflow-auto", className)} {...props}>
    {children}
  </div>
))
ScrollArea.displayName = "ScrollArea"

const ScrollBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("hidden", className)} {...props} />
))
ScrollBar.displayName = "ScrollBar"

export { ScrollArea, ScrollBar }
