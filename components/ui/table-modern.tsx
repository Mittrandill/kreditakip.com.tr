"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const TableModern = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  ),
)
TableModern.displayName = "TableModern"

const TableModernHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("bg-gray-50/80 dark:bg-gray-800/50", className)} {...props} />
  ),
)
TableModernHeader.displayName = "TableModernHeader"

const TableModernBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
)
TableModernBody.displayName = "TableModernBody"

const TableModernFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
  ),
)
TableModernFooter.displayName = "TableModernFooter"

const TableModernRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    isEven?: boolean
    isHoverable?: boolean
  }
>(({ className, isEven = false, isHoverable = true, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors duration-150 ease-in-out",
      isHoverable && "hover:bg-gray-50 dark:hover:bg-gray-800/50",
      isEven ? "bg-white dark:bg-gray-900" : "bg-gray-50/30 dark:bg-gray-800/30",
      "data-[state=selected]:bg-muted",
      className,
    )}
    {...props}
  />
))
TableModernRow.displayName = "TableModernRow"

const TableModernHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-semibold text-gray-700 dark:text-gray-300 [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  ),
)
TableModernHead.displayName = "TableModernHead"

const TableModernCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  ),
)
TableModernCell.displayName = "TableModernCell"

const TableModernCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  ),
)
TableModernCaption.displayName = "TableModernCaption"

export {
  TableModern,
  TableModernHeader,
  TableModernBody,
  TableModernFooter,
  TableModernHead,
  TableModernRow,
  TableModernCell,
  TableModernCaption,
}
