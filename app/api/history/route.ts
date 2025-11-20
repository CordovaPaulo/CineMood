import { NextRequest, NextResponse } from "next/server";
import connectdb from "@/lib/mongo";
import HistoryModel from "@/models/history";
import { verifyToken, decodeToken } from "@/lib/jwt";
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { mood, movieIds, moodResponse } = body;

    if (!mood || !Array.isArray(movieIds)) {
      return NextResponse.json(
        { error: "Invalid request - mood and movieIds are required" },
        { status: 400 }
      );
    }

    // Find existing history document or create new one
    let history = await HistoryModel.findOne({ userId });

    if (!history) {
      // Create new history document
      history = new HistoryModel({
        userId,
        prompts: [{ mood, movieIds, moodResponse: moodResponse || null, createdAt: new Date() }],
      });
    } else {
      // Add new prompt entry
      history.prompts.push({
        mood,
        movieIds,
        moodResponse: moodResponse || null,
        createdAt: new Date(),
      });
    }

    await history.save();

    return NextResponse.json(
      { message: "History saved successfully", historyId: history._id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving history:", error);
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

    const history = await HistoryModel.findOne({ userId });

    if (!history) {
      return NextResponse.json(
        { prompts: [] },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { prompts: history.prompts },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching history:", error);
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
    const { action, mood, movieIds } = body;

    // If action is 'clear' -> remove all prompts
    if (action === "clear") {
      const history = await HistoryModel.findOne({ userId });
      if (!history) {
        return NextResponse.json({ message: "No history to clear" }, { status: 200 });
      }
      history.prompts = [];
      await history.save();
      return NextResponse.json({ message: "History cleared" }, { status: 200 });
    }

    // Otherwise, attempt to delete a matching prompt by mood + movieIds set
    if (!mood || !Array.isArray(movieIds)) {
      return NextResponse.json({ error: "Invalid request - provide action:'clear' or mood and movieIds to delete specific entry" }, { status: 400 });
    }

    const sameMovieSet = (a: string[] | any[], b: string[] | any[]) => {
      if (!Array.isArray(a) || !Array.isArray(b)) return false;
      if (a.length !== b.length) return false;
      const sa = new Set(a.map(String));
      return b.every((x) => sa.has(String(x)));
    };

    const history = await HistoryModel.findOne({ userId });
    if (!history) {
      return NextResponse.json({ error: "No history entries found" }, { status: 404 });
    }

    const origLen = history.prompts.length;
    history.prompts = history.prompts.filter((p: any) => {
      try {
        return !(p.mood === mood && sameMovieSet(p.movieIds || [], movieIds || []));
      } catch (e) {
        return true;
      }
    });

    if (history.prompts.length === origLen) {
      return NextResponse.json({ error: "History entry not found" }, { status: 404 });
    }

    await history.save();
    return NextResponse.json({ message: "History entry deleted", prompts: history.prompts }, { status: 200 });
  } catch (error) {
    console.error("Error deleting/clearing history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}