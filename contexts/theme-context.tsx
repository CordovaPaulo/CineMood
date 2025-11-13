"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { MoodType, MoodResponse, ThemeMode, getThemeForMoodResponse, DEFAULT_THEME, hexToRgba, adaptPaletteForMode } from "@/lib/mood-colors"
import type { MoodColorPalette } from "@/lib/mood-colors"

interface ThemeContextType {
  theme: MoodColorPalette
  mode: ThemeMode
  mood: MoodType | null
  moodResponse: MoodResponse | null
  setMood: (mood: MoodType | null) => void
  setMoodResponse: (response: MoodResponse | null) => void
  updateTheme: (mood: MoodType | null, response: MoodResponse | null) => void
  toggleMode: () => void
  resetTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mood, setMood] = useState<MoodType | null>(null)
  const [moodResponse, setMoodResponse] = useState<MoodResponse | null>(null)
  const [mode, setMode] = useState<ThemeMode>("dark")
  const [theme, setTheme] = useState<MoodColorPalette>(DEFAULT_THEME)

  /**
   * Update CSS custom properties for smooth real-time transitions
   */
  const applyCSSVariables = useCallback((newTheme: MoodColorPalette) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement
      
      // Add transition property for smooth color changes
      root.style.transition = "all 1s cubic-bezier(0.4, 0, 0.2, 1)"
      
      // Background base color
      root.style.setProperty("--background", newTheme.background.base)
      
      // Primary colors
      root.style.setProperty("--primary", newTheme.primary)
      root.style.setProperty("--primary-dark", newTheme.primaryDark)
      root.style.setProperty("--accent", newTheme.accent)
      root.style.setProperty("--border-color", newTheme.border)
      
      // Card colors
      root.style.setProperty("--card-bg", newTheme.card.bg)
      root.style.setProperty("--card-border", newTheme.card.border)
      
      // Text colors
      root.style.setProperty("--text-primary", newTheme.text.primary)
      root.style.setProperty("--text-secondary", newTheme.text.secondary)
      
      // Background gradients
      root.style.setProperty("--bg-radial-1", newTheme.background.radial1)
      root.style.setProperty("--bg-radial-2", newTheme.background.radial2)
      root.style.setProperty("--bg-radial-3", newTheme.background.radial3)
      
      // Gradient colors for other uses
      root.style.setProperty("--gradient-from", newTheme.gradient.from)
      root.style.setProperty("--gradient-via", newTheme.gradient.via || newTheme.gradient.from)
      root.style.setProperty("--gradient-to", newTheme.gradient.to)
      
      // Helper variables with alpha
      root.style.setProperty("--primary-alpha-40", hexToRgba(newTheme.primary, 0.4))
      root.style.setProperty("--primary-alpha-30", hexToRgba(newTheme.primary, 0.3))
      root.style.setProperty("--primary-alpha-10", hexToRgba(newTheme.primary, 0.1))
    }
  }, [])

  /**
   * Update theme based on mood and mood response
   */
  const updateTheme = useCallback((newMood: MoodType | null, newResponse: MoodResponse | null) => {
    const baseTheme = getThemeForMoodResponse(newMood, newResponse)
    const adaptedTheme = adaptPaletteForMode(baseTheme, mode)
    setTheme(adaptedTheme)
    setMood(newMood)
    setMoodResponse(newResponse)
    applyCSSVariables(adaptedTheme)
    
    // Persist to sessionStorage
    if (typeof sessionStorage !== "undefined") {
      if (newMood) {
        sessionStorage.setItem("selectedMood", newMood)
      } else {
        sessionStorage.removeItem("selectedMood")
      }
      
      if (newResponse) {
        sessionStorage.setItem("moodResponse", newResponse)
      } else {
        sessionStorage.removeItem("moodResponse")
      }
    }
  }, [mode, applyCSSVariables])

  /**
   * Toggle between light and dark mode
   */
  const toggleMode = useCallback(() => {
    const newMode: ThemeMode = mode === "dark" ? "light" : "dark"
    setMode(newMode)
    
    // Re-apply current theme with new mode
    const baseTheme = getThemeForMoodResponse(mood, moodResponse)
    const adaptedTheme = adaptPaletteForMode(baseTheme, newMode)
    setTheme(adaptedTheme)
    applyCSSVariables(adaptedTheme)
    
    // Persist mode to localStorage
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("themeMode", newMode)
    }
  }, [mode, mood, moodResponse, applyCSSVariables])

  /**
   * Reset to default theme
   */
  const resetTheme = useCallback(() => {
    updateTheme(null, null)
  }, [updateTheme])

  /**
   * Initialize theme from sessionStorage on mount
   */
  useEffect(() => {
    // Initialize mode from localStorage
    if (typeof localStorage !== "undefined") {
      const storedMode = localStorage.getItem("themeMode") as ThemeMode | null
      if (storedMode === "light" || storedMode === "dark") {
        setMode(storedMode)
      }
    }
    
    if (typeof sessionStorage !== "undefined") {
      const storedMood = sessionStorage.getItem("selectedMood") as MoodType | null
      const storedResponse = sessionStorage.getItem("moodResponse") as MoodResponse | null
      
      if (storedMood) {
        updateTheme(storedMood, storedResponse)
      } else {
        // Apply default theme on initial load
        const adaptedDefault = adaptPaletteForMode(DEFAULT_THEME, mode)
        setTheme(adaptedDefault)
        applyCSSVariables(adaptedDefault)
      }
    }
  }, [updateTheme, applyCSSVariables, mode])

  return (
    <ThemeContext.Provider 
      value={{ 
        theme,
        mode,
        mood, 
        moodResponse, 
        setMood, 
        setMoodResponse, 
        updateTheme,
        toggleMode,
        resetTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
