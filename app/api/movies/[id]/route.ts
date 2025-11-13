import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id: movieId } = await context.params;

    console.log("Fetching movie details for ID:", movieId);

    if (!TMDB_API_KEY) {
      console.error("TMDB_API_KEY is not configured");
      return NextResponse.json(
        { error: "TMDB API key not configured" },
        { status: 500 }
      );
    }

    const url = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=videos`;
    console.log("Fetching from URL:", url.replace(TMDB_API_KEY, "***"));

    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: {
        'Accept': 'application/json',
      }
    });

    console.log("TMDB Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TMDB API error:", response.status, errorText);
      
      return NextResponse.json(
        { 
          error: `TMDB API error: ${response.status}`,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Successfully fetched movie:", data.title);

    // Extract YouTube trailer
    const trailer = data.videos?.results?.find(
      (v: any) => v.type === "Trailer" && v.site === "YouTube"
    );

    const result = {
      id: data.id,
      title: data.title,
      overview: data.overview,
      poster_path: data.poster_path ? `${TMDB_IMAGE_BASE_URL}${data.poster_path}` : null,
      vote_average: data.vote_average,
      release_date: data.release_date,
      trailer_youtube_id: trailer?.key || null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching movie details:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch movie details",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}