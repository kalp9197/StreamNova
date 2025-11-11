import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateToken } from '@/lib/jwt';
import { z } from 'zod';
import { addCorsHeaders, handleCorsPreflight } from '@/lib/cors';

const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(1, 'Username is required'),
});

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      const errorResponse = NextResponse.json(
        { success: false, message: validation.error.issues[0].message },
        { status: 400 }
      );
      return addCorsHeaders(req, errorResponse);
    }

    const { email, password, username } = validation.data;

    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      const errorResponse = NextResponse.json(
        { success: false, message: 'Email already exists' },
        { status: 400 }
      );
      return addCorsHeaders(req, errorResponse);
    }

    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      const errorResponse = NextResponse.json(
        { success: false, message: 'Username already exists' },
        { status: 400 }
      );
      return addCorsHeaders(req, errorResponse);
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const PROFILE_PICS = ['/avatar1.png', '/avatar2.png', '/avatar3.png'];
    const image = PROFILE_PICS[Math.floor(Math.random() * PROFILE_PICS.length)];

    const newUser = new User({
      email,
      password: hashedPassword,
      username,
      image,
    });

    await newUser.save();

    const token = generateToken(String(newUser._id));

    const response = NextResponse.json(
      {
        success: true,
        user: {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          image: newUser.image,
          searchHistory: newUser.searchHistory,
        },
      },
      { status: 201 }
    );

    response.cookies.set('jwt-netflix', token, {
      maxAge: 15 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV !== 'development',
    });

    return addCorsHeaders(req, response);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.log('Error in signup API:', err.message);
    const errorResponse = NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(req, errorResponse);
  }
}
