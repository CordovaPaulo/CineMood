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
        <Link href="/" className="text-2xl font-bold text-[#b549e7]">
          CineMood
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-2">
          <Link href="/home">
            <Button
              variant={pathname === "/home" ? "contained" : "text"}
              sx={{
                color: pathname === "/home" ? "white" : "#A0A0A0",
                backgroundColor: pathname === "/home" ? "#b549e7" : "transparent",
                textTransform: "none",
                fontSize: "0.95rem",
                "&:hover": {
                  backgroundColor: pathname === "/home" ? "#9333EA" : "rgba(168, 85, 247, 0.1)",
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
                color: pathname === "/about" ? "white" : "#A0A0A0",
                backgroundColor: pathname === "/about" ? "#b549e7" : "transparent",
                textTransform: "none",
                fontSize: "0.95rem",
                "&:hover": {
                  backgroundColor: pathname === "/about" ? "#9333EA" : "rgba(181, 73, 231, 0.1)",
                },
              }}
            >
              About
            </Button>
          </Link>

          <Link href={pathname === "/" ? "/signup" : "/"}>
            <Button
              variant={pathname === "/" || pathname === "/signup" ? "contained" : "outlined"}
              sx={{
                color: "white",
                borderColor: "#b549e7",
                backgroundColor: pathname === "/" || pathname === "/signup" ? "#b549e7" : "transparent",
                textTransform: "none",
                fontSize: "0.95rem",
                "&:hover": {
                  backgroundColor: pathname === "/" || pathname === "/signup" ? "#9333EA" : "rgba(168, 85, 247, 0.1)",
                  borderColor: "#b549e7",
                },
              }}
            >
              {pathname === "/" ? "Sign Up" : "Login"}
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
