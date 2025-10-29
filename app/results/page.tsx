"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Alert, Button } from "@mui/material"
import { ArrowBack, Refresh } from "@mui/icons-material"
import { Navbar } from "../../components/navbar"
import { MovieCard } from "../../components/movie-card"

const mockMovies = [
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
]

export default function ResultsPage() {
  const router = useRouter()
  const [selectedMood, setSelectedMood] = useState<string>("")
  const [showToast, setShowToast] = useState(true)

  useEffect(() => {
    const mood = sessionStorage.getItem("selectedMood")
    if (!mood) {
      router.push("/")
    } else {
      setSelectedMood(mood)
    }
  }, [router])

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
                onClick={() => router.push("/")}
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
            {mockMovies.map((movie) => (
              <MovieCard
                key={movie.title}
                title={movie.title}
                posterPath={movie.posterPath}
                rating={movie.rating}
                overview={movie.overview}
              />
            ))}
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
                Movies loaded! Found 5 perfect matches for your {selectedMood} mood
              </Alert>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
