"use client"

import { Card, CardContent } from "@mui/material"
import { useTheme } from "@/contexts/theme-context"
import { hexToRgba } from "@/lib/mood-colors"

interface MoodCardProps {
  emoji: string
  label: string
  description: string
  isSelected: boolean
  onClick: () => void
}

export function MoodCard({ emoji, label, description, isSelected, onClick }: MoodCardProps) {
  const { theme } = useTheme()
  
  return (
    <Card
      onClick={onClick}
      sx={{
        backgroundColor: theme.card.bg,
        border: isSelected ? `2px solid ${theme.primary}` : `1px solid ${theme.card.border}`,
        borderRadius: "1rem",
        cursor: "pointer",
        transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: isSelected ? `0 0 20px ${hexToRgba(theme.primary, 0.4)}` : "none",
        "&:hover": {
          borderColor: theme.primary,
          boxShadow: `0 0 15px ${hexToRgba(theme.primary, 0.3)}`,
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent className="flex flex-col items-center justify-center py-8 px-4">
        <div className="text-5xl mb-3">{emoji}</div>
        <h3 className="font-semibold text-lg mb-1" style={{ color: theme.text.primary, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>{label}</h3>
        <p className="text-sm text-center" style={{ color: theme.text.secondary, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>{description}</p>
      </CardContent>
    </Card>
  )
}
