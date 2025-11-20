import { NextRequest, NextResponse } from "next/server";
import connectdb from "@/lib/mongo";
import FavoriteModel from "@/models/favorites";
import { verifyToken, decodeToken } from "@/lib/jwt";
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    await connectdb();

    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("cinemood_auth_token");
    
    if (!tokenCookie) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const token = tokenCookie.value;
    const verification = await Promise.resolve(verifyToken(token));

    if (!verification) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Decode token to get user data
    const decoded = decodeToken(token);
    if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token payload" },
        { status: 401 }
      );
    }

    const userId = (decoded as any).userId;

    const body = await request.json();
    const { mood, movieIds } = body;

    if (!mood || !Array.isArray(movieIds)) {
      return NextResponse.json(
        { error: "Invalid request - mood and movieIds are required" },
        { status: 400 }
      );
    }

    // Find existing Favorite document or create new one
    let favorite = await FavoriteModel.findOne({ userId });

    // helper: compare two arrays as sets (ignore order)
    const sameMovieSet = (a: string[] | any[], b: string[] | any[]) => {
      if (!Array.isArray(a) || !Array.isArray(b)) return false;
      if (a.length !== b.length) return false;
      const sa = new Set(a.map(String));
      return b.every((x) => sa.has(String(x)));
    };

    if (!favorite) {
      // Create new Favorite document
      favorite = new FavoriteModel({
        userId,
        prompts: [{ mood, movieIds, createdAt: new Date() }],
      });
    } else {
      // Avoid adding duplicates: same mood and same set of movieIds
      const already = favorite.prompts?.some((p: any) => {
        try {
          return p.mood === mood && sameMovieSet(p.movieIds || [], movieIds || []);
        } catch (e) {
          return false;
        }
      });

      if (already) {
        return NextResponse.json(
          { message: "Favorites already saved for this selection" },
          { status: 409 }
        );
      }

      // Add new prompt entry
      favorite.prompts.push({
        mood,
        movieIds,
        createdAt: new Date(),
      });
    }

    await favorite.save();

    return NextResponse.json(
      { message: "Favorite saved successfully", FavoriteId: favorite._id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving Favorite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectdb();

    // Get user from cookie (same pattern as auth route)
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("cinemood_auth_token");
    
    if (!tokenCookie) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const token = tokenCookie.value;
    const verification = await Promise.resolve(verifyToken(token));

    if (!verification) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Decode token to get user data
    const decoded = decodeToken(token);
    if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token payload" },
        { status: 401 }
      );
    }

    const userId = (decoded as any).userId;

    const Favorite = await FavoriteModel.findOne({ userId });

    if (!Favorite) {
      return NextResponse.json(
        { prompts: [] },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { prompts: Favorite.prompts },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching Favorite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectdb();

    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("cinemood_auth_token");
    if (!tokenCookie) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }

    const token = tokenCookie.value;
    const verification = await Promise.resolve(verifyToken(token));
    if (!verification) {
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
    }

    const decoded = decodeToken(token);
    if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
      return NextResponse.json({ error: "Unauthorized - Invalid token payload" }, { status: 401 });
    }

    const userId = (decoded as any).userId;

    const body = await request.json().catch(() => ({}));
    const { mood, movieIds } = body;

    if (!mood || !Array.isArray(movieIds)) {
      return NextResponse.json({ error: "Invalid request - mood and movieIds are required" }, { status: 400 });
    }

    // helper: compare two arrays as sets (ignore order)
    const sameMovieSet = (a: string[] | any[], b: string[] | any[]) => {
      if (!Array.isArray(a) || !Array.isArray(b)) return false;
      if (a.length !== b.length) return false;
      const sa = new Set(a.map(String));
      return b.every((x) => sa.has(String(x)));
    };

    const favorite = await FavoriteModel.findOne({ userId });
    if (!favorite) {
      return NextResponse.json({ error: "No favorites found" }, { status: 404 });
    }

    const origLen = favorite.prompts.length;
    favorite.prompts = favorite.prompts.filter((p: any) => {
      try {
        return !(p.mood === mood && sameMovieSet(p.movieIds || [], movieIds || []));
      } catch (e) {
        return true;
      }
    });

    if (favorite.prompts.length === origLen) {
      return NextResponse.json({ error: "Favorite entry not found" }, { status: 404 });
    }

    await favorite.save();

    return NextResponse.json({ message: "Favorite deleted", prompts: favorite.prompts }, { status: 200 });
  } catch (error) {
    console.error("Error deleting favorite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}