"use client"
import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "react-toastify";

type Prompt = { mood: string; movieIds: string[]; createdAt: string; moodResponse?: string; _id?: string };

type ContextValue = {
  favorites: Prompt[];
  history: Prompt[];
  loadingFavorites: boolean;
  loadingHistory: boolean;
  refreshFavorites: () => Promise<void>;
  refreshHistory: () => Promise<void>;
};

const FavoritesHistoryContext = createContext<ContextValue | undefined>(undefined);

export function FavoritesHistoryProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Prompt[]>([]);
  const [history, setHistory] = useState<Prompt[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const pathname = usePathname()
  const suppressToasts = pathname === "/" || pathname === "/signup" || (typeof pathname === "string" && pathname.startsWith("/signup"))

  const fetchFavorites = async () => {
    setLoadingFavorites(true);
    // Only show favorites-related toasts when the user is on the favorites page
    const showFavoritesToasts = !suppressToasts && (pathname === "/favorites" || (typeof pathname === "string" && pathname.startsWith("/favorites")));
    try {
      const res = await fetch("/api/recommendations/favorite");
      if (!res.ok) {
        const body = await res.text().catch(() => null);
        if (showFavoritesToasts) {
          if (res.status === 401) {
            toast.info("Please log in to view your favorites.");
          } else {
            toast.error(body || "Failed to fetch favorites.");
          }
        }
        throw new Error("Failed to fetch favorites");
      }
      const data = await res.json();
      // If the API returned successfully but with no prompts (null/empty), treat as successful empty state
      const prompts = Array.isArray(data?.prompts) ? data.prompts : [];
      setFavorites(prompts.sort((a: Prompt, b: Prompt) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (e) {
      console.error("fetchFavorites error", e);
      if (showFavoritesToasts) toast.error("Unable to load favorites right now.");
    } finally {
      setLoadingFavorites(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    // Only show history-related toasts when the user is on the history page
    const showHistoryToasts = !suppressToasts && (pathname === "/history" || (typeof pathname === "string" && pathname.startsWith("/history")));
    try {
      const res = await fetch("/api/history");
      if (!res.ok) {
        const body = await res.text().catch(() => null);
        if (showHistoryToasts) {
          if (res.status === 401) {
            toast.info("Please log in to view your history.");
          } else {
            toast.error(body || "Failed to fetch history.");
          }
        }
        throw new Error("Failed to fetch history");
      }
      const data = await res.json();
      const prompts = Array.isArray(data?.prompts) ? data.prompts : [];
      setHistory(prompts.sort((a: Prompt, b: Prompt) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (e) {
      console.error("fetchHistory error", e);
      if (showHistoryToasts) toast.error("Unable to load history right now.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    // fetch both in parallel on mount
    fetchFavorites();
    fetchHistory();

    // listen for outside signals that history changed (e.g., saveToHistory)
    const onHistoryUpdated = () => {
      fetchHistory();
    };
    try {
      window.addEventListener("cinemood:history-updated", onHistoryUpdated as EventListener);
    } catch {}

    return () => {
      try {
        window.removeEventListener("cinemood:history-updated", onHistoryUpdated as EventListener);
      } catch {}
    };
  }, []);

  // When navigating to non-auth pages (e.g. after login), refetch so the
  // favorites/history reflect the newly-authenticated user without a reload.
  useEffect(() => {
    if (!pathname) return
    // If we're not on auth pages, refresh data. This covers the common
    // login flow where the app navigates away after setting the auth cookie.
    if (!suppressToasts) {
      fetchFavorites();
      fetchHistory();
    }
  }, [pathname]);

  return (
    <FavoritesHistoryContext.Provider
      value={{
        favorites,
        history,
        loadingFavorites,
        loadingHistory,
        refreshFavorites: fetchFavorites,
        refreshHistory: fetchHistory,
      }}
    >
      {children}
    </FavoritesHistoryContext.Provider>
  );
}

export function useFavoritesHistory() {
  const ctx = useContext(FavoritesHistoryContext);
  if (!ctx) throw new Error("useFavoritesHistory must be used inside FavoritesHistoryProvider");
  return ctx;
}