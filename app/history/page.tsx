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
} from "@mui/material"
import { ExpandMore, History as HistoryIcon, CalendarToday, Refresh } from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
import { fadeInUp, itemTransition } from "@/lib/motion"
import { toast } from "react-toastify"
import { useFavoritesHistory } from "../providers/FavoritesHistoryProvider"

type Movie = {
  id: number
  title: string
  overview: string
  poster_path: string | null
  vote_average: number | null
  release_date?: string
  trailer_youtube_id?: string | null
}

type HistoryPrompt = {
  mood: string
  movieIds: string[]
  createdAt: string
  _id?: string
}

export default function HistoryPage() {
  const router = useRouter()
  const { history, loadingHistory, refreshHistory } = useFavoritesHistory()
  const [moviesData, setMoviesData] = useState<Record<string, Movie>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [loadingMovies, setLoadingMovies] = useState<Set<number>>(new Set())
  // new: store which movie ids are displayed per prompt index (max 5 random)
  const [displayedIds, setDisplayedIds] = useState<Record<number, string[]>>({})

  useEffect(() => {
    setIsLoading(loadingHistory)
  }, [loadingHistory])

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

      // after ensuring movie details exist in moviesData, choose up to 5 random ids to display
      const availableIds = movieIds.filter((id) => moviesData[id] || idsToFetch.includes(id))
      // If some were just fetched, they might not yet be in moviesData state synchronously.
      // Build final pool from movieIds but prefer those present in moviesData (fallback to movieIds).
      const finalPool = movieIds.slice()
      const chosen = pickRandomIds(finalPool, 5)
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

  // refresh selection for a given prompt index
  async function handleRefreshSelection(index: number) {
    const prompt = history[index]
    if (!prompt) return
    // if details not fetched yet, ensure they are fetched first
    if (!prompt.movieIds.some((id) => moviesData[id])) {
      await fetchMovieDetails(prompt.movieIds, index)
      // small delay to allow state to update (movie objects may arrive asynchronously)
      setTimeout(() => {
        const chosen = pickRandomIds(prompt.movieIds, 5)
        setDisplayedIds((prev) => ({ ...prev, [index]: chosen }))
      }, 150)
      return
    }
    const chosen = pickRandomIds(prompt.movieIds, 5)
    setDisplayedIds((prev) => ({ ...prev, [index]: chosen }))
  }

  const handleAccordionChange = (index: number) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedIndex(isExpanded ? index : null)
    
    if (isExpanded) {
      // Fetch movie details when accordion is expanded and prepare displayed ids
      const prompt = history[index]
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

  const getMoodColor = (mood: string) => {
    const colors: Record<string, string> = {
      Happy: "#FFD700",
      Sad: "#4A90E2",
      Romantic: "#FF69B4",
      Excited: "#FF6347",
      Relaxed: "#98D8C8",
      Angry: "#DC143C",
      Scared: "#800080",
      Adventurous: "#FF8C00",
      Mysterious: "#9370DB",
    }
    return colors[mood] || "#A855F7"
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F]">
      <Navbar />

      <Backdrop
        open={isLoading}
        sx={{ color: "#fff", zIndex: (t) => t.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
        <span style={{ marginLeft: 12 }}>Loading your history...</span>
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
              <HistoryIcon sx={{ color: "#A855F7", fontSize: 32 }} />
              <h1 className="text-3xl font-bold text-white">
                Your Recommendation History
              </h1>
            </div>
            <p className="text-[#A0A0A0] text-sm">
              Review your past mood-based movie recommendations
            </p>
          </motion.div>

          {/* History List */}
          {!isLoading && history.length === 0 ? (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              className="text-center py-12"
            >
              <Alert
                severity="info"
                sx={{
                  backgroundColor: "#1A1A24",
                  color: "#A0A0A0",
                  border: "1px solid #2D2D3D",
                  "& .MuiAlert-icon": { color: "#A855F7" },
                }}
              >
                No history yet. Start by getting some movie recommendations!
              </Alert>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {history.map((prompt, index) => {
                  const isExpanded = expandedIndex === index
                  const isLoadingMovies = loadingMovies.has(index)
                  // use displayedIds when available, otherwise derive from moviesData (show up to 5)
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
                          backgroundColor: "#1A1A24",
                          border: "1px solid #2D2D3D",
                          borderRadius: "12px !important",
                          "&:before": { display: "none" },
                          "&.Mui-expanded": {
                            margin: "0 0 16px 0",
                          },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={
                            <ExpandMore sx={{ color: "#A855F7" }} />
                          }
                          sx={{
                            "& .MuiAccordionSummary-content": {
                              margin: "16px 0",
                            },
                          }}
                        >
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-4">
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
                              <div>
                                <Typography
                                  sx={{
                                    color: "white",
                                    fontWeight: 500,
                                    fontSize: "1rem",
                                  }}
                                >
                                  {prompt.movieIds.length} movies recommended
                                </Typography>
                                <div className="flex items-center gap-2 mt-1">
                                  <CalendarToday
                                    sx={{
                                      fontSize: 14,
                                      color: "#A0A0A0",
                                    }}
                                  />
                                  <Typography
                                    sx={{
                                      color: "#A0A0A0",
                                      fontSize: "0.85rem",
                                    }}
                                  >
                                    {formatDate(prompt.createdAt)}
                                  </Typography>
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionSummary>

                        <AccordionDetails
                          sx={{ padding: "0 24px 24px 24px" }}
                        >
                          {/* refresh button + loading state */}
                          <div className="flex items-center justify-end mb-4">
                            <Button
                              size="small"
                              startIcon={<Refresh />}
                              onClick={() => handleRefreshSelection(index)}
                              disabled={isLoadingMovies}
                              sx={{
                                color: "#A855F7",
                                borderColor: "#2D2D3D",
                                textTransform: "none",
                              }}
                              variant="outlined"
                            >
                              Refresh Picks
                            </Button>
                          </div>

                          {isLoadingMovies ? (
                            <Box className="flex justify-center py-8">
                              <CircularProgress
                                size={32}
                                sx={{ color: "#A855F7" }}
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