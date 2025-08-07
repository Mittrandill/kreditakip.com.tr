"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MoreVertical, 
  Eye, 
  EyeOff, 
  Settings, 
  Maximize2, 
  Minimize2,
  Download,
  Share2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface DashboardWidgetProps {
  id: string
  title: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
  isVisible?: boolean
  isExpanded?: boolean
  onVisibilityChange?: (id: string, visible: boolean) => void
  onSizeChange?: (id: string, size: "sm" | "md" | "lg" | "xl") => void
  onExport?: (id: string) => void
  onShare?: (id: string) => void
  badge?: string
  color?: string
  isDragging?: boolean
}

const sizeClasses = {
  sm: "col-span-1 row-span-1",
  md: "col-span-1 lg:col-span-2 row-span-1",
  lg: "col-span-1 lg:col-span-2 row-span-2",
  xl: "col-span-1 lg:col-span-3 row-span-2"
}

const heightClasses = {
  sm: "h-64",
  md: "h-80", 
  lg: "h-96",
  xl: "h-[500px]"
}

export function DashboardWidget({
  id,
  title,
  description,
  icon,
  children,
  size = "md",
  isVisible = true,
  isExpanded = false,
  onVisibilityChange,
  onSizeChange,
  onExport,
  onShare,
  badge,
  color = "blue",
  isDragging = false
}: DashboardWidgetProps) {
  const [expanded, setExpanded] = useState(isExpanded)

  if (!isVisible) return null

  return (
    <Card 
      className={cn(
        "shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0 group",
        (sizeClasses as any)[size],
        (heightClasses as any)[size],
        isDragging && "opacity-50 rotate-3 scale-105 z-50",
        "cursor-grab active:cursor-grabbing"
      )}
      style={{
        background: expanded 
          ? "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%)"
          : undefined
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <div className={`p-2 bg-${color}-100 rounded-lg flex-shrink-0`}>
              <div className={`h-5 w-5 text-${color}-600`}>
                {icon}
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {title}
              </CardTitle>
              {badge && (
                <Badge variant="outline" className={`text-${color}-700 border-${color}-200 text-xs`}>
                  {badge}
                </Badge>
              )}
            </div>
            {description && (
              <CardDescription className="text-sm text-gray-600 mt-1 line-clamp-1">
                {description}
              </CardDescription>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0"
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onVisibilityChange?.(id, false)}>
                <EyeOff className="h-4 w-4 mr-2" />
                Gizle
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Ayarlar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.(id)}>
                <Download className="h-4 w-4 mr-2" />
                Dışa Aktar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare?.(id)}>
                <Share2 className="h-4 w-4 mr-2" />
                Paylaş
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSizeChange?.(id, "sm")}>
                Küçük Boyut
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSizeChange?.(id, "md")}>
                Orta Boyut
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSizeChange?.(id, "lg")}>
                Büyük Boyut
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSizeChange?.(id, "xl")}>
                Tam Boyut
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className={cn(
        "p-6 pt-0 flex-1 overflow-hidden",
        expanded && "fixed inset-4 z-50 bg-white rounded-xl shadow-2xl p-6"
      )}>
        <div className="h-full w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}