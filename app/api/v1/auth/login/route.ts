import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateToken } from '@/lib/jwt';
import { z } from 'zod';
import { addCorsHeaders, handleCorsPreflight } from '@/lib/cors';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      const errorResponse = NextResponse.json(
        { success: false, message: validation.error.issues[0].message },
        { status: 400 }
      );
      return addCorsHeaders(req, errorResponse);
    }

    const { email, password } = validation.data;

    const user = await User.findOne({ email });
    if (!user) {
      const errorResponse = NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 404 }
      );
      return addCorsHeaders(req, errorResponse);
    }

    const isPasswordCorrect = await bcryptjs.compare(password, user.password);
    if (!isPasswordCorrect) {
      const errorResponse = NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 400 }
      );
      return addCorsHeaders(req, errorResponse);
    }

    const token = generateToken(String(user._id));

    const response = NextResponse.json(
      {
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          image: user.image,
          searchHistory: user.searchHistory,
        },
      },
      { status: 200 }
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
    console.log('Error in login API:', err.message);
    const errorResponse = NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(req, errorResponse);
  }
}
