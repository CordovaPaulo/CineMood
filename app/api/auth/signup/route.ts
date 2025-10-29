import { NextResponse } from "next/server";
import connectdb from "@/lib/mongo";
import User from "../../../../models/user";
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    await connectdb();
    const { email, username, password } = await request.json(); 

    const hashedPassword = await bcrypt.hash(password, 12);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const newUser = new User({
      email,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
