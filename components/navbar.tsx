"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button, Menu, MenuItem, IconButton, Tooltip } from "@mui/material"
import { LightMode, DarkMode } from "@mui/icons-material"
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { easeOut, itemTransition } from "@/lib/motion"
import { useTheme } from "@/contexts/theme-context"
import { hexToRgba } from "@/lib/mood-colors"
import { getContrastText } from "@/lib/mood-colors"

export function Navbar() {
  const pathname = usePathname()
  const { theme, mode, toggleMode } = useTheme()
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
      style={{
        backgroundColor: hexToRgba(theme.card.bg, 0.92),
        borderBottomColor: theme.card.border,
        transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold" style={{ color: theme.primary, transition: "color 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
          CineMood
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Theme Mode Toggle */}
          <Tooltip title={mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <IconButton
              onClick={toggleMode}
              sx={{
                color: theme.primary,
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: hexToRgba(theme.primary, 0.1),
                },
              }}
            >
              {mode === "dark" ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>

          <Link href="/home">
            <Button
              variant={pathname === "/home" ? "contained" : "text"}
              sx={{
                color: pathname === "/home" ? getContrastText(theme.primary) : theme.text.secondary,
                backgroundColor: pathname === "/home" ? theme.primary : "transparent",
                textTransform: "none",
                fontSize: "0.95rem",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: pathname === "/home" ? theme.primaryDark : hexToRgba(theme.primary, 0.1),
                },
              }}
            >
              Home
            </Button>
          </Link>

          <Link href='/favorites'>
            <Button
              variant={pathname === "/favorites" ? "contained" : "text"}
              sx={{
                color: pathname === "/favorites" ? getContrastText(theme.primary) : theme.text.secondary,
                backgroundColor: pathname === "/favorites" ? theme.primary : "transparent",
                textTransform: "none",
                fontSize: "0.95rem",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: pathname === "/favorites" ? theme.primaryDark : hexToRgba(theme.primary, 0.1),
                },
              }}
            >
              Favorites
            </Button>
          </Link>

          <Link href='/history'>
            <Button
              variant={pathname === "/history" ? "contained" : "text"}
              sx={{
                color: pathname === "/history" ? getContrastText(theme.primary) : theme.text.secondary,
                backgroundColor: pathname === "/history" ? theme.primary : "transparent",
                textTransform: "none",
                fontSize: "0.95rem",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: pathname === "/history" ? theme.primaryDark : hexToRgba(theme.primary, 0.1),
                },
              }}
            >
              History
            </Button>
          </Link>

          <Link href="/about">
            <Button
              variant="text"
              sx={{
                color: pathname === "/about" ? getContrastText(theme.primary) : theme.text.secondary,
                backgroundColor: pathname === "/about" ? theme.primary : "transparent",
                textTransform: "none",
                fontSize: "0.95rem",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: pathname === "/about" ? theme.primaryDark : hexToRgba(theme.primary, 0.1),
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
                style={{ height: 36, width: 80, borderRadius: 8, backgroundColor: theme.card.bg }}
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
                    color: theme.text.primary,
                    borderColor: theme.primary,
                    textTransform: "none",
                    fontSize: "0.95rem",
                    transition: "all 0.3s ease",
                    "&:hover": { backgroundColor: hexToRgba(theme.primary, 0.1) },
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
                      color: (pathname === "/" || pathname === "/signup") ? getContrastText(theme.primary) : theme.text.primary,
                      borderColor: theme.primary,
                      backgroundColor:
                        pathname === "/" || pathname === "/signup" ? theme.primary : "transparent",
                      textTransform: "none",
                      fontSize: "0.95rem",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        backgroundColor:
                          pathname === "/" || pathname === "/signup"
                            ? theme.primaryDark
                            : hexToRgba(theme.primary, 0.1),
                        borderColor: theme.primary,
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
