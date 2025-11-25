"use client"

export function getSpeechRecognition(): any | null {
  if (typeof window === "undefined") return null
  // Chrome/WebKit use webkitSpeechRecognition
  const win: any = window
  return win.SpeechRecognition || win.webkitSpeechRecognition || null
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognition() !== null
}
