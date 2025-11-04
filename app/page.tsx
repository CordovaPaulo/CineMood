"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TextField, Button, Card, CardContent, Backdrop, CircularProgress } from "@mui/material"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { toast } from "react-toastify"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false) // added

  const handleSubmit = async (e: React.FormEvent) => { // make async
    e.preventDefault()
    setLoading(true) // start loader
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        toast.success("Login successful!")
        router.push("/home")
      } else if (res.status === 404) {
        toast.error("User not found.")
      } else if (res.status === 401) {
        toast.error("Invalid Email or Password.")
      } else {
        toast.error("Login failed. Please try again.")
      }
    } catch (error) {
      toast.error("An error occurred during login. Please try again.")
    } finally {
      setLoading(false) // stop loader
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0B0F] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-6 pt-20">
        <Card
          sx={{
            backgroundColor: "#1A1A24",
            border: "1px solid #2D2D3D",
            borderRadius: "1rem",
            width: "100%",
            maxWidth: "400px",
          }}
        >
          <CardContent className="py-12 px-8">
            <h1 className="text-3xl font-bold text-[#b549e7] text-center mb-8">Welcome Back</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Username/Email</label>
                <TextField
                  fullWidth
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading} // disable during loading
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      backgroundColor: "#0B0B0F",
                      borderRadius: "0.5rem",
                      "& fieldset": { borderColor: "#2D2D3D" },
                      "&:hover fieldset": { borderColor: "#b549e7" },
                      "&.Mui-focused fieldset": { borderColor: "#b549e7" },
                    },
                  }}
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Password</label>
                <TextField
                  fullWidth
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading} // disable during loading
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      backgroundColor: "#0B0B0F",
                      borderRadius: "0.5rem",
                      "& fieldset": { borderColor: "#2D2D3D" },
                      "&:hover fieldset": { borderColor: "#b549e7" },
                      "&.Mui-focused fieldset": { borderColor: "#b549e7" },
                    },
                  }}
                />
              </div>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
                sx={{
                  backgroundColor: "#b549e7",
                  color: "white",
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                  padding: "12px",
                  borderRadius: "0.5rem",
                  marginTop: "1rem",
                  "&:hover": { backgroundColor: "#9333EA" },
                }}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <p className="text-center text-[#A0A0A0] text-sm mt-6">
              Don't have an account?{" "}
              <Link href="/signup" className="text-[#b549e7] hover:underline">
                Sign Up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Full-screen loader */}
      <Backdrop open={loading} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
        <span style={{ marginLeft: 12 }}>Logging in...</span>
      </Backdrop>
    </main>
  )
}
