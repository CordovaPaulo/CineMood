"use client"

import React from "react"
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material"
import { useTheme } from "@/contexts/theme-context"
import { getContrastText, hexToRgba } from "@/lib/mood-colors"

export type ConfirmDialogProps = {
  open: boolean
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => Promise<void> | void
  onClose: () => void
}

export default function ConfirmDialog({ open, title = "Confirm", description = "Are you sure?", confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onClose }: ConfirmDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const { theme } = useTheme()

  const handleConfirm = async () => {
    try {
      setLoading(true)
      await onConfirm()
    } finally {
      setLoading(false)
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          backgroundColor: theme.card.bg,
          color: theme.text.primary,
          borderRadius: "1rem",
          border: `1px solid ${theme.card.border}`,
        },
      }}
    >
      <DialogTitle sx={{ color: theme.text.primary, fontWeight: 600 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: theme.text.secondary }}>{description}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: "none",
            color: theme.text.primary,
            borderColor: theme.card.border,
            '&:hover': { backgroundColor: hexToRgba(theme.primary, 0.06) },
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          sx={{
            textTransform: "none",
            backgroundColor: theme.primary,
            color: getContrastText(theme.primary),
            '&:hover': { backgroundColor: theme.primaryDark },
          }}
          disabled={loading}
        >
          {loading ? "Working..." : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
