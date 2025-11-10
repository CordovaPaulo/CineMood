"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { TextField, Button, Card, CardContent, Backdrop, CircularProgress } from "@mui/material"
import Link from "next/link"
import { Navbar } from "../../components/navbar"
import { validatePassword } from "@/utils/passwordValidation"
import { toast } from "react-toastify";
import { validateEmail } from "@/utils/validateEmail"

export default function SignupPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false) // added

  async function checkAuth() {
    const auth = await fetch("/api/auth/", { method: "GET" })
    if(auth.ok){
      // setIsLoading(false)
      // toast.info("Please log in first to get personalized recommendations.")
      return router.push("/home")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => { // make async
    e.preventDefault()
    if(!username) { toast.error("Please enter your name."); return }
    if(!email) { toast.error("Please enter your email address."); return }
    if(!password) { toast.error("Please enter your password."); return }
    if (!validateEmail(email)) { toast.error("Please enter a valid email address format."); return }
    if (!validatePassword(password)) {
      toast.error("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.")
      return
    }
    setLoading(true) // start loader
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      })
      if (res.ok) {
        toast.success("Signup successful! Please log in.")
        router.push("/")
      } else {
        toast.error("Signup failed. Please try again.")
      }
    } catch (error) {
      toast.error("An error occurred during signup. Please try again.")
    } finally {
      setLoading(false) // stop loader
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

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
            <h1 className="text-3xl font-bold text-[#b549e7] text-center mb-8">Join CineMood</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Name</label>
                <TextField
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                <label className="block text-white text-sm font-medium mb-2">Email</label>
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
                {loading ? "Signing up..." : "Sign Up"}
              </Button>
            </form>

            <p className="text-center text-[#A0A0A0] text-sm mt-6">
              Already have an account?{" "}
              <Link href="/" className="text-[#b549e7] hover:underline">
                Login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Full-screen loader */}
      <Backdrop open={loading} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
        <span style={{ marginLeft: 12 }}>Creating your account...</span>
      </Backdrop>
    </main>
  )
}
