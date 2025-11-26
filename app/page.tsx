"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TextField, Button, Card, CardContent, Backdrop, CircularProgress, IconButton, InputAdornment } from "@mui/material"
import { Visibility, VisibilityOff } from "@mui/icons-material"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { toast } from "react-toastify"
import { useTheme } from "@/contexts/theme-context"

export default function LoginPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false) // added
  const [showPassword, setShowPassword] = useState(false)

  async function checkAuth() {
      const auth = await fetch("/api/auth/", { method: "GET" })
      if(auth.ok){
        return router.push("/home")
      }
    }

    useEffect(() => {
      checkAuth()
    }, [])

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
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: theme.background.base, transition: "background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-6 pt-20">
        <Card
          sx={{
            backgroundColor: theme.card.bg,
            border: "1px solid #2D2D3D",
            borderRadius: "1rem",
            width: "100%",
            maxWidth: "400px",
          }}
        >
          <CardContent className="py-12 px-8">
            <h1 className="text-3xl font-bold text-center mb-8" style={{ color: theme.primary }}>Welcome Back</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username/Email field */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: theme.text.primary }}>Username/Email</label>
                <TextField
                  fullWidth
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: theme.text.primary,
                      backgroundColor: theme.background.base,
                      borderRadius: "0.5rem",
                      "& fieldset": { borderColor: theme.card.border },
                      "&:hover fieldset": { borderColor: theme.primary },
                      "&.Mui-focused fieldset": { borderColor: theme.primary },
                    },
                  }}
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Password</label>
                <TextField
                  fullWidth
                  // type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  disabled={loading}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: theme.text.primary,
                      backgroundColor: theme.background.base,
                      borderRadius: "0.5rem",
                      "& fieldset": { borderColor: theme.card.border },
                      "&:hover fieldset": { borderColor: theme.primary },
                      "&.Mui-focused fieldset": { borderColor: theme.primary },
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowPassword((s) => !s)}
                          edge="end"
                          disableRipple
                          sx={{ color: theme.text.secondary }}
                        >
                          {showPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
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
                  backgroundColor: theme.primary,
                  color: "white",
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                  padding: "12px",
                  borderRadius: "0.5rem",
                  marginTop: "1rem",
                  transition: "all 0.3s ease",
                  "&:hover": { backgroundColor: theme.primaryDark },
                }}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <p className="text-center text-sm mt-6" style={{ color: theme.text.secondary }}>
              Don't have an account?{" "}
              <Link href="/signup" className="hover:underline" style={{ color: theme.primary }}>
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
