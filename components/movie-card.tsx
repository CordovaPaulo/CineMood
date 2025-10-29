"use client"

import { Card, CardContent, CardMedia } from "@mui/material"
import { Star } from "@mui/icons-material"
import { useState } from "react"

interface MovieCardProps {
  title: string
  posterPath: string
  rating: number
  overview: string
}

export function MovieCard({ title, posterPath, rating, overview }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        backgroundColor: "#1A1A24",
        border: "1px solid #2D2D3D",
        borderRadius: "1rem",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.3s ease",
        position: "relative",
        "&:hover": {
          borderColor: "#A855F7",
          boxShadow: "0 0 15px rgba(168, 85, 247, 0.3)",
        },
      }}
    >
      <CardMedia component="img" height="300" image={posterPath} alt={title} sx={{ objectFit: "cover" }} />

      {/* Rating Badge */}
      <div className="absolute top-3 right-3 bg-[#A855F7] text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm font-semibold">
        <Star sx={{ fontSize: "1rem" }} />
        {rating.toFixed(1)}
      </div>

      {/* Hover Overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="text-center">
            <h3 className="text-white font-semibold mb-3">{title}</h3>
            <p className="text-[#A0A0A0] text-sm line-clamp-4">{overview}</p>
          </div>
        </div>
      )}

      <CardContent className="py-3">
        <h3 className="text-white font-semibold text-sm line-clamp-2">{title}</h3>
      </CardContent>
    </Card>
  )
}
