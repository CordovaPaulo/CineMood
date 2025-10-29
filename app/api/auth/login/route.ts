import { NextResponse } from "next/server";
import connectdb from "@/lib/mongo";
import User from "../../../../models/user";
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { generateToken } from '@/lib/jwt';
import { use } from "react";

export async function POST(request: Request) {
    try {
        await connectdb();
        const { email, password } = await request.json();

        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = generateToken({ userId: existingUser._id, username: existingUser.username });

        const res = NextResponse.json({ message: 'Login successful' }, { status: 200 });

        res.cookies.set({
            name: 'cinemood_auth_token',
            value: token,
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24, // 1 day
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        })
        
        return res;
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}