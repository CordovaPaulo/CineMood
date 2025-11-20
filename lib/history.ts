import { toast } from "react-toastify";

export async function saveToHistory(mood: string, movieIds: number[], moodResponse?: string) {
  try {
    const response = await fetch("/api/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mood,
        movieIds: movieIds.map(id => String(id)),
        moodResponse: moodResponse || null,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => null);
      console.error("Failed to save history:", body);
      toast.error(body || "Failed to save to history.");
      return false;
    }

    // Notify listeners that history changed
    try {
      emitHistoryUpdated()
    } catch {}

    return true;
  } catch (error) {
    console.error("Error saving history:", error);
    toast.error("Error saving history. Please try again.");
    return false;
  }
}

// Emit a DOM event when history changes so UI providers can reactively refresh
export function emitHistoryUpdated() {
  try {
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("cinemood:history-updated"));
    }
  } catch (e) {
    // noop
  }
}