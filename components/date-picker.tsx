"use client"

import type React from "react"

import { forwardRef } from "react"
import { Input } from "@/components/ui/input"

interface DatePickerProps {
  id?: string
  name?: string
  value?: Date
  onChange?: (date: Date | undefined) => void
  className?: string
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ id, name, value, onChange, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const dateValue = e.target.value
      if (dateValue) {
        onChange?.(new Date(dateValue))
      } else {
        onChange?.(undefined)
      }
    }

    const formatDateForInput = (date: Date | undefined) => {
      if (!date) return ""
      return date.toISOString().split("T")[0]
    }

    return (
      <Input
        ref={ref}
        id={id}
        name={name}
        type="date"
        value={formatDateForInput(value)}
        onChange={handleChange}
        className={className}
        {...props}
      />
    )
  },
)

DatePicker.displayName = "DatePicker"

export { DatePicker }
