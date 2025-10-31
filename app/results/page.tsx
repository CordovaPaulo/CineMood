"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Alert, Button } from "@mui/material"
import { ArrowBack, Refresh } from "@mui/icons-material"
import { Navbar } from "../../components/navbar"
import { MovieCard } from "../../components/movie-card"

export default function ResultsPage() {
  const router = useRouter()
  const [selectedMood, setSelectedMood] = useState<string>("")
  const [showToast, setShowToast] = useState(true)

  // new state to hold actual movies (replaces mockMovies)
  const [movies, setMovies] = useState<any[]>([])
  const [allResults, setAllResults] = useState<any[]>([])

  useEffect(() => {
    const mood = sessionStorage.getItem("selectedMood")
    if (!mood) {
      router.push("/home")
    } else {
      setSelectedMood(mood)
    }

    // Prefer transient "prop" passed via window.__CINEMOOD_RESULTS__
    const transient = (window as any).__CINEMOOD_RESULTS__
    const transientAll = (window as any).__CINEMOOD_RESULTS_ALL__

    // If the caller provided the full results array, sample 5 from it.
    if (Array.isArray(transientAll) && transientAll.length > 0) {
      setAllResults(transientAll)
      try {
        sessionStorage.setItem("recommendations_all", JSON.stringify(transientAll))
      } catch {}
      // sample 5 random items from the full set
      const sample = pickRandomFive(transientAll)
      setMovies(sample)
      // clear transient after use (optional)
      try {
        delete (window as any).__CINEMOOD_RESULTS__
        delete (window as any).__CINEMOOD_RESULTS_ALL__
      } catch {}
      return
    }

    // If only a transient array was provided (could be full or already sampled), treat it as the full list and sample.
    if (Array.isArray(transient) && transient.length > 0) {
      setAllResults(transient)
      try {
        sessionStorage.setItem("recommendations_all", JSON.stringify(transient))
      } catch {}
      const sample = pickRandomFive(transient)
      setMovies(sample)
      try {
        delete (window as any).__CINEMOOD_RESULTS__
      } catch {}
      return
    }

    // fallback to sessionStorage: try to get the full list, then pick 5
    try {
      const storedAll = sessionStorage.getItem("recommendations_all")
      const storedShown = sessionStorage.getItem("recommendations")
      if (storedAll) {
        const parsedAll = JSON.parse(storedAll)
        if (Array.isArray(parsedAll)) {
          setAllResults(parsedAll)
          // pick first 5 deterministically (or sample)
          setMovies(parsedAll.slice(0, 5))
          return
        }
      }
      if (storedShown) {
        const parsed = JSON.parse(storedShown)
        if (Array.isArray(parsed)) setMovies(parsed.slice(0, 5))
      }
    } catch (e) {
      console.error("Failed to parse stored recommendations", e)
    }
  }, [router])

  // helper to pick a random sample of up to 5 from allResults or stored list
  function pickRandomFive(src?: any[]) {
    const pool = Array.isArray(src) && src.length > 0 ? src.slice() : allResults.slice()
    if (!pool || pool.length === 0) return []
    // shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const chosen = pool.slice(0, Math.min(5, pool.length))
    // persist shown sample
    try {
      sessionStorage.setItem("recommendations", JSON.stringify(chosen))
    } catch {}
    return chosen
  }

  const handleRefresh = () => {
    // Prefer in-memory allResults; otherwise read synchronously from sessionStorage
    let pool: any[] | undefined =
      Array.isArray(allResults) && allResults.length > 0 ? allResults.slice() : undefined

    if (!Array.isArray(pool) || pool.length === 0) {
      try {
        const stored = sessionStorage.getItem("recommendations_all")
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            pool = parsed.slice()
            setAllResults(parsed)
          }
        }
      } catch {}
    }

    const newSample = pickRandomFive(pool)
    setMovies(newSample)
  }

  const moodDescriptions: Record<string, string> = {
    Happy: "Feel-good & uplifting",
    Sad: "Emotional & touching",
    Romantic: "Love & heartwarming",
    Excited: "Action-packed & energetic",
    Relaxed: "Peaceful & soothing",
    Angry: "Intense & cathartic",
    Scared: "Thrilling & suspenseful",
    Adventurous: "Epic journeys await",
    Mysterious: "Intriguing & puzzling",
  }

  const moodQuotes: Record<string, string> = {
    Happy: 'Your vibe: "I want to feel uplifted and inspired"',
    Sad: 'Your vibe: "I want to feel and eternalize my sad feelings"',
    Romantic: 'Your vibe: "I want to feel the warmth of love"',
    Excited: 'Your vibe: "I want adrenaline and action"',
    Relaxed: 'Your vibe: "I want peace and tranquility"',
    Angry: 'Your vibe: "I want intensity and catharsis"',
    Scared: 'Your vibe: "I want thrills and suspense"',
    Adventurous: 'Your vibe: "I want epic journeys"',
    Mysterious: 'Your vibe: "I want intrigue and puzzles"',
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F]">
      <Navbar />

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with Back Button */}
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

            <Button
              startIcon={<Refresh />}
              onClick={handleRefresh}
              sx={{
                color: "#A0A0A0",
                textTransform: "none",
                "&:hover": {
                  color: "#A855F7",
                },
              }}
            >
              Refresh Results
            </Button>
          </div>

          {/* Title and Subtitle */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">{selectedMood} Movies</h1>
            <p className="text-[#A0A0A0]">{moodQuotes[selectedMood] || ""}</p>
          </div>

          {/* Movie Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            {movies && movies.length > 0 ? (
              movies.map((movie: any, idx: number) => (
                <MovieCard
                  key={movie.id ?? movie.title ?? idx}
                  title={movie.title}
                  posterPath={movie.poster ?? movie.posterPath ?? movie.poster_path ?? null}
                  rating={movie.vote_average ?? movie.rating ?? null}
                  overview={movie.overview}
                />
              ))
            ) : (
              <>
                {[
                  {
                    title: "Manchester by the Sea",
                    posterPath: "/manchester-by-the-sea-movie-poster.jpg",
                    rating: 7.8,
                    overview: "A man is forced to take responsibility for his nephew when his brother dies.",
                  },
                  {
                    title: "Her",
                    posterPath: "/her-movie-poster.jpg",
                    rating: 7.9,
                    overview: "A lonely writer develops an unlikely relationship with an advanced AI.",
                  },
                  {
                    title: "The Notebook",
                    posterPath: "/the-notebook-movie-poster.jpg",
                    rating: 7.9,
                    overview: "A poor yet passionate man falls in love with a rich young woman.",
                  },
                  {
                    title: "The Fault in Our Stars",
                    posterPath: "/the-fault-in-our-stars-poster.jpg",
                    rating: 7.6,
                    overview: "Two teenagers with cystic fibrosis fall in love in a hospital.",
                  },
                  {
                    title: "Eternal Sunshine of the Spotless Mind",
                    posterPath: "/eternal-sunshine-spotless-mind-poster.jpg",
                    rating: 8.3,
                    overview: "A man undergoes a procedure to erase memories of his ex-girlfriend.",
                  },
                ].map((movie) => (
                  <MovieCard
                    key={movie.title}
                    title={movie.title}
                    posterPath={movie.posterPath}
                    rating={movie.rating}
                    overview={movie.overview}
                  />
                ))}
              </>
            )}
          </div>

          {/* Toast Notification */}
          {showToast && (
            <div className="fixed bottom-6 right-6 z-50">
              <Alert
                onClose={() => setShowToast(false)}
                severity="success"
                sx={{
                  backgroundColor: "#1A1A24",
                  color: "white",
                  border: "1px solid #2D2D3D",
                  borderRadius: "0.75rem",
                  "& .MuiAlert-icon": {
                    color: "#A855F7",
                  },
                }}
              >
                Movies loaded! Found {movies?.length ?? 0} perfect matches for your {selectedMood} mood
              </Alert>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
