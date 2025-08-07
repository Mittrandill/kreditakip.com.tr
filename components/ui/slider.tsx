"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  max: number
  min: number
  step: number
  className?: string
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ value, onValueChange, max, min, step, className, ...props }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false)
    const sliderRef = React.useRef<HTMLDivElement>(null)

    const getPercentage = (val: number) => ((val - min) / (max - min)) * 100

    const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
      setIsDragging(true)
      const handleMouseMove = (e: MouseEvent) => {
        if (!sliderRef.current) return

        const rect = sliderRef.current.getBoundingClientRect()
        const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
        const newValue = min + (percentage / 100) * (max - min)
        const steppedValue = Math.round(newValue / step) * step

        const newValues = [...value]
        newValues[index] = Math.max(min, Math.min(max, steppedValue))

        // Ensure min <= max
        if (index === 0 && newValues[0] > newValues[1]) {
          newValues[1] = newValues[0]
        } else if (index === 1 && newValues[1] < newValues[0]) {
          newValues[0] = newValues[1]
        }

        onValueChange(newValues)
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return (
      <div ref={ref} className={cn("relative flex w-full touch-none select-none items-center", className)} {...props}>
        <div
          ref={sliderRef}
          className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary cursor-pointer"
        >
          {/* Track */}
          <div
            className="absolute h-full bg-primary"
            style={{
              left: `${getPercentage(value[0])}%`,
              width: `${getPercentage(value[1]) - getPercentage(value[0])}%`,
            }}
          />

          {/* Thumbs */}
          {value.map((val, index) => (
            <div
              key={index}
              className="absolute block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing"
              style={{
                left: `calc(${getPercentage(val)}% - 10px)`,
                top: "50%",
                transform: "translateY(-50%)",
              }}
              onMouseDown={handleMouseDown(index)}
            />
          ))}
        </div>
      </div>
    )
  },
)
Slider.displayName = "Slider"

export { Slider }
