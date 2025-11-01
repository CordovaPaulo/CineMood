"use client"

import { Card, CardContent, CardMedia, Button, Dialog, DialogContent, IconButton } from "@mui/material"
import { Star, Close } from "@mui/icons-material"
import { useState } from "react"

interface MovieCardProps {
  title: string
  posterPath: string | null
  rating: number | null
  overview: string
  trailerId?: string | null
}

export function MovieCard({ title, posterPath, rating, overview, trailerId }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [openTrailer, setOpenTrailer] = useState(false)

  const ratingText = typeof rating === "number" ? rating.toFixed(1) : "N/A"
  const embedUrl = trailerId ? `https://www.youtube.com/embed/${trailerId}?autoplay=1&rel=0` : null

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
      <CardMedia component="img" height="300" image={posterPath || ""} alt={title} sx={{ objectFit: "cover" }} />

      {/* Rating Badge */}
      <div className="absolute top-3 right-3 bg-[#A855F7] text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm font-semibold">
        <Star sx={{ fontSize: "1rem" }} />
        {ratingText}
      </div>

      {/* Hover Overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="text-center">
            <h3 className="text-white font-semibold mb-3">{title}</h3>
            <p className="text-[#A0A0A0] text-sm line-clamp-4 mb-4">{overview}</p>
            <Button
              variant="contained"
              onClick={() => setOpenTrailer(true)}
              disabled={!embedUrl}
              sx={{
                backgroundColor: "#A855F7",
                textTransform: "none",
                "&:hover": { backgroundColor: "#8B46CF" },
              }}
            >
              Watch Trailer
            </Button>
          </div>
        </div>
      )}

      <CardContent className="py-3">
        <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2">{title}</h3>
        {/* Secondary button when not hovered (mobile/keyboard users)
        <Button
          size="small"
          variant="outlined"
          onClick={() => setOpenTrailer(true)}
          disabled={!embedUrl}
          sx={{
            borderColor: "#A855F7",
            color: "#A855F7",
            textTransform: "none",
            "&:hover": {
              borderColor: "#8B46CF",
              color: "#8B46CF",
            },
          }}
        >
          Watch Trailer
        </Button> */}
      </CardContent>

      {/* Trailer Dialog */}
      <Dialog
        open={openTrailer}
        onClose={() => setOpenTrailer(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { backgroundColor: "#000", overflow: "hidden" } }}
      >
        <DialogContent sx={{ p: 0, position: "relative" }}>
          <IconButton
            aria-label="Close trailer"
            onClick={() => setOpenTrailer(false)}
            sx={{ position: "absolute", right: 8, top: 8, color: "#fff", zIndex: 2 }}
          >
            <Close />
          </IconButton>
          <div style={{ position: "relative", paddingTop: "56.25%" }}>
            {embedUrl && (
              <iframe
                src={embedUrl}
                title={`${title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
