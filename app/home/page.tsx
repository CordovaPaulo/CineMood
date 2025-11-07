"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Button,
  TextField,
  Box,
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
import OfflineBanner from "../../components/offline-banner"
import { toast } from "react-toastify"
import { motion } from "framer-motion"
import { fadeInUp, staggerContainer, fadeIn, itemTransition } from "@/lib/motion"
import { verifyClientConnectivity, isNavigatorOnline } from "@/lib/network"

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

// Helper function to infer mood from text
function inferMoodFromText(text: string): string | null {
  const TEXT_TONE_TO_MOOD: Array<{ key: string; mood: string }> = [
    { key: "sad", mood: "Sad" },
    { key: "down", mood: "Sad" },
    { key: "blue", mood: "Sad" },
    { key: "depressed", mood: "Sad" },
    { key: "angry", mood: "Angry" },
    { key: "mad", mood: "Angry" },
    { key: "frustrated", mood: "Angry" },
    { key: "furious", mood: "Angry" },
    { key: "scared", mood: "Scared" },
    { key: "afraid", mood: "Scared" },
    { key: "anxious", mood: "Scared" },
    { key: "tense", mood: "Scared" },
    { key: "excited", mood: "Excited" },
    { key: "thrilled", mood: "Excited" },
    { key: "pumped", mood: "Excited" },
    { key: "happy", mood: "Happy" },
    { key: "joyful", mood: "Happy" },
    { key: "cheerful", mood: "Happy" },
    { key: "relaxed", mood: "Relaxed" },
    { key: "calm", mood: "Relaxed" },
    { key: "chill", mood: "Relaxed" },
    { key: "nostalgic", mood: "Mysterious" },
    { key: "romantic", mood: "Romantic" },
    { key: "in love", mood: "Romantic" },
    { key: "adventurous", mood: "Adventurous" },
    { key: "mysterious", mood: "Mysterious" },
  ];

  const t = (text || "").toLowerCase();
  for (const { key, mood } of TEXT_TONE_TO_MOOD) {
    if (t.includes(key)) return mood;
  }
  return null;
}

export default function Home() {
  const router = useRouter()
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [textInput, setTextInput] = useState("")
  const [moodResponse, setMoodResponse] = useState<MoodResponseType | null>(null)
  const [showMoodResponse, setShowMoodResponse] = useState(false)
  const [loading, setLoading] = useState(false)

  // dynamic prompt length validation
  const MAX_PROMPT_LENGTH = 50

  // replace beginSubmit to defer ambiguity detection to Gemini
  const beginSubmit = () => {
    // enforce prompt length before attempting submission
    if ((textInput || "").trim().length > MAX_PROMPT_LENGTH) {
      toast.error(`Please limit your description to ${MAX_PROMPT_LENGTH} characters.`)
      return
    }
    const hasInput = !!selectedMood || !!textInput.trim()
    if (!hasInput) {
      toast.info("Please select a mood or enter a description to find movies.")
      return
    }
    if (!moodResponse) {
      setShowMoodResponse(true)
      return
    }
    submitRecommendations()
  }

  async function submitRecommendations() {
    // double-check length on submit
    if ((textInput || "").trim().length > MAX_PROMPT_LENGTH) {
      toast.error(`Please limit your description to ${MAX_PROMPT_LENGTH} characters.`)
      return
    }
    const hasInput = !!selectedMood || !!textInput.trim()
    if (!hasInput) return
    if (!moodResponse) {
      setShowMoodResponse(true)
      return
    }

    const connectivity = await verifyClientConnectivity()
    if (connectivity === "offline") {
      toast.error("You're offline. Reconnect to find new movies.")
      return
    }
    if (connectivity === "backend-down") {
      toast.error("Service is unavailable right now. Please try again shortly.")
      return
    }

    setLoading(true)

    try {
      const auth = await fetch("/api/auth/", { method: "GET" })
      if (!auth.ok) {
        setLoading(false)
        toast.info("Please log in first to get personalized recommendations.")
        return router.push("/")
      }

      // avoid reusing the name `payload` (response uses `payload`)
      const requestBody: any = {
        mood: selectedMood || "",
        moodResponse: moodResponse || "",
      }
      if ((textInput || "").trim().length > 0) requestBody.text = textInput.trim()

      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const contentType = (res.headers.get("content-type") || "").toLowerCase()
      let payload: any = null
      if (contentType.includes("application/json")) {
        payload = await res.json()
      } else {
        const text = await res.text()
        payload = { error: "non-json response", text }
      }

      // Only interpret ambiguity if we actually submitted text
      if (payload?.parsed?.ambiguous && (requestBody.text || "").trim().length > 0) {
        toast.error("Mood unclear — please be more specific in your description.")
        setLoading(false)
        return
      }

      if (!res.ok) {
        if (res.status === 503) {
          toast.error("Recommendations service is temporarily unavailable. Please try again later.")
        } else if (res.status === 502) {
          toast.error("Upstream provider error. Please retry in a moment.")
        } else if (res.status === 429) {
          toast.error("Too many requests. Please wait a bit and try again.")
        } else {
          toast.error(payload?.message || "Failed to fetch recommendations.")
        }
        setLoading(false)
        return
      }

      const fullResults = payload.results || []
      try {
        sessionStorage.setItem("recommendations_all", JSON.stringify(fullResults))
      } catch {}

      // Determine the effective mood to display
      let effectiveMood = selectedMood || inferMoodFromText(textInput) || ""
      
      // If moodResponse is "address", modify the mood display
      if (moodResponse === "address" && effectiveMood) {
        // Store both the original and the addressing mood
        sessionStorage.setItem("originalMood", effectiveMood)
        sessionStorage.setItem("addressingMood", "true")
      }

      sessionStorage.setItem("parsedData", JSON.stringify(payload.parsed || {}))
      sessionStorage.setItem("selectedMood", effectiveMood)
      sessionStorage.setItem("moodResponse", moodResponse || "")

      const sample = (() => {
        const out: any[] = []
        const src = Array.isArray(fullResults) ? fullResults.slice() : []
        for (let i = src.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[src[i], src[j]] = [src[j], src[i]]
        }
        for (let i = 0; i < Math.min(5, src.length); i++) out.push(src[i])
        return out
      })()

      try {
        ;(window as any).__CINEMOOD_RESULTS__ = sample
        ;(window as any).__CINEMOOD_RESULTS_ALL__ = fullResults
        ;(window as any).__CINEMOOD_PARSED__ = payload.parsed || {}
      } catch {}

      router.push("/results")
    } catch (error: any) {
      if (!isNavigatorOnline()) {
        toast.error("You went offline. Please reconnect and try again.")
      } else {
        toast.error("Request was blocked or failed due to a network error.")
      }
      console.error("Error occurred while fetching recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F]">
      <Navbar />
      <OfflineBanner />

      <motion.div
        className="pt-24 pb-12 px-6"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <h1 className="text-5xl font-bold text-[#B549E7] mb-3">CineMood</h1>
            <p className="text-[#A0A0A0] text-lg">How are you feeling today?</p>
          </motion.div>

          {/* Text Input with Icon and Badge */}
          <motion.div className="mb-12" variants={fadeInUp}>
            <Box
              sx={{
                position: "relative",
                backgroundColor: "#1A1A24",
                border: "1px solid #2D2D3D",
                borderRadius: "1rem",
                padding: "1rem",
                "&:hover": { borderColor: "#A855F7" },
                "&:focus-within": { borderColor: "#A855F7" },
              }}
            >
              {/* Label with Icon */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AutoAwesome sx={{ color: "#A855F7", fontSize: "1.25rem" }} />
                  <span className="text-white text-sm font-medium">Describe how you're feeling (optional)</span>
                </div>
                {/* <Chip
                  label="Voice input supported"
                  size="small"
                  sx={{
                    backgroundColor: "transparent",
                    border: "1px solid #2D2D3D",
                    color: "#A0A0A0",
                    fontSize: "0.75rem",
                    height: "24px",
                  }}
                /> */}
              </div>

              {/* Text Input */}
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="E.g., I want something uplifting but not too cheesy, or I'm feeling nostalgic about the 90s..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
                variant="standard"
                error={textInput.length > MAX_PROMPT_LENGTH}
                inputProps={{ maxLength: MAX_PROMPT_LENGTH }}
                sx={{
                  "& .MuiInput-root": {
                    color: "white",
                    "&:before": { borderBottom: "none" },
                    "&:hover:before": { borderBottom: "none" },
                    "&:after": { borderBottom: "none" },
                  },
                  "& .MuiInput-input::placeholder": {
                    color: "#A0A0A0",
                    opacity: 0.7,
                  },
                }}
              />
              <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                <span
                  style={{
                    color: textInput.length > MAX_PROMPT_LENGTH ? "#F87171" : "#9CA3AF",
                    fontSize: 13,
                    margin: 0,
                  }}
                >
                  {textInput.length}/{MAX_PROMPT_LENGTH} characters
                </span>
              </div>
              <div style={{ marginTop: 8 }}>
                <p style={{ color: "#9CA3AF", fontSize: 13, margin: 0 }}>
                  You can also find movies using only text — we’ll still ask how they should relate to your mood.
                </p>
              </div>
            </Box>
          </motion.div>

          {/* Mood Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {moods.map((mood, idx) => (
              <motion.div
                key={mood.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={itemTransition(idx)}
              >
                <MoodCard
                  emoji={mood.emoji}
                  label={mood.label}
                  description={mood.description}
                  isSelected={selectedMood === mood.label}
                  onClick={() => setSelectedMood(mood.label)}
                />
              </motion.div>
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
          <motion.div
            className="text-center mb-8"
            initial="hidden"
            animate="show"
            variants={fadeIn}
          >
            <p className="text-[#A0A0A0] text-sm">
              Select your mood and let AI find the perfect movies for you
            </p>
          </motion.div>

          {/* Submit Button */}
          {(selectedMood || textInput.trim()) && !showMoodResponse && (
            <motion.div
              className="flex justify-center"
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
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
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Full-screen loader while finding movies */}
      <Backdrop open={loading} sx={{ color: "#fff", zIndex: (t) => t.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
        <span style={{ marginLeft: 12 }}>Finding movies for your mood...</span>
      </Backdrop>
    </main>
  )
}
