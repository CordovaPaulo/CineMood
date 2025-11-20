"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "../../components/navbar"
import { MovieCard } from "../../components/movie-card"
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
import { ExpandMore, Favorite as FavoriteIcon, CalendarToday, Refresh } from "@mui/icons-material"
import { Delete as DeleteIcon } from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
import { fadeInUp, itemTransition } from "@/lib/motion"
import { toast } from "react-toastify"
import { useFavoritesHistory } from "../providers/FavoritesHistoryProvider"
import { useTheme } from "@/contexts/theme-context"
import { MOOD_COLORS } from "@/lib/mood-colors"

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

  useEffect(() => {
    // map provider loading -> local loading flag
    setIsLoading(loadingFavorites)
  }, [loadingFavorites])

  // helper: pick up to `count` random ids from an array
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
      // Filter out already loaded movies
      const idsToFetch = movieIds.filter((id) => !moviesData[id])

      if (idsToFetch.length > 0) {
        // Fetch all movie details in parallel
        const moviePromises = idsToFetch.map(async (id) => {
          try {
            const response = await fetch(`/api/movies/${id}`)
            if (!response.ok) throw new Error(`Failed to fetch movie ${id}`)
            return await response.json()
          } catch (error) {
            console.error(`Error fetching movie ${id}:`, error)
            return null
          }
        })

        const movies = await Promise.all(moviePromises)

        // Update movies data
        setMoviesData((prev) => {
          const newData = { ...prev }
          movies.forEach((movie) => {
            if (movie) {
              newData[movie.id.toString()] = movie
            }
          })
          return newData
        })
      }

      // choose up to 5 random ids to display for this favorite prompt
      const chosen = pickRandomIds(movieIds, 5)
      setDisplayedIds((prev) => ({ ...prev, [promptIndex]: chosen }))
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
            <div className="flex items-center gap-3 mb-2">
              <FavoriteIcon sx={{ color: theme.primary, fontSize: 32, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
              <h1 className="text-3xl font-bold" style={{ color: theme.text.primary, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                Your Favorites
              </h1>
            </div>
            <p className="text-sm" style={{ color: theme.text.secondary }}>
              Saved mood-based picks (showing up to 5 sampled movies per saved prompt)
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
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm("Delete this favorites entry?")) return;
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
                          sx={{ padding: "0 24px 24px 24px" }}
                        >

                          {isLoadingMovies ? (
                            <Box className="flex justify-center py-8">
                              <CircularProgress
                                size={32}
                                sx={{ color: theme.primary, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
                              />
                            </Box>
                          ) : (
                            // Single-line horizontally scrollable row of up to 5 movies
                            <div className="overflow-x-auto -mx-2 pb-3" style={{ WebkitOverflowScrolling: "touch" }}>
                              <div className="flex gap-4 px-2" style={{ minWidth: 0 }}>
                                {idsToShow.map((id) => {
                                  const movie = moviesData[id]
                                  // render a lightweight placeholder if movie not yet available
                                  if (!movie) {
                                    return (
                                      <div
                                        key={id}
                                        className="w-[233px] shrink-0"
                                        style={{ minWidth: 233, maxWidth: 233 }}
                                      />
                                    )
                                  }

                                  return (
                                    <div
                                      key={movie.id}
                                      className="w-[233 px] shrink-0"
                                      style={{ minWidth: 233, maxWidth: 233 }}
                                    >
                                      <MovieCard
                                        title={movie.title}
                                        posterPath={movie.poster_path}
                                        rating={movie.vote_average}
                                        overview={movie.overview}
                                        trailerId={movie.trailer_youtube_id || null}
                                      />
                                    </div>
                                  )
                                })}
                              </div>
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
        </div>
      </div>
    </main>
  )
}