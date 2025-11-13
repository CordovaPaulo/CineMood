"use client"
import React, { createContext, useContext, useEffect, useState } from "react";

type Prompt = { mood: string; movieIds: string[]; createdAt: string; _id?: string };

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

  const fetchFavorites = async () => {
    setLoadingFavorites(true);
    try {
      const res = await fetch("/api/recommendations/favorite");
      if (!res.ok) throw new Error("Failed to fetch favorites");
      const data = await res.json();
      setFavorites((data.prompts || []).sort((a: Prompt, b: Prompt) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (e) {
      console.error("fetchFavorites error", e);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/history");
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setHistory((data.prompts || []).sort((a: Prompt, b: Prompt) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (e) {
      console.error("fetchHistory error", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    // fetch both in parallel on mount
    fetchFavorites();
    fetchHistory();
  }, []);

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