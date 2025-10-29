"use client"

import { Card, CardContent } from "@mui/material"

interface MoodCardProps {
  emoji: string
  label: string
  description: string
  isSelected: boolean
  onClick: () => void
}

export function MoodCard({ emoji, label, description, isSelected, onClick }: MoodCardProps) {
  return (
    <Card
      onClick={onClick}
      sx={{
        backgroundColor: "#1A1A24",
        border: isSelected ? "2px solid #A855F7" : "1px solid #2D2D3D",
        borderRadius: "1rem",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: isSelected ? "0 0 20px rgba(168, 85, 247, 0.4)" : "none",
        "&:hover": {
          borderColor: "#A855F7",
          boxShadow: "0 0 15px rgba(168, 85, 247, 0.3)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent className="flex flex-col items-center justify-center py-8 px-4">
        <div className="text-5xl mb-3">{emoji}</div>
        <h3 className="text-white font-semibold text-lg mb-1">{label}</h3>
        <p className="text-[#A0A0A0] text-sm text-center">{description}</p>
      </CardContent>
    </Card>
  )
}
