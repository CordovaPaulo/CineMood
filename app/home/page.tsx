"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Button,
  TextField,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Backdrop,
  CircularProgress,
} from "@mui/material"
import { AutoAwesome } from "@mui/icons-material"
import { Navbar } from "../../components/navbar"
import { MoodCard } from "../../components/mood-card"
import MoodResponse from "@/components/mood-response"

type MoodResponseType = "match" | "address"

const moods = [
  { emoji: "😊", label: "Happy", description: "Feel-good & uplifting" },
  { emoji: "😢", label: "Sad", description: "Emotional & touching" },
  { emoji: "😍", label: "Romantic", description: "Love & heartwarming" },
  { emoji: "🎉", label: "Excited", description: "Action-packed & energetic" },
  { emoji: "😌", label: "Relaxed", description: "Peaceful & soothing" },
  { emoji: "😠", label: "Angry", description: "Intense & cathartic" },
  { emoji: "😨", label: "Scared", description: "Thrilling & suspenseful" },
  { emoji: "🗺️", label: "Adventurous", description: "Epic journeys await" },
  { emoji: "🔍", label: "Mysterious", description: "Intriguing & puzzling" },
]

export default function Home() {
  const router = useRouter()
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [textInput, setTextInput] = useState("")
  const [moodResponse, setMoodResponse] = useState<MoodResponseType | null>(null)
  const [showMoodResponse, setShowMoodResponse] = useState(false)
  const [loading, setLoading] = useState(false)

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/", { method: "GET" })
      // if server returns non-JSON HTML (error page), don't attempt to parse it
      if (!res.ok) return false
      return true
    } catch {
      return false
    }
  }

  const beginSubmit = () => {
    // Trigger showing the mood-response selector if not yet chosen.
    if (!selectedMood) return
    if (!moodResponse) {
      setShowMoodResponse(true)
      return
    }
    // if moodResponse already set, call final submit
    submitRecommendations()
  }

  const submitRecommendations = async () => {
    if (!selectedMood) return
    setLoading(true)
    const ok = await checkAuth()
    if (!ok) {
      setLoading(false)
      return
    }

    console.log("Submitting recommendations with:", { selectedMood, textInput, moodResponse })
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput, mood: selectedMood, moodResponse: moodResponse }),
      })

      const contentType = (res.headers.get("content-type") || "").toLowerCase()
      let payload: any = null
      if (contentType.includes("application/json")) {
        payload = await res.json()
      } else {
        const text = await res.text()
        payload = { error: "non-json response", text }
      }

      // Log parsed inputs returned by the recommendations API for debugging
      console.log("API parsed params:", payload.parsed ?? payload)

      if (!res.ok) {
        console.error("Failed to fetch recommendations:", payload)
        setLoading(false)
        return
      }

      // persist full results for refresh / fallback
      const fullResults = payload.results || []
      try {
        sessionStorage.setItem("recommendations_all", JSON.stringify(fullResults))
      } catch {}

      // also save parsed params and selections
      sessionStorage.setItem("parsedParams", JSON.stringify(payload.parsed || {}))
      sessionStorage.setItem("selectedMood", selectedMood)
      sessionStorage.setItem("moodResponse", moodResponse || "")

      // sample 5 to show immediately (transient "props" for results page)
      const sample = (() => {
        const out: any[] = []
        const src = Array.isArray(fullResults) ? fullResults.slice() : []
        // shuffle src (Fisher-Yates)
        for (let i = src.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[src[i], src[j]] = [src[j], src[i]]
        }
        for (let i = 0; i < Math.min(5, src.length); i++) out.push(src[i])
        return out
      })()

      // transiently pass sampled results to the results page via a global (used as "props" at mount)
      try {
        ;(window as any).__CINEMOOD_RESULTS__ = sample
        ;(window as any).__CINEMOOD_RESULTS_ALL__ = fullResults
        ;(window as any).__CINEMOOD_PARSED__ = payload.parsed || {}
      } catch {}

      router.push("/results")
    } catch (error) {
      console.error("Error occurred while fetching recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F]">
      <Navbar />

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-[#B549E7] mb-3">CineMood</h1>
            <p className="text-[#A0A0A0] text-lg">How are you feeling today?</p>
          </div>

          {/* Text Input with Icon and Badge */}
          <div className="mb-12">
            <Box
              sx={{
                position: "relative",
                backgroundColor: "#1A1A24",
                border: "1px solid #2D2D3D",
                borderRadius: "1rem",
                padding: "1rem",
                "&:hover": {
                  borderColor: "#A855F7",
                },
                "&:focus-within": {
                  borderColor: "#A855F7",
                },
              }}
            >
              {/* Label with Icon */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AutoAwesome sx={{ color: "#A855F7", fontSize: "1.25rem" }} />
                  <span className="text-white text-sm font-medium">Describe how you're feeling (optional)</span>
                </div>
                <Chip
                  label="Voice input supported"
                  size="small"
                  sx={{
                    backgroundColor: "transparent",
                    border: "1px solid #2D2D3D",
                    color: "#A0A0A0",
                    fontSize: "0.75rem",
                    height: "24px",
                  }}
                />
              </div>

              {/* Text Input */}
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="E.g., I want something uplifting but not too cheesy, or I'm feeling nostalgic about the 90s..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                variant="standard"
                sx={{
                  "& .MuiInput-root": {
                    color: "white",
                    "&:before": {
                      borderBottom: "none",
                    },
                    "&:hover:before": {
                      borderBottom: "none",
                    },
                    "&:after": {
                      borderBottom: "none",
                    },
                  },
                  "& .MuiInput-input::placeholder": {
                    color: "#A0A0A0",
                    opacity: 0.7,
                  },
                }}
              />
            </Box>
          </div>

          {/* Mood Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {moods.map((mood) => (
              <MoodCard
                key={mood.label}
                emoji={mood.emoji}
                label={mood.label}
                description={mood.description}
                isSelected={selectedMood === mood.label}
                onClick={() => setSelectedMood(mood.label)}
              />
            ))}
          </div>

          {/* Centered modal for MoodResponse (uses slotProps for MUI v6 compatibility) */}
          <Dialog
            open={showMoodResponse}
            onClose={() => setShowMoodResponse(false)}
            fullWidth
            maxWidth="xs"
            slotProps={{
              paper: {
                sx: {
                  backgroundColor: "#0B0B0F",
                  color: "white",
                  borderRadius: "1rem",
                  border: "1px solid #2D2D3D",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                  px: 1,
                },
              },
              backdrop: {
                sx: {
                  background:
                    "linear-gradient(180deg, rgba(11,11,15,0.6) 0%, rgba(11,11,15,0.85) 100%)",
                  backdropFilter: "blur(4px)",
                },
              },
            }}
          >
            <DialogTitle sx={{ color: "white", fontSize: "1rem", textAlign: "center", pt: 3 }}>
              How should the movies relate to your mood?
            </DialogTitle>
            <DialogContent sx={{ display: "flex", justifyContent: "center", pb: 1 }}>
              <div style={{ width: "100%", maxWidth: 420 }}>
                <MoodResponse
                  value={moodResponse ?? null}
                  onChange={(val: MoodResponseType) => setMoodResponse(val)}
                  className="w-full"
                />
                <p style={{ color: "#9CA3AF", textAlign: "center", marginTop: 10, marginBottom: 6, fontSize: 13 }}>
                  Choose whether you want movies that match your mood or help address it.
                </p>
              </div>
            </DialogContent>
            <DialogActions
              sx={{
                justifyContent: "center",
                pb: 3,
                gap: 2,
                // stack buttons on small screens, row on larger screens
                flexDirection: { xs: "column", sm: "row" },
                px: { xs: 3, sm: 0 },
                width: "100%",
              }}
            >
              <Button
                variant="outlined"
                onClick={() => setShowMoodResponse(false)}
                fullWidth
                sx={{
                  borderColor: "#2D2D3D",
                  color: "white",
                  textTransform: "none",
                  minHeight: 44,
                  borderRadius: "0.75rem",
                  "&:hover": { borderColor: "#444" },
                }}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={() => {
                  if (!moodResponse) return
                  setShowMoodResponse(false)
                  submitRecommendations()
                }}
                disabled={!moodResponse || loading}
                fullWidth
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
                sx={{
                  backgroundColor: "#A855F7",
                  color: "white",
                  textTransform: "none",
                  minHeight: 44,
                  borderRadius: "0.75rem",
                  "&:hover": { backgroundColor: "#9333EA" },
                  // clearer disabled styles
                  "&.Mui-disabled": {
                    backgroundColor: "#4b2b66",
                    color: "#BDB7DF",
                    opacity: 0.9,
                  },
                }}
              >
                {loading ? "Finding..." : "Continue"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Footer Text */}
          <div className="text-center mb-8">
            <p className="text-[#A0A0A0] text-sm">Select your mood and let AI find the perfect movies for you</p>
          </div>

          {/* Submit Button */}
          {selectedMood && !showMoodResponse && (
            <div className="flex justify-center">
              <Button
                onClick={beginSubmit}
                variant="contained"
                sx={{
                  backgroundColor: "#A855F7",
                  color: "white",
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                  padding: "12px 48px",
                  borderRadius: "0.75rem",
                  "&:hover": { backgroundColor: "#9333EA" },
                }}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
              >
                {loading ? "Finding..." : "Find Movies"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Full-screen loader while finding movies */}
      <Backdrop open={loading} sx={{ color: "#fff", zIndex: (t) => t.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
        <span style={{ marginLeft: 12 }}>Finding movies for your mood...</span>
      </Backdrop>
    </main>
  )
}
