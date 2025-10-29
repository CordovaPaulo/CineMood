import { NextResponse } from 'next/server';
import connectdb from '@/lib/mongo';
import { parseContents } from '@/services/gemini';

export async function POST(request: Request) {
    try {
        await connectdb();
    } catch (error) {
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
}