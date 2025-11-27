"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "../../components/navbar"
import {
  Backdrop,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Box,
  Alert,
  Typography,
  Button,
  IconButton,
} from "@mui/material"
import { ExpandMore, Favorite as FavoriteIcon, CalendarToday, Refresh, Star } from "@mui/icons-material"
import { Delete as DeleteIcon } from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
import { fadeInUp, itemTransition } from "@/lib/motion"
import { toast } from "react-toastify"
import { useFavoritesHistory } from "../providers/FavoritesHistoryProvider"
import { useTheme } from "@/contexts/theme-context"
import { MOOD_COLORS } from "@/lib/mood-colors"
import ConfirmDialog from "@/components/confirm-dialog"

type Movie = {
  id: number
  title: string
  overview: string
  poster_path: string | null
  vote_average: number | null
  release_date?: string
  trailer_youtube_id?: string | null
}

type FavoritePrompt = {
  mood: string
  movieIds: string[]
  createdAt: string
  _id?: string
}

export default function FavoritesPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const { favorites, loadingFavorites, refreshFavorites } = useFavoritesHistory()
  const [moviesData, setMoviesData] = useState<Record<string, Movie>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [loadingMovies, setLoadingMovies] = useState<Set<number>>(new Set())
  // store which movie ids are displayed per prompt index (max 5 random)
  const [displayedIds, setDisplayedIds] = useState<Record<number, string[]>>({})
  const [confirmState, setConfirmState] = useState({ open: false, title: "", description: "", action: () => {} })

  useEffect(() => {
    // map provider loading -> local loading flag
    setIsLoading(loadingFavorites)
  }, [loadingFavorites])

  // helper: pick up to `count` random ids from an array (kept for compatibility)
  function pickRandomIds(ids: string[], count = 5) {
    const pool = ids.slice()
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    return pool.slice(0, Math.min(count, pool.length))
  }

  async function fetchMovieDetails(movieIds: string[], promptIndex: number) {
    if (loadingMovies.has(promptIndex)) return

    setLoadingMovies((prev) => new Set(prev).add(promptIndex))

    try {
      // For the updated behavior we store a single movie per favorite: prefer first id
      const firstId = movieIds && movieIds.length > 0 ? movieIds[0] : null
      if (!firstId) return

      if (!moviesData[firstId]) {
        try {
          const response = await fetch(`/api/movies/${firstId}`)
          if (response.ok) {
            const movie = await response.json()
            setMoviesData((prev) => ({ ...prev, [movie.id.toString()]: movie }))
          }
        } catch (err) {
          console.error(`Error fetching movie ${firstId}:`, err)
        }
      }

      // ensure displayed id is the single first id for this prompt
      setDisplayedIds((prev) => ({ ...prev, [promptIndex]: [String(firstId)] }))
    } catch (error) {
      console.error("Error fetching movie details:", error)
      toast.error("Failed to load some movie details")
    } finally {
      setLoadingMovies((prev) => {
        const newSet = new Set(prev)
        newSet.delete(promptIndex)
        return newSet
      })
    }
  }

  const handleAccordionChange = (index: number) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedIndex(isExpanded ? index : null)

    if (isExpanded) {
      // Fetch movie details when accordion is expanded and prepare displayed ids
      const prompt = favorites[index]
      fetchMovieDetails(prompt.movieIds, index)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getMoodColor = (mood: string): string => {
    const moodType = mood as keyof typeof MOOD_COLORS
    return MOOD_COLORS[moodType]?.primary || theme.primary
  }

  // Lightweight SVG placeholder generator for missing posters
  const placeholderForTitle = (t: string) => {
    const text = String(t || "Untitled").trim().slice(0, 60)
    const colors = ["#7C3AED", "#A855F7", "#F97316", "#06B6D4", "#EF4444", "#10B981"]
    let h = 0
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
    const bg = colors[Math.abs(h) % colors.length]
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
      <svg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'>
        <rect width='100%' height='100%' fill='${bg}'/>
        <g font-family='Inter, Roboto, Helvetica, Arial, sans-serif' fill='#ffffff' text-anchor='middle'>
          <text x='50%' y='45%' font-size='20' font-weight='700'>${escapeXml(lines[0] || "")}</text>
          ${lines[1] ? `<text x='50%' y='53%' font-size='16' font-weight='600'>${escapeXml(lines[1])}</text>` : ""}
        </g>
      </svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  function escapeXml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;")
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: theme.background.base, transition: "background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
      <Navbar />

      <Backdrop
        open={isLoading}
        sx={{ color: "#fff", zIndex: (t) => t.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
        <span style={{ marginLeft: 12 }}>Loading your favorites...</span>
      </Backdrop>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-8"
            variants={fadeInUp}
            initial="hidden"
            animate="show"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <FavoriteIcon sx={{ color: theme.primary, fontSize: 32, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
              <h1 className="text-3xl font-bold" style={{ color: theme.text.primary, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                Your Favorites
              </h1>
            </div>
            <p className="text-sm" style={{ color: theme.text.secondary }}>
              Saved mood-based picks (one saved movie per prompt)
            </p>
          </motion.div>

          {/* Favorites List */}
          {!isLoading && favorites.length === 0 ? (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              className="text-center py-12"
            >
              <Alert
                severity="info"
                sx={{
                  backgroundColor: theme.card.bg,
                  color: theme.text.secondary,
                  border: `1px solid ${theme.card.border}`,
                  "& .MuiAlert-icon": { color: theme.primary },
                }}
              >
                No favorites yet. Save your current picks from the results page!
              </Alert>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {favorites.map((prompt, index) => {
                  const isExpanded = expandedIndex === index
                  const isLoadingMovies = loadingMovies.has(index)
                  // use displayedIds when available, otherwise derive from prompt.movieIds (show up to 5)
                  const idsToShow = displayedIds[index] ?? pickRandomIds(prompt.movieIds, 5)
                  const promptMovies = idsToShow.map((id) => moviesData[id]).filter(Boolean)

                  return (
                    <motion.div
                      key={prompt._id || index}
                      variants={fadeInUp}
                      initial="hidden"
                      animate="show"
                      transition={itemTransition(index)}
                    >
                      <Accordion
                        expanded={isExpanded}
                        onChange={handleAccordionChange(index)}
                        sx={{
                          backgroundColor: theme.card.bg,
                          border: `1px solid ${theme.card.border}`,
                          borderRadius: "12px !important",
                          "&:before": { display: "none" },
                          "&.Mui-expanded": {
                            margin: "0 0 16px 0",
                          },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={
                            <ExpandMore sx={{ color: theme.primary, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                          }
                          aria-controls={`panel-${index}-content`}
                          id={`panel-${index}-header`}
                          sx={{
                            "& .MuiAccordionSummary-content": {
                              margin: "16px 0",
                            },
                          }}
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Chip
                                  label={prompt.mood}
                                  size="medium"
                                  sx={{
                                    backgroundColor: getMoodColor(prompt.mood),
                                    color: "white",
                                    fontWeight: 600,
                                    fontSize: "0.9rem",
                                  }}
                                />
                                <div className="text-sm" style={{ color: theme.text.secondary }}>
                                  Saved · {formatDate(prompt.createdAt)}
                                </div>
                              </div>
                              <div>
                                <IconButton
                                  component="span"
                                  aria-label="Delete favorite"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmState({
                                      open: true,
                                      title: "Delete this favorite?",
                                      description: "This will remove this saved favorite prompt.",
                                      action: async () => {
                                        try {
                                          const res = await fetch("/api/recommendations/favorite", {
                                            method: "DELETE",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ mood: prompt.mood, movieIds: prompt.movieIds }),
                                          });
                                          const payload = await res.json().catch(() => ({}));
                                          if (!res.ok) {
                                            toast.error(payload?.error || "Failed to delete favorite");
                                          } else {
                                            toast.success("Favorite deleted");
                                            refreshFavorites();
                                          }
                                        } catch (err) {
                                          console.error("Delete favorite error:", err);
                                          toast.error("Failed to delete favorite");
                                        }
                                      },
                                    })
                                  }}
                                  sx={{
                                    color: theme.primary,
                                    p: 0,
                                    background: 'transparent',
                                    border: 'none',
                                    boxShadow: 'none',
                                    '&:hover': { backgroundColor: 'transparent' },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </div>
                            </div>
                          </div>
                        </AccordionSummary>

                        <AccordionDetails
                          sx={{ padding: "12px 24px 20px 24px" }}
                        >

                          {isLoadingMovies ? (
                            <Box className="flex justify-center py-8">
                              <CircularProgress
                                size={32}
                                sx={{ color: theme.primary, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
                              />
                            </Box>
                          ) : (
                            <div className="py-2">
                              {/* Show a single saved movie per favorite prompt - left aligned compact layout */}
                              {idsToShow.map((id) => {
                                const movie = moviesData[id]
                                if (!movie) {
                                  return (
                                    <div key={id} className="w-full">
                                      <Alert severity="info" sx={{ backgroundColor: theme.card.bg, color: theme.text.secondary }}>Movie details loading...</Alert>
                                    </div>
                                  )
                                }

                                return (
                                  <div key={movie.id} style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }}>
                                      <div style={{ minWidth: 220, maxWidth: 280, margin: 0, position: "relative" }}>
                                        <img
                                          src={movie.poster_path || placeholderForTitle(movie.title)}
                                          alt={movie.title}
                                          style={{ width: "220px", height: "330px", objectFit: "cover", borderRadius: 12, display: "block" }}
                                        />
                                        <div
                                          style={{
                                            position: "absolute",
                                            top: 12,
                                            right: 12,
                                            backgroundColor: theme.primary,
                                            color: "#fff",
                                            padding: "6px 10px",
                                            borderRadius: 999,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            fontSize: 12,
                                            fontWeight: 600,
                                          }}
                                        >
                                          <Star sx={{ fontSize: 16 }} />
                                          {typeof movie.vote_average === "number" ? movie.vote_average.toFixed(1) : "N/A"}
                                        </div>
                                      </div>

                                      {/* Compact metadata and actions (left-aligned text) — all movie info shown here */}
                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minWidth: 260, maxWidth: 520, alignItems: "flex-start", textAlign: "left", paddingLeft: 0 }}>
                                      {/* Movie title shown in metadata area for clearer context */}
                                      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                        <h3 style={{ margin: 0, color: theme.text.primary, fontWeight: 900, fontSize: 20 }}>{movie.title}</h3>
                                        <div style={{ color: theme.text.secondary, fontSize: 14 }}>{/* placeholder for potential badge/actions */}</div>
                                      </div>

                                      {/* Full overview / description */}
                                      <div style={{ color: theme.text.primary, fontSize: 15, marginTop: 6, whiteSpace: "pre-wrap" }}>
                                        {movie.overview || "No description available."}
                                      </div>

                                      <div style={{ color: theme.text.secondary, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18 }}>
                                          <span style={{ fontWeight: 900, color: theme.text.primary }}>Rating:</span>
                                          <span style={{ color: theme.text.primary, fontWeight: 800 }}>{typeof movie.vote_average === "number" ? movie.vote_average.toFixed(1) : "N/A"}</span>
                                        </div>

                                        {movie.release_date && (
                                          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18 }}>
                                            <span style={{ fontWeight: 900, color: theme.text.primary }}>Year:</span>
                                            <span style={{ color: theme.text.primary, fontWeight: 800 }}>{new Date(movie.release_date).getFullYear()}</span>
                                          </div>
                                        )}
                                      </div>

                                      <div style={{ color: theme.text.secondary, fontSize: 15, marginTop: 6 }}>
                                        <div>Saved on: <span style={{ color: theme.text.primary, fontWeight: 800 }}>{formatDate(prompt.createdAt)}</span></div>
                                        <div style={{ marginTop: 8 }}>Saved from: <span style={{ color: theme.text.primary, fontWeight: 800 }}>Results</span></div>
                                      </div>

                                      <div style={{ marginTop: 8, display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-start" }}>
                                        {movie.trailer_youtube_id && (
                                          <Button
                                            size="medium"
                                            variant="outlined"
                                            href={`https://www.youtube.com/watch?v=${movie.trailer_youtube_id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            sx={{ borderColor: theme.primary, color: theme.primary, textTransform: "none", fontWeight: 800, fontSize: 15 }}
                                          >
                                            Watch Trailer
                                          </Button>
                                        )}

                                        <Button
                                          size="medium"
                                          variant="text"
                                          onClick={() => {
                                            setConfirmState({
                                              open: true,
                                              title: "Delete this favorite?",
                                              description: "This will remove this saved favorite prompt.",
                                              action: async () => {
                                                try {
                                                  const res = await fetch("/api/recommendations/favorite", {
                                                    method: "DELETE",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ mood: prompt.mood, movieIds: prompt.movieIds }),
                                                  });
                                                  const payload = await res.json().catch(() => ({}));
                                                  if (!res.ok) {
                                                    toast.error(payload?.error || "Failed to delete favorite");
                                                  } else {
                                                    toast.success("Favorite deleted");
                                                    refreshFavorites();
                                                  }
                                                } catch (err) {
                                                  console.error("Delete favorite error:", err);
                                                  toast.error("Failed to delete favorite");
                                                }
                                              },
                                            })
                                          }}
                                          sx={{ color: theme.primary, textTransform: "none", fontWeight: 800, fontSize: 15 }}
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
          <ConfirmDialog
            open={confirmState.open}
            title={confirmState.title}
            description={confirmState.description}
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={confirmState.action}
            onClose={() => setConfirmState((s) => ({ ...s, open: false }))}
          />
        </div>
      </div>
    </main>
  )
}