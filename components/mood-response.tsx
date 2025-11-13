"use client"

import React from "react"
import { useTheme } from "@/contexts/theme-context"

type MoodResponseType = "match" | "address"

export default function MoodResponse({
  value,
  onChange,
  className,
}: {
  value?: MoodResponseType | null
  onChange?: (v: MoodResponseType) => void
  className?: string
}) {
  const { theme } = useTheme()
  
  return (
    <div className={["flex gap-3", className].filter(Boolean).join(" ")}>
      <button
        className="px-4 py-2 rounded transition-all duration-300"
        style={{
          backgroundColor: value === "match" ? theme.primary : theme.card.bg,
          color: "white",
          border: `1px solid ${value === "match" ? theme.primary : theme.card.border}`,
        }}
        onClick={() => onChange?.("match")}
        type="button"
      >
        Match my mood
      </button>
      <button
        className="px-4 py-2 rounded"
        style={{
          transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          backgroundColor: value === "address" ? theme.primary : theme.card.bg,
          color: "white",
          border: `1px solid ${value === "address" ? theme.primary : theme.card.border}`,
        }}
        onClick={() => onChange?.("address")}
        type="button"
      >
        Help change my mood
      </button>
    </div>
  )
}

