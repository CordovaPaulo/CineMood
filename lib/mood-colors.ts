export type MoodType = "Happy" | "Sad" | "Romantic" | "Excited" | "Relaxed" | "Angry" | "Scared" | "Adventurous" | "Mysterious"
export type MoodResponse = "match" | "address"
export type ThemeMode = "light" | "dark"

export interface MoodColorPalette {
  primary: string
  primaryDark: string
  gradient: {
    from: string
    via?: string
    to: string
  }
  background: {
    base: string
    radial1: string
    radial2: string
    radial3: string
  }
  accent: string
  border: string
  text: {
    primary: string
    secondary: string
  }
  card: {
    bg: string
    border: string
  }
}

// Base color palettes for each mood - carefully chosen for emotional resonance
export const MOOD_COLORS: Record<MoodType, MoodColorPalette> = {
  Happy: {
    primary: "#FFD700",
    primaryDark: "#FFA500",
    gradient: { from: "#FFD700", via: "#FFA500", to: "#FF8C00" },
    background: {
      base: "#0B0B0F",
      radial1: "rgba(255, 215, 0, 0.25)",
      radial2: "rgba(255, 165, 0, 0.15)",
      radial3: "rgba(255, 140, 0, 0.2)",
    },
    accent: "#FFEB3B",
    border: "#FFD700",
    text: { primary: "#FFFFFF", secondary: "#FFE4B5" },
    card: { bg: "#1A1A24", border: "#FFD700" },
  },
  Sad: {
    primary: "#4A90E2",
    primaryDark: "#2E5C8A",
    gradient: { from: "#4A90E2", via: "#3A7BC8", to: "#2E5C8A" },
    background: {
      base: "#0B0B0F",
      radial1: "rgba(74, 144, 226, 0.25)",
      radial2: "rgba(58, 123, 200, 0.15)",
      radial3: "rgba(46, 92, 138, 0.2)",
    },
    accent: "#64B5F6",
    border: "#4A90E2",
    text: { primary: "#FFFFFF", secondary: "#B3D9FF" },
    card: { bg: "#1A1A24", border: "#4A90E2" },
  },
  Romantic: {
    primary: "#FF69B4",
    primaryDark: "#C71585",
    gradient: { from: "#FF69B4", via: "#FF1493", to: "#C71585" },
    background: {
      base: "#0B0B0F",
      radial1: "rgba(255, 105, 180, 0.25)",
      radial2: "rgba(255, 20, 147, 0.15)",
      radial3: "rgba(199, 21, 133, 0.2)",
    },
    accent: "#FFB6C1",
    border: "#FF69B4",
    text: { primary: "#FFFFFF", secondary: "#FFE4E1" },
    card: { bg: "#1A1A24", border: "#FF69B4" },
  },
  Excited: {
    primary: "#FF6347",
    primaryDark: "#DC143C",
    gradient: { from: "#FF6347", via: "#FF4500", to: "#DC143C" },
    background: {
      base: "#0B0B0F",
      radial1: "rgba(255, 99, 71, 0.25)",
      radial2: "rgba(255, 69, 0, 0.15)",
      radial3: "rgba(220, 20, 60, 0.2)",
    },
    accent: "#FF7F50",
    border: "#FF6347",
    text: { primary: "#FFFFFF", secondary: "#FFE4E1" },
    card: { bg: "#1A1A24", border: "#FF6347" },
  },
  Relaxed: {
    primary: "#98D8C8",
    primaryDark: "#5F9EA0",
    gradient: { from: "#98D8C8", via: "#7EC8B8", to: "#5F9EA0" },
    background: {
      base: "#0B0B0F",
      radial1: "rgba(152, 216, 200, 0.25)",
      radial2: "rgba(126, 200, 184, 0.15)",
      radial3: "rgba(95, 158, 160, 0.2)",
    },
    accent: "#AFEEEE",
    border: "#98D8C8",
    text: { primary: "#FFFFFF", secondary: "#E0F2F1" },
    card: { bg: "#1A1A24", border: "#98D8C8" },
  },
  Angry: {
    primary: "#DC143C",
    primaryDark: "#8B0000",
    gradient: { from: "#DC143C", via: "#B22222", to: "#8B0000" },
    background: {
      base: "#0B0B0F",
      radial1: "rgba(220, 20, 60, 0.25)",
      radial2: "rgba(178, 34, 34, 0.15)",
      radial3: "rgba(139, 0, 0, 0.2)",
    },
    accent: "#FF4444",
    border: "#DC143C",
    text: { primary: "#FFFFFF", secondary: "#FFE4E1" },
    card: { bg: "#1A1A24", border: "#DC143C" },
  },
  Scared: {
    primary: "#800080",
    primaryDark: "#4B0082",
    gradient: { from: "#800080", via: "#663399", to: "#4B0082" },
    background: {
      base: "#0B0B0F",
      radial1: "rgba(128, 0, 128, 0.25)",
      radial2: "rgba(102, 51, 153, 0.15)",
      radial3: "rgba(75, 0, 130, 0.2)",
    },
    accent: "#9370DB",
    border: "#800080",
    text: { primary: "#FFFFFF", secondary: "#E6E6FA" },
    card: { bg: "#1A1A24", border: "#800080" },
  },
  Adventurous: {
    primary: "#FF8C00",
    primaryDark: "#FF6B00",
    gradient: { from: "#FF8C00", via: "#FF7F00", to: "#FF6B00" },
    background: {
      base: "#0B0B0F",
      radial1: "rgba(255, 140, 0, 0.25)",
      radial2: "rgba(255, 127, 0, 0.15)",
      radial3: "rgba(255, 107, 0, 0.2)",
    },
    accent: "#FFA500",
    border: "#FF8C00",
    text: { primary: "#FFFFFF", secondary: "#FFE4B5" },
    card: { bg: "#1A1A24", border: "#FF8C00" },
  },
  Mysterious: {
    primary: "#9370DB",
    primaryDark: "#6A5ACD",
    gradient: { from: "#9370DB", via: "#8A67D3", to: "#6A5ACD" },
    background: {
      base: "#0B0B0F",
      radial1: "rgba(147, 112, 219, 0.25)",
      radial2: "rgba(138, 103, 211, 0.15)",
      radial3: "rgba(106, 90, 205, 0.2)",
    },
    accent: "#BA55D3",
    border: "#9370DB",
    text: { primary: "#FFFFFF", secondary: "#E6E6FA" },
    card: { bg: "#1A1A24", border: "#9370DB" },
  },
}

// Default purple theme (fallback when no mood is selected)
export const DEFAULT_THEME: MoodColorPalette = {
  primary: "#b549e7",
  primaryDark: "#9333EA",
  gradient: { from: "#b549e7", via: "#A855F7", to: "#9333EA" },
  background: {
    base: "#0B0B0F",
    radial1: "rgba(181, 73, 231, 0.25)",
    radial2: "rgba(168, 85, 247, 0.15)",
    radial3: "rgba(147, 51, 234, 0.2)",
  },
  accent: "#A855F7",
  border: "#b549e7",
  text: { primary: "#FFFFFF", secondary: "#A0A0A0" },
  card: { bg: "#1A1A24", border: "#2D2D3D" },
}

/**
 * Get theme palette based on mood and mood response
 * @param mood - The selected mood type
 * @param moodResponse - "match" aligns with mood, "address" provides contrast
 * @returns Color palette for the mood/response combination
 */
export function getThemeForMoodResponse(
  mood: MoodType | null,
  moodResponse: MoodResponse | null
): MoodColorPalette {
  if (!mood) return DEFAULT_THEME

  const basePalette = MOOD_COLORS[mood]

  // If addressing mood (opposite content), soften and invert the gradient
  if (moodResponse === "address") {
    return {
      ...basePalette,
      // Reverse gradient direction for subtle opposition
      gradient: {
        from: basePalette.gradient.to,
        via: basePalette.gradient.via,
        to: basePalette.gradient.from,
      },
      // Reduce background intensity when addressing
      background: {
        base: basePalette.background.base,
        radial1: basePalette.background.radial1.replace(/0\.\d+/, "0.15"),
        radial2: basePalette.background.radial2.replace(/0\.\d+/, "0.10"),
        radial3: basePalette.background.radial3.replace(/0\.\d+/, "0.12"),
      },
    }
  }

  // Match mode - full intensity
  return basePalette
}

/**
 * Calculate if text should be light or dark based on background color
 * Uses WCAG contrast calculation
 */
export function getContrastText(bgColor: string): string {
  const color = bgColor.replace("#", "")
  const r = parseInt(color.substr(0, 2), 16)
  const g = parseInt(color.substr(2, 2), 16)
  const b = parseInt(color.substr(4, 2), 16)
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  return luminance > 0.5 ? "#000000" : "#FFFFFF"
}

/**
 * Convert hex color to rgba with opacity
 */
export function hexToRgba(hex: string, alpha: number): string {
  const color = hex.replace("#", "")
  const r = parseInt(color.substr(0, 2), 16)
  const g = parseInt(color.substr(2, 2), 16)
  const b = parseInt(color.substr(4, 2), 16)
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Adapt color palette for light or dark mode
 * Light mode: lighter backgrounds, darker text, adjusted colors for readability
 * Dark mode: dark backgrounds, light text (original design)
 */
export function adaptPaletteForMode(palette: MoodColorPalette, mode: ThemeMode): MoodColorPalette {
  if (mode === "dark") {
    return palette // Dark mode is the original design
  }

  // Light mode adaptations
  return {
    ...palette,
    background: {
      base: "#F5F5F7", // Light gray background
      radial1: palette.background.radial1.replace(/rgba\(([^)]+)\)/, (match, values) => {
        const [r, g, b] = values.split(",").map((v: string) => v.trim())
        return `rgba(${r}, ${g}, ${b}, 0.08)` // Reduced opacity for subtle accents
      }),
      radial2: palette.background.radial2.replace(/rgba\(([^)]+)\)/, (match, values) => {
        const [r, g, b] = values.split(",").map((v: string) => v.trim())
        return `rgba(${r}, ${g}, ${b}, 0.05)`
      }),
      radial3: palette.background.radial3.replace(/rgba\(([^)]+)\)/, (match, values) => {
        const [r, g, b] = values.split(",").map((v: string) => v.trim())
        return `rgba(${r}, ${g}, ${b}, 0.06)`
      }),
    },
    // Improve contrast for light mode: darker primary text and clearer secondary text
    text: {
      primary: "#0B1220", // darker, near-black for high contrast on light backgrounds
      secondary: "#4B5563", // neutral dark gray for secondary text
    },
    card: {
      bg: "#FFFFFF", // White cards on light background
      // Use a subtle neutral border for cards to improve readability across moods
      border: hexToRgba("#091226", 0.06),
    },
    // Slightly desaturate primary/gradient on light mode so they remain readable
    primary: palette.primary,
    primaryDark: palette.primaryDark,
    gradient: {
      from: palette.gradient.from,
      via: palette.gradient.via || palette.gradient.from,
      to: palette.gradient.to,
    },
  }
}
