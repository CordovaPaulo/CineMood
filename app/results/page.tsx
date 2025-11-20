"use client"

import { useEffect, useMemo, useState } from "react"
import { useFavoritesHistory } from "../providers/FavoritesHistoryProvider"
import { useRouter } from "next/navigation"
import { Navbar } from "../../components/navbar"
import OfflineBanner from "../../components/offline-banner"
import { MovieCard } from "../../components/movie-card"
import { Alert, Button, Backdrop, CircularProgress, Chip } from "@mui/material"
import { ArrowBack } from "@mui/icons-material"
import { motion } from "framer-motion"
import { fadeInUp, fadeIn, itemTransition } from "@/lib/motion"
import { isNavigatorOnline } from "@/lib/network"
import { toast } from "react-toastify"
import { useTheme } from "@/contexts/theme-context"
import { MoodType, MoodResponse as MoodResponseType } from "@/lib/mood-colors"

type Movie = {
  id: number
  title: string
  overview: string
  poster?: string | null
  poster_path?: string | null
  posterPath?: string | null
  vote_average?: number | null
  rating?: number | null
  trailer_youtube_id?: string | null
}

type ParsedData = {
  genres?: string[]
  keywords?: string[]
  moodResponse?: "match" | "address"
}

export default function ResultsPage() {
  const router = useRouter()
  const { updateTheme, theme } = useTheme()
  const [selectedMood, setSelectedMood] = useState<string>("")
  const [moodResponse, setMoodResponse] = useState<"match" | "address" | null>(null)
  const [showToast, setShowToast] = useState(true)
  const [movies, setMovies] = useState<Movie[]>([])
  const [allResults, setAllResults] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const { refreshFavorites } = useFavoritesHistory()

  // helper to pick a random sample of up to 5 from a list and persist the shown list
  function pickRandomFive(src?: Movie[]) {
    const pool = Array.isArray(src) && src.length > 0 ? src.slice() : allResults.slice()
    if (!pool || pool.length === 0) return []
    // shuffle (Fisher–Yates)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const chosen = pool.slice(0, Math.min(5, pool.length))
    try {
      sessionStorage.setItem("recommendations", JSON.stringify(chosen))
    } catch {}
    return chosen
  }

  async function checkAuth() {
    const auth = await fetch("/api/auth/", { method: "GET" })
    if(!auth.ok){
      setIsLoading(false)
      toast.info("Please log in first to get personalized recommendations.")
      return router.push("/")
    }
  }

  useEffect(() => {
    checkAuth()
    let mounted = true
    const init = () => {
      setIsLoading(true)

      // Restore mood information
      try {
        const mood = sessionStorage.getItem("selectedMood") || ""
        const mr = sessionStorage.getItem("moodResponse") as "match" | "address" | null
        if (mounted) {
          setSelectedMood(mood)
          setMoodResponse(mr)
          // Update theme based on stored mood and response
          if (mood) {
            updateTheme(mood as MoodType, mr as MoodResponseType)
          }
        }
      } catch {}

      // Restore parsed data (genres, keywords)
      try {
        const storedParsed = sessionStorage.getItem("parsedData")
        if (storedParsed) {
          const parsed = JSON.parse(storedParsed)
          if (mounted) setParsedData(parsed)
        }
      } catch {}

      // transient in-memory results (preferred)
      const w = typeof window !== "undefined" ? (window as any) : undefined
      const transient = w?.__CINEMOOD_RESULTS__
      const transientAll = w?.__CINEMOOD_RESULTS_ALL__
      const transientParsed = w?.__CINEMOOD_PARSED__

      // Store parsed data if available
      if (transientParsed) {
        if (mounted) setParsedData(transientParsed)
        try {
          sessionStorage.setItem("parsedData", JSON.stringify(transientParsed))
        } catch {}
      }

      // If the caller provided the full results array
      if (Array.isArray(transientAll) && transientAll.length > 0) {
        if (mounted) {
          setAllResults(transientAll)
          try {
            sessionStorage.setItem("recommendations_all", JSON.stringify(transientAll))
          } catch {}
          const sample = pickRandomFive(transientAll)
          setMovies(sample)
        }
        try {
          if (w) {
            delete w.__CINEMOOD_RESULTS__
            delete w.__CINEMOOD_RESULTS_ALL__
          }
        } catch {}
        if (mounted) setIsLoading(false)
        return
      }

      // If only a transient array was provided (could be full or already sampled)
      if (Array.isArray(transient) && transient.length > 0) {
        if (mounted) {
          setAllResults(transient)
          try {
            sessionStorage.setItem("recommendations_all", JSON.stringify(transient))
          } catch {}
          const sample = pickRandomFive(transient)
          setMovies(sample)
        }
        try {
          if (w) delete w.__CINEMOOD_RESULTS__
        } catch {}
        if (mounted) setIsLoading(false)
        return
      }

      // Fallback to sessionStorage
      try {
        const storedAll = sessionStorage.getItem("recommendations_all")
        const storedShown = sessionStorage.getItem("recommendations")
        if (storedAll) {
          const parsedAll = JSON.parse(storedAll)
          if (Array.isArray(parsedAll) && parsedAll.length > 0) {
            if (mounted) {
              setAllResults(parsedAll)
              const sample = pickRandomFive(parsedAll)
              setMovies(sample.length ? sample : parsedAll.slice(0, Math.min(5, parsedAll.length)))
            }
            if (mounted) setIsLoading(false)
            return
          }
        }
        if (storedShown) {
          const parsed = JSON.parse(storedShown)
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (mounted) setMovies(parsed.slice(0, Math.min(5, parsed.length)))
            if (mounted) setIsLoading(false)
            return
          }
        }
      } catch (e) {
        console.error("Failed to parse stored recommendations", e)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    init()
    return () => {
      mounted = false
    }
  }, [router])

  const moodDescriptions: Record<string, string> = useMemo(
    () => ({
      Happy: "Feel-good & uplifting",
      Sad: "Emotional & touching",
      Romantic: "Love & heartwarming",
      Excited: "Action-packed & energetic",
      Relaxed: "Peaceful & soothing",
      Angry: "Intense & cathartic",
      Scared: "Thrilling & suspenseful",
      Adventurous: "Epic journeys await",
      Mysterious: "Intriguing & puzzling",
    }),
    []
  )

  const handleRefresh = async () => {
    // ensure user still authenticated before refreshing
    await checkAuth()

    if (!isNavigatorOnline()) {
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2500)
      alert("You’re offline. Reconnect to refresh picks.")
      return
    }

    // show loader for a couple of seconds to indicate refresh activity
    setIsLoading(true)

    const performRefresh = () => {
      // Prefer in-memory allResults; otherwise read from sessionStorage
      let pool: Movie[] | undefined =
        Array.isArray(allResults) && allResults.length > 0 ? allResults.slice() : undefined

      if (!pool || pool.length === 0) {
        try {
          const storedAll = sessionStorage.getItem("recommendations_all")
          if (storedAll) {
            const parsedAll = JSON.parse(storedAll)
            if (Array.isArray(parsedAll)) pool = parsedAll
          }
        } catch {}
      }

      const newSample = pickRandomFive(pool)
      setMovies(newSample)

      // stop loader and show toast
      setIsLoading(false)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2500)
    }

    // simulate brief network/processing delay (2s)
    setTimeout(performRefresh, 2000)
  }

  // Save only the currently shown movies (the sample of up to 5)
  const handleAddFavorites = async () => {
    await checkAuth()

    if (!isNavigatorOnline()) {
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2500)
      alert("You’re offline. Reconnect to save favorites.")
      return
    }

    if (!movies || movies.length === 0) {
      toast.info("No movies to save.")
      return
    }

    setIsLoading(true)
    try {
      const movieIds = movies.map((m) => String(m.id))
      const payload = { mood: selectedMood || "", movieIds }

      const res = await fetch("/api/recommendations/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if(res.status === 409){
        toast.info("These picks are already in your favorites.")
        return
      }

      if (!res.ok) {
        toast.error(data?.error || "Failed to save favorites")
      } else {
        toast.success("Saved current picks to favorites")
        try {
          refreshFavorites && refreshFavorites()
        } catch (e) {
          // provider also listens to history events if refresh fails
        }
      }
    } catch (e) {
      console.error("Save favorites error:", e)
      toast.error("Failed to save favorites")
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    // If user lands here offline, we’ll prefer cached results and show info once
    if (typeof window !== "undefined" && !navigator.onLine) {
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && movies.length > 0) {
      setShowToast(true)
      const t = setTimeout(() => setShowToast(false), 3000)
      return () => clearTimeout(t)
    }
  }, [isLoading, movies])

  // Simplified subtitle logic
  const subtitle = useMemo(() => {
    if (!selectedMood) {
      return moodResponse === "address"
        ? "Based on your description — to help shift your mood"
        : "Based on your description"
    }
    
    if (moodResponse === "address") {
      return `To help address your ${selectedMood} mood`
    }
    
    return moodDescriptions[selectedMood] || "Movies tailored for your vibe"
  }, [selectedMood, moodResponse, moodDescriptions])

  // Simplified header title
  const headerTitle = useMemo(() => {
    if (moodResponse === "address" && selectedMood) {
      return `Addressing Your ${selectedMood} Mood`
    }
    return selectedMood ? `Your ${selectedMood} Picks` : "Your Picks"
  }, [selectedMood, moodResponse])

  return (
    <main className="min-h-screen" style={{ backgroundColor: theme.background.base, transition: "background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
      <Navbar />
      <OfflineBanner />

      {/* Global loader overlay while preparing results */}
      <Backdrop open={isLoading} sx={{ color: "#fff", zIndex: (t) => t.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
        <span style={{ marginLeft: 12 }}>Loading your results...</span>
      </Backdrop>

      <div className="pt-24 pb-12 px-6" style={{ opacity: isLoading ? 0.4 : 1 }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="flex items-center justify-between mb-8"
            variants={fadeInUp}
            initial="hidden"
            animate="show"
          >
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push("/home")}
                startIcon={<ArrowBack />}
                sx={{
                  color: theme.text.secondary,
                  textTransform: "none",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    color: theme.primary,
                  },
                }}
              >
                Change Mood
              </Button>
            </div>
          </motion.div>

          {/* Header */}
          <motion.div
            className="mb-8"
            variants={fadeInUp}
            initial="hidden"
            animate="show"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ color: theme.text.primary, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                  {headerTitle}
                </h1>
                <p className="text-sm" style={{ color: theme.text.secondary }}>
                  {subtitle}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <Button
                  onClick={handleRefresh}
                  variant="outlined"
                  disabled={isLoading || (allResults?.length ?? 0) === 0}
                  sx={{
                    borderColor: theme.primary,
                    color: theme.primary,
                    textTransform: "none",
                    transition: "all 0.3s ease",
                    "&:hover": { borderColor: theme.primaryDark, color: theme.primaryDark },
                  }}
                >
                  Refresh Picks
                </Button>
                <Button
                  onClick={handleAddFavorites}
                  variant="contained"
                  disabled={isLoading || (movies?.length ?? 0) === 0}
                  sx={{
                    backgroundColor: theme.primary,
                    color: "white",
                    textTransform: "none",
                    transition: "all 0.3s ease",
                    "&:hover": { backgroundColor: theme.primaryDark },
                  }}
                >
                  Add to Favorites
                </Button>
              </div>
            </div>

            {/* Display mood chip if addressing mood */}
            {moodResponse === "address" && selectedMood && (
              <div className="mb-4">
                <Chip
                  label={`Counteracting: ${selectedMood}`}
                  size="small"
                  sx={{
                    backgroundColor: theme.card.bg,
                    color: theme.primary,
                    fontWeight: 500,
                    border: `1px solid ${theme.primary}`,
                    transition: "all 0.3s ease",
                  }}
                />
              </div>
            )}

            {/* Display parsed genres and keywords */}
            {parsedData && (parsedData.genres || parsedData.keywords) && (
              <div className="space-y-3 mt-4 p-4 rounded-lg border" style={{ backgroundColor: theme.card.bg, borderColor: theme.card.border, transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                {parsedData.genres && parsedData.genres.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: theme.text.secondary }}>Genres:</span>
                    {parsedData.genres.map((genre, idx) => (
                      <Chip
                        key={idx}
                        label={genre}
                        size="small"
                        sx={{
                          backgroundColor: theme.primary,
                          color: "white",
                          fontWeight: 500,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            backgroundColor: theme.primaryDark,
                          },
                        }}
                      />
                    ))}
                  </div>
                )}
                {parsedData.keywords && parsedData.keywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: theme.text.secondary }}>Keywords:</span>
                    {parsedData.keywords.map((keyword, idx) => (
                      <Chip
                        key={idx}
                        label={keyword}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: theme.primary,
                          color: theme.primary,
                          fontWeight: 500,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            borderColor: theme.primaryDark,
                            color: theme.primaryDark,
                          },
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Movie Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
             {!isLoading && movies && movies.length > 0 ? (
               movies.map((movie, idx) => (
                <motion.div
                  key={movie.id ?? movie.title ?? idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={itemTransition(idx)}
                >
                   <MovieCard
                     title={movie.title}
                     posterPath={movie.poster ?? movie.posterPath ?? movie.poster_path ?? null}
                     rating={movie.vote_average ?? movie.rating ?? null}
                     overview={movie.overview}
                     trailerId={movie.trailer_youtube_id ?? null}
                   />
                 </motion.div>
               ))
             ) : isLoading ? (
               Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={itemTransition(i)}
                  className="h-[360px] w-full rounded-xl bg-[#1A1A24] border border-[#2D2D3D]"
                />
               ))
             ) : (
              <motion.div
                className="col-span-full text-center" style={{ color: theme.text.secondary }}
                initial="hidden"
                animate="show"
                variants={fadeIn}
              >
                 No results available. Please go back and try again.
               </motion.div>
             )}
           </div>

          {/* Toast Notification */}
          {!isLoading && showToast && movies.length > 0 && (
            <div className="fixed bottom-6 right-6 z-50">
              <Alert
                onClose={() => setShowToast(false)}
                severity="success"
                sx={{
                  backgroundColor: "#1A1A24",
                  color: "white",
                  border: "1px solid #2D2D3D",
                  borderRadius: "0.75rem",
                  "& .MuiAlert-icon": { color: theme.primary },
                }}
              >
                Movies loaded! Found {movies?.length ?? 0} picks {
                  moodResponse === "address" && selectedMood
                    ? `to address your ${selectedMood} mood`
                    : selectedMood 
                    ? `for your ${selectedMood} mood` 
                    : "based on your description"
                }
              </Alert>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
