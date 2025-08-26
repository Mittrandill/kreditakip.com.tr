import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "sonner"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "Kredi Takip - Kredi yönetiminin geleceği.",
  description: "Transform your credit statements into smart digital payment plans in seconds with OCR technology.",
  icons: {
    icon: "/favicon.svg",
  },
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={cn("font-sans antialiased", poppins.variable)}>
        <ErrorBoundary>
          {children}
          <Toaster
            position="top-right"
            expand={true}
            richColors={true}
            closeButton={true}
            toastOptions={{
              duration: 4000,
              style: {
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
              },
            }}
          />
        </ErrorBoundary>
      </body>
    </html>
  )
}
