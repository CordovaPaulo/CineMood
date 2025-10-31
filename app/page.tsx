"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TextField, Button, Card, CardContent } from "@mui/material"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { toast } from "react-toastify"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      })
      .then((res) => {
        if (res.ok) {
          toast.success("Login successful!")
          router.push("/home")
        }
        if (res.status === 404) {
          toast.error("User not found.")
        }
        if (res.status === 401) {
          toast.error("Invalid credentials.")
        }
      })
    } catch (error) {
      toast.error("An error occurred during login. Please try again.")
    }
    // router.push("/home")
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
                Login
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
    </main>
  )
}
