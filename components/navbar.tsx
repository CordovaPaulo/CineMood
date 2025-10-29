"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@mui/material"

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0B0F]/80 backdrop-blur-md border-b border-[#2D2D3D]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-[#A855F7]">
          CineMood
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button
              variant={pathname === "/" ? "contained" : "text"}
              sx={{
                color: pathname === "/" ? "white" : "#A0A0A0",
                backgroundColor: pathname === "/" ? "#A855F7" : "transparent",
                textTransform: "none",
                fontSize: "0.95rem",
                "&:hover": {
                  backgroundColor: pathname === "/" ? "#9333EA" : "rgba(168, 85, 247, 0.1)",
                },
              }}
            >
              Home
            </Button>
          </Link>

          <Link href="/about">
            <Button
              variant="text"
              sx={{
                color: pathname === "/about" ? "#A855F7" : "#A0A0A0",
                textTransform: "none",
                fontSize: "0.95rem",
                "&:hover": {
                  backgroundColor: "rgba(168, 85, 247, 0.1)",
                },
              }}
            >
              About
            </Button>
          </Link>

          <Link href="/login">
            <Button
              variant={pathname === "/login" ? "contained" : "outlined"}
              sx={{
                color: "white",
                borderColor: "#A855F7",
                backgroundColor: pathname === "/login" ? "#A855F7" : "transparent",
                textTransform: "none",
                fontSize: "0.95rem",
                "&:hover": {
                  backgroundColor: pathname === "/login" ? "#9333EA" : "rgba(168, 85, 247, 0.1)",
                  borderColor: "#A855F7",
                },
              }}
            >
              Login
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
