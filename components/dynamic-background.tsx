"use client"

import { useTheme } from "@/contexts/theme-context"
import { motion } from "framer-motion"

/**
 * Dynamic background component that animates based on mood theme
 * Provides smooth transitions between different mood color palettes
 */
export function DynamicBackground() {
  const { theme } = useTheme()

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
    >
      <div
        className="absolute inset-0"
        style={{
          transition: "background 1s cubic-bezier(0.4, 0, 0.2, 1)",
          background: `
            radial-gradient(circle at 20% 25%, ${theme.background.radial1} 0%, transparent 35%),
            radial-gradient(circle at 85% 10%, ${theme.background.radial2} 0%, transparent 40%),
            radial-gradient(circle at 5% 85%, ${theme.background.radial3} 0%, transparent 45%),
            radial-gradient(circle at 35% 35%, ${theme.background.radial1} 0%, transparent 10%),
            radial-gradient(circle at 65% 65%, ${theme.background.radial2} 0%, transparent 10%)
          `,
        }}
      />
    </motion.div>
  )
}
