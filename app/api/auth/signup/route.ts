import { NextResponse } from "next/server";
import connectdb from "@/lib/mongo";
import User from "../../../../models/user";
import bcrypt from 'bcryptjs';
import { validateEmail } from "@/utils/validateEmail";
import { validatePassword } from "@/utils/passwordValidation";

export async function POST(request: Request) {
  try {
    await connectdb();
    const { email, username, password } = await request.json(); 

    if (!email || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if(email.length < 5 || password.length < 8 || username.length < 3) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    if(email.length > 100 || username.length > 50 || password.length > 100) {
      return NextResponse.json({ error: 'Input too long' }, { status: 400 });
    }
    
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (!validatePassword(password)) {
      return NextResponse.json({ error: 'Password does not meet criteria' }, { status: 400 });
    }

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
