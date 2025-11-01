"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "../../components/navbar"
import { MovieCard } from "../../components/movie-card"
import { Alert, Button, Backdrop, CircularProgress } from "@mui/material"
import { ArrowBack } from "@mui/icons-material"

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

export default function ResultsPage() {
  const router = useRouter()
  const [selectedMood, setSelectedMood] = useState<string>("")
  const [showToast, setShowToast] = useState(true)
  const [movies, setMovies] = useState<Movie[]>([])
  const [allResults, setAllResults] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  useEffect(() => {
    let mounted = true
    const init = () => {
      setIsLoading(true)

      // mood guard/restore
      try {
        const mood = sessionStorage.getItem("selectedMood")
        if (!mood) {
          router.push("/home")
          return
        } else {
          if (mounted) setSelectedMood(mood)
        }
      } catch {
        // if sessionStorage fails, still continue
      }

      // transient in-memory results (preferred)
      const w = typeof window !== "undefined" ? (window as any) : undefined
      const transient = w?.__CINEMOOD_RESULTS__
      const transientAll = w?.__CINEMOOD_RESULTS_ALL__

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
    if (!isLoading && movies.length > 0) {
      setShowToast(true)
      const t = setTimeout(() => setShowToast(false), 3000)
      return () => clearTimeout(t)
    }
  }, [isLoading, movies])

  return (
    <main className="min-h-screen bg-[#0B0B0F]">
      <Navbar />

      {/* Global loader overlay while preparing results */}
      <Backdrop open={isLoading} sx={{ color: "#fff", zIndex: (t) => t.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
        <span style={{ marginLeft: 12 }}>Loading your results...</span>
      </Backdrop>

      <div className="pt-24 pb-12 px-6" style={{ opacity: isLoading ? 0.4 : 1 }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
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
          </div>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Your {selectedMood ? `${selectedMood} ` : ""}Picks
              </h1>
              {selectedMood && (
                <p className="text-[#A0A0A0] text-sm">
                  {moodDescriptions[selectedMood] || "Movies tailored for your vibe"}
                </p>
              )}
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

          {/* Movie Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            {!isLoading && movies && movies.length > 0 ? (
              movies.map((movie: Movie, idx: number) => (
                <MovieCard
                  key={movie.id ?? movie.title ?? idx}
                  title={movie.title}
                  posterPath={movie.poster ?? movie.posterPath ?? movie.poster_path ?? null}
                  rating={movie.vote_average ?? movie.rating ?? null}
                  overview={movie.overview}
                  trailerId={movie.trailer_youtube_id ?? null}
                />
              ))
            ) : isLoading ? (
              // simple placeholders while loading
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[360px] w-full rounded-xl bg-[#1A1A24] border border-[#2D2D3D]" />
              ))
            ) : (
              // fallback when no movies are available
              <div className="col-span-full text-center text-[#A0A0A0]">
                No results available. Please go back and try again.
              </div>
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
                Movies loaded! Found {movies?.length ?? 0} picks for your {selectedMood} mood
              </Alert>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
