import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-teal-800 active:scale-95 transform",
        destructive:
          "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg hover:shadow-xl hover:from-red-700 hover:to-red-800 active:scale-95 transform",
        outline:
          "border-2 border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md hover:text-gray-900 active:scale-95 transform dark:border-gray-600 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:border-emerald-500 dark:hover:text-white",
        secondary:
          "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 hover:shadow-md hover:text-gray-900 active:scale-95 transform dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 dark:hover:text-white",
        ghost:
          "text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:scale-95 transform dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
        link: "text-emerald-600 underline-offset-4 hover:underline hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300",
        success:
          "bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-lg hover:shadow-xl hover:from-green-700 hover:to-emerald-800 active:scale-95 transform",
        warning:
          "bg-gradient-to-r from-orange-600 to-amber-700 text-white shadow-lg hover:shadow-xl hover:from-orange-700 hover:to-amber-800 active:scale-95 transform",
        info: "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-800 active:scale-95 transform",
        premium:
          "bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-violet-800 active:scale-95 transform",
        soft: "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-md hover:text-emerald-800 active:scale-95 transform dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 dark:hover:bg-emerald-500/30 dark:hover:border-emerald-500/50 dark:hover:text-emerald-200",
        "outline-white":
          "border-2 border-white/30 bg-white/10 text-white shadow-sm hover:bg-white/20 hover:border-white/50 hover:shadow-md hover:text-white active:scale-95 transform backdrop-blur-sm",
        "ghost-white": "text-white hover:bg-white/10 hover:text-white active:scale-95 transform",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base font-semibold",
        xl: "h-14 rounded-2xl px-10 text-lg font-semibold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
