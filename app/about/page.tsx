"use client"

import { Card, CardContent } from "@mui/material"
import { Favorite, AutoAwesome, Bolt } from "@mui/icons-material"
import { Navbar } from "../../components/navbar"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0F]">
      <Navbar />

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h1 className="text-5xl font-bold text-[#A855F7] text-center mb-12">About CineMood</h1>

          {/* Description */}
          <Card
            sx={{
              backgroundColor: "#1A1A24",
              border: "1px solid #2D2D3D",
              borderRadius: "1rem",
              marginBottom: "3rem",
            }}
          >
            <CardContent className="py-8 px-8">
              <p className="text-[#A0A0A0] text-lg leading-relaxed mb-4">
                CineMood is your personal movie companion that understands how you feel. We believe that the perfect
                movie can transform your mood, inspire you, or simply give you the escape you need.
              </p>
              <p className="text-[#A0A0A0] text-lg leading-relaxed">
                Select your mood or describe how you're feeling, and we'll find the perfect movies that match your
                emotional state.
              </p>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card
              sx={{
                backgroundColor: "#1A1A24",
                border: "1px solid #2D2D3D",
                borderRadius: "1rem",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: "#A855F7",
                  boxShadow: "0 0 15px rgba(168, 85, 247, 0.3)",
                },
              }}
            >
              <CardContent className="flex flex-col items-center text-center py-8">
                <Favorite sx={{ fontSize: "2.5rem", color: "#A855F7", marginBottom: "1rem" }} />
                <h3 className="text-white font-semibold text-lg mb-2">Mood-Based</h3>
                <p className="text-[#A0A0A0] text-sm">
                  Our algorithm matches movies to your current emotional state for the perfect viewing experience.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card
              sx={{
                backgroundColor: "#1A1A24",
                border: "1px solid #2D2D3D",
                borderRadius: "1rem",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: "#A855F7",
                  boxShadow: "0 0 15px rgba(168, 85, 247, 0.3)",
                },
              }}
            >
              <CardContent className="flex flex-col items-center text-center py-8">
                <AutoAwesome sx={{ fontSize: "2.5rem", color: "#A855F7", marginBottom: "1rem" }} />
                <h3 className="text-white font-semibold text-lg mb-2">Personalized</h3>
                <p className="text-[#A0A0A0] text-sm">
                  Save your favorites and build a history of moods and movies that resonate with you.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card
              sx={{
                backgroundColor: "#1A1A24",
                border: "1px solid #2D2D3D",
                borderRadius: "1rem",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: "#A855F7",
                  boxShadow: "0 0 15px rgba(168, 85, 247, 0.3)",
                },
              }}
            >
              <CardContent className="flex flex-col items-center text-center py-8">
                <Bolt sx={{ fontSize: "2.5rem", color: "#A855F7", marginBottom: "1rem" }} />
                <h3 className="text-white font-semibold text-lg mb-2">Instant Results</h3>
                <p className="text-[#A0A0A0] text-sm">
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
