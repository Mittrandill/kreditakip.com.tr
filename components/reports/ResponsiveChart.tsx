"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Download,
  Share2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ResponsiveChartProps {
  children: React.ReactNode
  title: string
  description?: string
  icon?: React.ReactNode
  data: any[]
  onExport?: () => void
  onShare?: () => void
  className?: string
  enableSwipe?: boolean
  enableZoom?: boolean
  enablePan?: boolean
  mobileHeight?: string
}

interface TouchState {
  startX: number
  startY: number
  lastX: number
  lastY: number
  startDistance: number
  isZooming: boolean
  isPanning: boolean
}

export function ResponsiveChart({
  children,
  title,
  description,
  icon,
  data,
  onExport,
  onShare,
  className,
  enableSwipe = true,
  enableZoom = true,
  enablePan = true,
  mobileHeight = "300px"
}: ResponsiveChartProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [scale, setScale] = useState(1)
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  
  const chartRef = useRef<HTMLDivElement>(null)
  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startDistance: 0,
    isZooming: false,
    isPanning: false
  })

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Touch handlers for mobile interactions
  const getTouchDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enableZoom && !enablePan) return
    
    e.preventDefault()
    const touch = e.touches[0]
    const state = touchState.current
    
    state.startX = touch.clientX
    state.startY = touch.clientY
    state.lastX = touch.clientX
    state.lastY = touch.clientY
    
    if (e.touches.length === 2) {
      state.startDistance = getTouchDistance(e.touches as any)
      state.isZooming = true
    } else {
      state.isPanning = true
    }
  }, [enableZoom, enablePan])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enableZoom && !enablePan) return
    
    e.preventDefault()
    const state = touchState.current
    
    if (state.isZooming && e.touches.length === 2) {
      const currentDistance = getTouchDistance(e.touches as any)
      const scaleChange = currentDistance / state.startDistance
      const newScale = Math.min(Math.max(scale * scaleChange, 0.5), 3)
      setScale(newScale)
      state.startDistance = currentDistance
    } else if (state.isPanning && e.touches.length === 1) {
      const touch = e.touches[0]
      const deltaX = touch.clientX - state.lastX
      const deltaY = touch.clientY - state.lastY
      
      setTranslateX(prev => prev + deltaX)
      setTranslateY(prev => prev + deltaY)
      
      state.lastX = touch.clientX
      state.lastY = touch.clientY
    }
  }, [scale, enableZoom, enablePan])

  const handleTouchEnd = useCallback(() => {
    const state = touchState.current
    state.isZooming = false
    state.isPanning = false
  }, [])

  const resetTransform = () => {
    setScale(1)
    setTranslateX(0)
    setTranslateY(0)
  }

  const zoomIn = () => setScale(prev => Math.min(prev * 1.2, 3))
  const zoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.5))

  // Swipe navigation for mobile
  const nextSlide = () => {
    if (Array.isArray(data) && data.length > 1) {
      setCurrentSlide(prev => (prev + 1) % data.length)
    }
  }

  const prevSlide = () => {
    if (Array.isArray(data) && data.length > 1) {
      setCurrentSlide(prev => (prev - 1 + data.length) % data.length)
    }
  }

  const chartContent = (
    <div
      ref={chartRef}
      className={cn(
        "relative overflow-hidden rounded-lg",
        isMobile && "touch-none"
      )}
      style={{ 
        height: isMobile ? mobileHeight : "auto",
        transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
        transformOrigin: "center",
        transition: touchState.current.isZooming || touchState.current.isPanning ? "none" : "transform 0.2s ease"
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  )

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-7xl max-h-full w-full h-full overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <div className="h-5 w-5 text-emerald-600">
                    {icon}
                  </div>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{title}</h3>
                {description && (
                  <p className="text-sm text-gray-600">{description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(enableZoom || enablePan) && (
                <>
                  <Button variant="outline" size="sm" onClick={zoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={zoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetTransform}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsFullscreen(false)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-6 h-full overflow-hidden">
            {chartContent}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
              <div className="h-5 w-5 text-emerald-600">
                {icon}
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-sm text-gray-600 mt-1 line-clamp-2">
                {description}
              </CardDescription>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Mobile Navigation */}
          {isMobile && enableSwipe && Array.isArray(data) && data.length > 1 && (
            <>
              <Button variant="ghost" size="sm" onClick={prevSlide}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Badge variant="outline" className="text-xs px-2">
                {currentSlide + 1}/{data.length}
              </Badge>
              <Button variant="ghost" size="sm" onClick={nextSlide}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Desktop Controls */}
          {!isMobile && (
            <>
              {onShare && (
                <Button variant="ghost" size="sm" onClick={onShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
              {onExport && (
                <Button variant="ghost" size="sm" onClick={onExport}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
          
          <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(true)}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        {/* Mobile Touch Instructions */}
        {isMobile && (enableZoom || enablePan) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <div className="flex items-center gap-2">
              <Move className="h-4 w-4" />
              <span>
                {enableZoom && enablePan 
                  ? "İki parmakla yakınlaştır, tek parmakla kaydır"
                  : enableZoom 
                  ? "İki parmakla yakınlaştır"
                  : "Tek parmakla kaydır"
                }
              </span>
            </div>
          </div>
        )}

        {chartContent}

        {/* Mobile Controls */}
        {isMobile && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(enableZoom || enablePan) && (
                <>
                  <Button variant="outline" size="sm" onClick={zoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={zoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetTransform}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {onShare && (
                <Button variant="outline" size="sm" onClick={onShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
              {onExport && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Zoom indicator */}
        {scale !== 1 && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            {Math.round(scale * 100)}%
          </div>
        )}
      </CardContent>
    </Card>
  )
}