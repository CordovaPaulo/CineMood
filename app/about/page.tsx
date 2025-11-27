"use client"

import { Card, CardContent } from "@mui/material"
import { Favorite, AutoAwesome, Bolt } from "@mui/icons-material"
import { Navbar } from "../../components/navbar"
import { useTheme } from "@/contexts/theme-context"

export default function AboutPage() {
  const { theme } = useTheme()
  return (
    <main className="min-h-screen" style={{ backgroundColor: theme.background.base, transition: "background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
      <Navbar />

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h1 className="text-5xl font-bold text-center mb-12" style={{ color: theme.primary, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>About CineMood</h1>

          {/* Description */}
          <Card
            sx={{
               backgroundColor: theme.card.bg,
              border: `1px solid ${theme.card.border}`,
              borderRadius: "1rem",
              transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                borderColor: theme.primary,
                boxShadow: `0 0 15px ${theme.primary}4D`,
                transform: "translateY(-2px)",
              },
              marginBottom: "3rem",
            }}
          >
            <CardContent className="py-8 px-8">
              <p className="text-lg leading-relaxed mb-4" style={{ color: theme.text.primary }}>
                CineMood is an AI-powered movie companion that understands your emotions and recommends films based on how you feel. Using sentiment analysis, it can match your current mood or help you shift it—whether you want comfort, inspiration, or escape.
              </p>
              <p className="text-lg leading-relaxed" style={{ color: theme.text.secondary }}>
                Just tap an emoji or describe your mood, and CineMood instantly delivers personalized, emotion-aware movie suggestions. Enjoy a faster, more meaningful way to choose what to watch.
              </p>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card
              sx={{
                backgroundColor: theme.card.bg,
                border: `1px solid ${theme.card.border}`,
                borderRadius: "1rem",
                transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  borderColor: theme.primary,
                  boxShadow: `0 0 15px ${theme.primary}4D`,
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardContent className="flex flex-col items-center text-center py-8">
                <Favorite sx={{ fontSize: "2.5rem", color: theme.primary, marginBottom: "1rem", transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                <h3 className="font-semibold text-lg mb-2" style={{ color: theme.text.primary, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>Mood-Based</h3>
                <p className="text-sm" style={{ color: theme.text.secondary, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                  Our algorithm matches movies to your current emotional state for the perfect viewing experience.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card
              sx={{
                backgroundColor: theme.card.bg,
                border: `1px solid ${theme.card.border}`,
                borderRadius: "1rem",
                transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  borderColor: theme.primary,
                  boxShadow: `0 0 15px ${theme.primary}4D`,
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardContent className="flex flex-col items-center text-center py-8">
                <AutoAwesome sx={{ fontSize: "2.5rem", color: theme.primary, marginBottom: "1rem", transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                <h3 className="font-semibold text-lg mb-2" style={{ color: theme.text.primary, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>Personalized</h3>
                <p className="text-sm" style={{ color: theme.text.secondary, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                  Save your favorites and build a history of moods and movies that resonate with you.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card
              sx={{
                backgroundColor: theme.card.bg,
                border: `1px solid ${theme.card.border}`,
                borderRadius: "1rem",
                transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  borderColor: theme.primary,
                  boxShadow: `0 0 15px ${theme.primary}4D`,
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardContent className="flex flex-col items-center text-center py-8">
                <Bolt sx={{ fontSize: "2.5rem", color: theme.primary, marginBottom: "1rem", transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                <h3 className="font-semibold text-lg mb-2" style={{ color: theme.text.primary, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>Instant Results</h3>
                <p className="text-sm" style={{ color: theme.text.secondary, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                  Get movie recommendations in seconds. Refresh anytime to discover more options.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
