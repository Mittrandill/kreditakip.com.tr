"use client"

import { createContext, useContext, useEffect, useState } from "react"

declare global {
  interface Window {
    Paddle?: any
  }
}

interface PaddleContextType {
  paddle: any
  isLoaded: boolean
  error: string | null
}

const PaddleContext = createContext<PaddleContextType | null>(null)

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  const [paddle, setPaddle] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializePaddle = async () => {
      try {
        // Loading Paddle

        // Check if already loaded
        if (window.Paddle) {
          setupPaddle(window.Paddle)
          return
        }

        // Load Paddle script
        const script = document.createElement('script')
        script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'
        script.async = true

        script.onload = () => {
          if (window.Paddle) {
            setupPaddle(window.Paddle)
          } else {
            setError('Paddle SDK yüklenemedi')
          }
        }

        script.onerror = () => {
          setError('Paddle SDK yüklenemedi')
        }

        document.body.appendChild(script)

        function setupPaddle(paddleInstance: any) {
          // Setting up Paddle

          // Set environment
          if (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'sandbox') {
            paddleInstance.Environment.set('sandbox')
          }

          // Initialize Paddle with token
          paddleInstance.Initialize({
            token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
            pwCustomer: {
              email: '', // Will be set dynamically
            },
            eventCallback: (data: any) => {
              // Paddle event received

              // Store events in window for components to listen
              window.dispatchEvent(new CustomEvent('paddleEvent', { detail: data }))
            }
          })

          setPaddle(paddleInstance)
          setIsLoaded(true)
          // Paddle initialized
        }
      } catch (err) {
        console.error('Error initializing Paddle:', err)
        setError('Paddle başlatılamadı')
      }
    }

    initializePaddle()
  }, [])

  return (
    <PaddleContext.Provider value={{ paddle, isLoaded, error }}>
      {children}
    </PaddleContext.Provider>
  )
}

export function usePaddle() {
  const context = useContext(PaddleContext)
  if (!context) {
    throw new Error('usePaddle must be used within PaddleProvider')
  }
  return context
}