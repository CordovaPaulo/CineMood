"use client"

import React from "react"

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
  return (
    <div className={["flex gap-3", className].filter(Boolean).join(" ")}>
      <button
        className={`px-4 py-2 rounded ${value === "match" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-200"}`}
        onClick={() => onChange?.("match")}
        type="button"
      >
        Match my mood
      </button>
      <button
        className={`px-4 py-2 rounded ${value === "address" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-200"}`}
        onClick={() => onChange?.("address")}
        type="button"
      >
        Help change my mood
      </button>
    </div>
  )
}

