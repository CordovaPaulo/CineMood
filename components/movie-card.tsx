"use client"

import { Card, CardContent, CardMedia, Button, Dialog, DialogContent, IconButton } from "@mui/material"
import { Star, Close } from "@mui/icons-material"
import { useState, useMemo } from "react"
import { useTheme } from "@/contexts/theme-context"

interface MovieCardProps {
  title: string
  posterPath: string | null
  rating: number | null
  overview: string
  trailerId?: string | null
}

export function MovieCard({ title, posterPath, rating, overview, trailerId }: MovieCardProps) {
  const { theme } = useTheme()
  const [isHovered, setIsHovered] = useState(false)
  const [openTrailer, setOpenTrailer] = useState(false)

  // memoized placeholder SVG with title text (used when posterPath is missing)
  const placeholderSrc = useMemo(() => {
    const text = String(title || "Untitled").trim().slice(0, 60)
    // pick a predictable background color from title hash
    const colors = ["#7C3AED", "#A855F7", "#F97316", "#06B6D4", "#EF4444", "#10B981"]
    let h = 0
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
    const bg = colors[Math.abs(h) % colors.length]

    // split title into up to 3 lines for SVG
    const words = text.split(/\s+/)
    const lines: string[] = []
    let cur = ""
    for (const w of words) {
      if ((cur + " " + w).trim().length <= 20) {
        cur = (cur + " " + w).trim()
      } else {
        if (cur) lines.push(cur)
        cur = w
      }
      if (lines.length >= 2) break
    }
    if (cur && lines.length < 3) lines.push(cur)

    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='500' height='750' viewBox='0 0 500 750'>
        <rect width='100%' height='100%' fill='${bg}'/>
        <g font-family='Inter, Roboto, Helvetica, Arial, sans-serif' fill='#ffffff' text-anchor='middle'>
          <text x='50%' y='45%' font-size='22' font-weight='600'>
            ${escapeXml(lines[0] || "")}
          </text>
          ${lines[1] ? `<text x='50%' y='52%' font-size='18' font-weight='500'>${escapeXml(lines[1])}</text>` : ""}
          ${lines[2] ? `<text x='50%' y='59%' font-size='16' font-weight='500'>${escapeXml(lines[2])}</text>` : ""}
        </g>
      </svg>`

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }, [title])

  function escapeXml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  }

  const ratingText = typeof rating === "number" ? rating.toFixed(1) : "N/A"
  const embedUrl = trailerId ? `https://www.youtube.com/embed/${trailerId}?autoplay=1&rel=0` : null

  const imageSrc = posterPath || placeholderSrc

  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        backgroundColor: theme.card.bg,
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
      <CardMedia component="img" height="300" image={imageSrc} alt={title} sx={{ objectFit: "cover" }} />

      {/* Rating Badge */}
      <div className="absolute top-3 right-3 bg-[#A855F7] text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm font-semibold">
        <Star sx={{ fontSize: "1rem" }} />
        {ratingText}
      </div>

      {/* Hover Overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="text-center">
            <h3 className="font-semibold mb-3" style={{ color: "#FFFFFF" }}>{title}</h3>
            <p className="text-sm line-clamp-4 mb-4" style={{ color: "#A0A0A0" }}>{overview}</p>
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
        <h3 className="font-semibold text-sm line-clamp-2 mb-2" style={{ color: theme.text.primary, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>{title}</h3>
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
