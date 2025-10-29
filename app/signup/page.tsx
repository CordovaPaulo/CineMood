"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TextField, Button, Card, CardContent } from "@mui/material"
import Link from "next/link"
import { Navbar } from "../../components/navbar"
import { validatePassword } from "@/utils/passwordValidation"
import { showToast } from "@/utils/toastify"

export default function SignupPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatePassword(password)) {
      showToast(
        "Password must be at least 8 characters long and include 1 uppercase, 1 lowercase, 1 number, and 1 special character.",
        "error"
      )
      return
    }
    try {
      fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    })
    .then((res) => {
      if (res.ok) {
        showToast("Signup successful!", "success")
        router.push("/")
      }
    })
    } catch (error) {
      showToast("An error occurred during signup. Please try again.", "error")
      return
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
            <h1 className="text-3xl font-bold text-[#b549e7] text-center mb-8">Join CineMood</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Name</label>
                <TextField
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      backgroundColor: "#0B0B0F",
                      borderRadius: "0.5rem",
                      "& fieldset": {
                        borderColor: "#2D2D3D",
                      },
                      "&:hover fieldset": {
                        borderColor: "#b549e7",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#b549e7",
                      },
                    },
                  }}
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Email</label>
                <TextField
                  fullWidth
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      backgroundColor: "#0B0B0F",
                      borderRadius: "0.5rem",
                      "& fieldset": {
                        borderColor: "#2D2D3D",
                      },
                      "&:hover fieldset": {
                        borderColor: "#b549e7",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#b549e7",
                      },
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
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      backgroundColor: "#0B0B0F",
                      borderRadius: "0.5rem",
                      "& fieldset": {
                        borderColor: "#2D2D3D",
                      },
                      "&:hover fieldset": {
                        borderColor: "#b549e7",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#b549e7",
                      },
                    },
                  }}
                />
              </div>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                sx={{
                  backgroundColor: "#b549e7",
                  color: "white",
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                  padding: "12px",
                  borderRadius: "0.5rem",
                  marginTop: "1rem",
                  "&:hover": {
                    backgroundColor: "#9333EA",
                  },
                }}
              >
                Sign Up
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
    </main>
  )
}
