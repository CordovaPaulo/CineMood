"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button, Menu, MenuItem } from "@mui/material"
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { easeOut, itemTransition } from "@/lib/motion"

export function Navbar() {
  const pathname = usePathname()
  const [userName, setUserName] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

  // Fetch session (reads cinemood_auth_token on server)
  useEffect(() => {
    const abort = new AbortController()
    async function load() {
      try {
        const res = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: abort.signal,
        })
        if (!res.ok) {
          setUserName(null)
          setReady(true)
          return
        }
        const data = await res.json()
        const name =
          data?.user?.name ??
          (data?.user?.email ? String(data.user.email).split("@")[0] : null)
        setUserName(name ?? null)
      } catch {
        if (!abort.signal.aborted) setUserName(null)
      } finally {
        if (!abort.signal.aborted) setReady(true)
      }
    }
    load()
    return () => abort.abort()
  }, [pathname])

  return (
    <motion.nav
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#0B0B0F]/80 backdrop-blur-md border-b border-[#2D2D3D]"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-[#b549e7]">
          CineMood
        </Link>

        {/* Right actions */}
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

          {/* Dynamic Login / Username with reliable animation */}
          <AnimatePresence mode="wait" initial={false}>
            {!ready ? (
              // Small placeholder to avoid layout jump while fetching session
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                transition={itemTransition(0)}
                className="h-9 w-20 rounded-md bg-[#2D2D3D]"
              />
            ) : userName ? (
              <motion.div
                key="user"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={itemTransition(0)}
              >
                <Button
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                  variant="outlined"
                  sx={{
                    color: "white",
                    borderColor: "#b549e7",
                    textTransform: "none",
                    fontSize: "0.95rem",
                    "&:hover": { backgroundColor: "rgba(181, 73, 231, 0.1)" },
                  }}
                >
                  {userName}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={itemTransition(0)}
              >
                <Link href={pathname === "/" ? "/signup" : "/"}>
                  <Button
                    variant={pathname === "/" || pathname === "/signup" ? "contained" : "outlined"}
                    sx={{
                      color: "white",
                      borderColor: "#b549e7",
                      backgroundColor:
                        pathname === "/" || pathname === "/signup" ? "#b549e7" : "transparent",
                      textTransform: "none",
                      fontSize: "0.95rem",
                      "&:hover": {
                        backgroundColor:
                          pathname === "/" || pathname === "/signup"
                            ? "#9333EA"
                            : "rgba(168, 85, 247, 0.1)",
                        borderColor: "#b549e7",
                      },
                    }}
                  >
                    {pathname === "/" ? "Sign Up" : "Login"}
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User menu */}
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            <MenuItem
              onClick={async () => {
                setMenuAnchor(null)
                if (!confirm("Log out of CineMood?")) return
                try {
                  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
                } finally {
                  setUserName(null)
                  // Refresh to let middleware/session reflect cleared cookie
                  location.href = "/"
                }
              }}
            >
              Logout
            </MenuItem>
          </Menu>
        </div>
      </div>
    </motion.nav>
  )
}
