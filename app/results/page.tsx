"use client"

import { useEffect, useMemo, useState } from "react"
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
  const [selectedMood, setSelectedMood] = useState<string>("")
  const [moodResponse, setMoodResponse] = useState<"match" | "address" | null>(null)
  const [showToast, setShowToast] = useState(true)
  const [movies, setMovies] = useState<Movie[]>([])
  const [allResults, setAllResults] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)

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
        if (mounted) setSelectedMood(mood)
      } catch {}

      // restore optional moodResponse
      try {
        const mr = sessionStorage.getItem("moodResponse") as "match" | "address" | null
        if (mounted) setMoodResponse(mr)
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
              // pick a fresh sample each visit for variety
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

  const handleRefresh = () => {
    checkAuth()
    if (!isNavigatorOnline()) {
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2500)
      alert("You’re offline. Reconnect to refresh picks.")
      return
    }
    // Prefer in-memory allResults; otherwise read from sessionStorage
    let pool: Movie[] | undefined = Array.isArray(allResults) && allResults.length > 0 ? allResults.slice() : undefined
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
    // show a quick toast on refresh
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
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
    <main className="min-h-screen bg-[#0B0B0F]">
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
                  color: "#A0A0A0",
                  textTransform: "none",
                  "&:hover": {
                    color: "#A855F7",
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
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {headerTitle}
                </h1>
                <p className="text-[#A0A0A0] text-sm">
                  {subtitle}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRefresh}
                  variant="outlined"
                  disabled={isLoading || (allResults?.length ?? 0) === 0}
                  sx={{
                    borderColor: "#A855F7",
                    color: "#A855F7",
                    textTransform: "none",
                    "&:hover": { borderColor: "#8B46CF", color: "#8B46CF" },
                  }}
                >
                  Refresh Picks
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
                    backgroundColor: "#2D2D3D",
                    color: "#A855F7",
                    fontWeight: 500,
                    border: "1px solid #A855F7",
                  }}
                />
              </div>
            )}

            {/* Display parsed genres and keywords */}
            {parsedData && (parsedData.genres || parsedData.keywords) && (
              <div className="space-y-3 mt-4 p-4 bg-[#1A1A24] rounded-lg border border-[#2D2D3D]">
                {parsedData.genres && parsedData.genres.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[#A0A0A0] text-sm font-medium">Genres:</span>
                    {parsedData.genres.map((genre, idx) => (
                      <Chip
                        key={idx}
                        label={genre}
                        size="small"
                        sx={{
                          backgroundColor: "#A855F7",
                          color: "white",
                          fontWeight: 500,
                          "&:hover": {
                            backgroundColor: "#8B46CF",
                          },
                        }}
                      />
                    ))}
                  </div>
                )}
                {parsedData.keywords && parsedData.keywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[#A0A0A0] text-sm font-medium">Keywords:</span>
                    {parsedData.keywords.map((keyword, idx) => (
                      <Chip
                        key={idx}
                        label={keyword}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: "#A855F7",
                          color: "#A855F7",
                          fontWeight: 500,
                          "&:hover": {
                            borderColor: "#8B46CF",
                            color: "#8B46CF",
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
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
                className="col-span-full text-center text-[#A0A0A0]"
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
                  "& .MuiAlert-icon": { color: "#A855F7" },
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
