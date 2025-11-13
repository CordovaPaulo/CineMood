"use client"

import { useEffect, useState } from "react"
import { Alert } from "@mui/material"

export default function OfflineBanner() {
  const [offline, setOffline] = useState<boolean>(false)

  useEffect(() => {
    const update = () => setOffline(typeof navigator !== "undefined" && !navigator.onLine)
    update()
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
    }
  }, [])

  if (!offline) return null
  return (
    <div className="px-6 pt-2">
      <Alert
        severity="warning"
        sx={{
          backgroundColor: theme.card.bg,
          color: "white",
          border: "1px solid #2D2D3D",
          borderRadius: "0.75rem",
          "& .MuiAlert-icon": { color: "#F59E0B" },
        }}
      >
        You’re offline. We’ll use cached data where possible. Reconnect to get new results.
      </Alert>
    </div>
  )
}