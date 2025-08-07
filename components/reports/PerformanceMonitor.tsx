"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  Activity, 
  BarChart3, 
  Clock, 
  Cpu, 
  HardDrive, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap
} from "lucide-react"
import { perfMonitor } from "@/lib/performance"
import { formatNumber } from "@/lib/format"

interface PerformanceMonitorProps {
  isVisible: boolean
  onToggle: () => void
}

interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

export function PerformanceMonitor({ isVisible, onToggle }: PerformanceMonitorProps) {
  const [stats, setStats] = useState<Record<string, any>>({})
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null)
  const [frameRate, setFrameRate] = useState(0)
  const [networkStats, setNetworkStats] = useState({
    requests: 0,
    totalTime: 0,
    averageTime: 0
  })

  // Update performance stats periodically
  useEffect(() => {
    if (!isVisible) return

    const updateStats = () => {
      setStats(perfMonitor.getAllStats())
      
      // Get memory info if available
      if ('memory' in performance) {
        setMemoryInfo((performance as any).memory)
      }
      
      // Calculate frame rate (simplified)
      let frameCount = 0
      let lastTime = performance.now()
      
      const countFrames = () => {
        frameCount++
        const currentTime = performance.now()
        if (currentTime - lastTime >= 1000) {
          setFrameRate(frameCount)
          frameCount = 0
          lastTime = currentTime
        }
        if (isVisible) {
          requestAnimationFrame(countFrames)
        }
      }
      requestAnimationFrame(countFrames)
    }

    updateStats()
    const interval = setInterval(updateStats, 2000)

    return () => {
      clearInterval(interval)
    }
  }, [isVisible])

  // Monitor network requests
  useEffect(() => {
    if (!isVisible) return

    const originalFetch = window.fetch
    let requestCount = 0
    let totalTime = 0

    window.fetch = async (...args) => {
      const start = performance.now()
      requestCount++
      
      try {
        const response = await originalFetch(...args)
        const duration = performance.now() - start
        totalTime += duration
        
        setNetworkStats({
          requests: requestCount,
          totalTime,
          averageTime: totalTime / requestCount
        })
        
        return response
      } catch (error) {
        const duration = performance.now() - start
        totalTime += duration
        
        setNetworkStats({
          requests: requestCount,
          totalTime,
          averageTime: totalTime / requestCount
        })
        
        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [isVisible])

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-white shadow-lg"
      >
        <Activity className="h-4 w-4 mr-2" />
        Performans
      </Button>
    )
  }

  const memoryUsagePercent = memoryInfo 
    ? (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100 
    : 0

  const getPerformanceColor = (avg: number) => {
    if (avg < 10) return "text-green-600"
    if (avg < 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getMemoryColor = (percent: number) => {
    if (percent < 50) return "bg-green-500"
    if (percent < 80) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 bg-white shadow-2xl rounded-lg border">
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performans İzleme
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                perfMonitor.clear()
                setNetworkStats({ requests: 0, totalTime: 0, averageTime: 0 })
              }}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
            >
              ×
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-0 space-y-4 max-h-80 overflow-y-auto">
          <Tabs defaultValue="timing" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="timing">Zamanlama</TabsTrigger>
              <TabsTrigger value="memory">Bellek</TabsTrigger>
              <TabsTrigger value="network">Ağ</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timing" className="space-y-3">
              {Object.entries(stats).length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-4">
                  Henüz performans verisi yok
                </div>
              ) : (
                Object.entries(stats).map(([key, data]: [string, any]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate">{key}</span>
                      <Badge variant="outline" className="text-xs">
                        {data?.count || 0}
                      </Badge>
                    </div>
                    {data && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className={`font-semibold ${getPerformanceColor(data.avg)}`}>
                            {data.avg?.toFixed(1)}ms
                          </div>
                          <div className="text-gray-500">Ort</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-green-600">
                            {data.min?.toFixed(1)}ms
                          </div>
                          <div className="text-gray-500">Min</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-red-600">
                            {data.max?.toFixed(1)}ms
                          </div>
                          <div className="text-gray-500">Max</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="memory" className="space-y-3">
              {memoryInfo ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Heap Kullanımı</span>
                      <span className="text-xs text-gray-500">
                        {(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    <Progress 
                      value={memoryUsagePercent} 
                      className="h-2"
                    />
                    <div className="text-xs text-gray-500 text-center">
                      %{memoryUsagePercent.toFixed(1)} kullanımda
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-semibold text-blue-600">
                        {(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(1)} MB
                      </div>
                      <div className="text-gray-500">Toplam Heap</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-semibold text-purple-600">
                        {(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(1)} MB
                      </div>
                      <div className="text-gray-500">Heap Limiti</div>
                    </div>
                  </div>
                  
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold">{frameRate} FPS</span>
                    </div>
                    <div className="text-xs text-gray-500">Kare Hızı</div>
                  </div>
                </>
              ) : (
                <div className="text-center text-sm text-gray-500 py-4">
                  Bellek bilgisi mevcut değil
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="network" className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">İstekler</span>
                  </div>
                  <Badge variant="outline">{networkStats.requests}</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Ortalama Süre</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {networkStats.averageTime.toFixed(1)}ms
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Toplam Süre</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {networkStats.totalTime.toFixed(1)}ms
                  </span>
                </div>
              </div>
              
              {networkStats.requests === 0 && (
                <div className="text-center text-sm text-gray-500 py-4">
                  Henüz ağ isteği yapılmadı
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}