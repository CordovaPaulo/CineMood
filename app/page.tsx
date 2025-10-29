"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, TextField, Box, Chip } from "@mui/material"
import { AutoAwesome } from "@mui/icons-material"
import { Navbar } from "@/components/navbar"
import { MoodCard } from "@/components/mood-card"

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

  const handleSubmit = () => {
    if (selectedMood) {
      sessionStorage.setItem("selectedMood", selectedMood)
      sessionStorage.setItem("moodDescription", textInput)
      router.push("/results")
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F]">
      <Navbar />

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-[#A855F7] mb-3">CineMood</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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

          {/* Footer Text */}
          <div className="text-center mb-8">
            <p className="text-[#A0A0A0] text-sm">Select your mood and let AI find the perfect movies for you</p>
          </div>

          {/* Submit Button */}
          {selectedMood && (
            <div className="flex justify-center">
              <Button
                onClick={handleSubmit}
                variant="contained"
                sx={{
                  backgroundColor: "#A855F7",
                  color: "white",
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                  padding: "12px 48px",
                  borderRadius: "0.75rem",
                  "&:hover": {
                    backgroundColor: "#9333EA",
                  },
                }}
              >
                Find Movies
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
