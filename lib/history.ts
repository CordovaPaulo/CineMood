export async function saveToHistory(mood: string, movieIds: number[]) {
  try {
    const response = await fetch("/api/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mood,
        movieIds: movieIds.map(id => String(id)),
      }),
    });

    if (!response.ok) {
      console.error("Failed to save history:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error saving history:", error);
    return false;
  }
}