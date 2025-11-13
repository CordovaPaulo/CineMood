import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import ToastWrapper from "../components/toast-wrapper"
import { FavoritesHistoryProvider } from "./providers/FavoritesHistoryProvider"
import { ThemeProvider } from "@/contexts/theme-context"
import { DynamicBackground } from "@/components/dynamic-background"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CineMood - Find Movies by Your Mood",
  description: "Discover the perfect movies based on your current mood",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <FavoritesHistoryProvider>
            <DynamicBackground />
            <ToastWrapper />
            {children}
          </FavoritesHistoryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
