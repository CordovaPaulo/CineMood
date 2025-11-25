"use client"

import React, { useEffect, useRef, useState } from "react"
import { IconButton, Tooltip } from "@mui/material"
import { Mic, MicOff } from "@mui/icons-material"
import { toast } from "react-toastify"
import { getSpeechRecognition, isSpeechRecognitionSupported } from "@/utils/voice"
import { useTheme } from "@/contexts/theme-context"

export type VoiceInputProps = {
  onTranscript: (text: string, interim?: boolean) => void
  /** maximum listening duration in milliseconds (defaults to 60000 = 60s) */
  maxListeningMs?: number
}

export default function VoiceInput({ onTranscript }: VoiceInputProps) {
  const { theme } = useTheme()
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState<boolean | null>(null)
  const recognitionRef = useRef<any | null>(null)
  const timerRef = useRef<number | null>(null)
  const { maxListeningMs = 60000 } = ({} as VoiceInputProps)


  useEffect(() => {
    setSupported(isSpeechRecognitionSupported())
  }, [])

  useEffect(() => {
    return () => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.onresult = null
          recognitionRef.current.onerror = null
          recognitionRef.current.onend = null
          recognitionRef.current.stop()
        }
      } catch (e) {}
    }
  }, [])

  function startListening() {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) {
      setSupported(false)
      toast.info("Speech recognition is not supported in this browser.")
      return
    }

    try {
      const recog = new SpeechRecognition()
      // Allow continuous listening so the user can speak longer phrases
      recog.continuous = true
      recog.interimResults = true
      recog.lang = navigator.language || "en-US"

      recog.onstart = () => {
        setListening(true)
        // enforce a maximum listening duration as a safety
        try {
          if (timerRef.current) window.clearTimeout(timerRef.current)
          // window.setTimeout returns a number
          timerRef.current = window.setTimeout(() => {
            try {
              recog.stop()
            } catch (e) {}
            setListening(false)
            toast.info("Stopped listening after maximum duration.")
          }, maxListeningMs) as unknown as number
        } catch (e) {
          console.warn("Could not set max listening timeout", e)
        }
      }

      recog.onresult = (event: any) => {
        let interim = ""
        let final = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i]
          if (res.isFinal) final += res[0].transcript
          else interim += res[0].transcript
        }
        if (interim) onTranscript(interim, true)
        if (final) onTranscript(final, false)
      }

      recog.onerror = (ev: any) => {
        console.error("SpeechRecognition error", ev)
        toast.error("Speech recognition error.")
        setListening(false)
      }

      recog.onend = () => {
        setListening(false)
        if (timerRef.current) {
          window.clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }

      recognitionRef.current = recog
      recog.start()
    } catch (err) {
      console.error("startListening failed", err)
      toast.error("Unable to start microphone — please check permissions.")
      setListening(false)
    }
  }

  function stopListening() {
    try {
      if (recognitionRef.current) recognitionRef.current.stop()
    } catch (e) {
      console.error(e)
    } finally {
      setListening(false)
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const toggle = () => {
    if (!supported) {
      toast.info("Speech recognition not available in this browser.")
      return
    }
    if (listening) stopListening()
    else startListening()
  }

  if (supported === false) return null

  return (
    <Tooltip title={listening ? "Stop listening" : "Use voice input"}>
      <IconButton
        onClick={toggle}
        sx={{
          color: theme.primary,
          backgroundColor: listening ? theme.primary : "transparent",
          border: listening ? `1px solid ${theme.primaryDark}` : "none",
          "&:hover": { backgroundColor: listening ? theme.primaryDark : "rgba(0,0,0,0.04)" },
        }}
        aria-label={listening ? "Stop voice input" : "Start voice input"}
      >
        {listening ? <Mic /> : <MicOff />}
      </IconButton>
    </Tooltip>
  )
}
