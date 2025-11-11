import { NextRequest, NextResponse } from 'next/server';
import { protectRoute } from '@/lib/middleware';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const authResult = await protectRoute(req);

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    const formData = await req.formData();
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const imageFile = formData.get('image') as File | null;

    const user = await User.findById(authResult.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Update username and email
    if (username && username !== user.username) {
      // Check if username is already taken
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        const existingUserId = String(existingUser._id);
        if (existingUserId !== authResult.userId) {
          return NextResponse.json(
            { success: false, message: 'Username already taken' },
            { status: 400 }
          );
        }
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        const existingUserId = String(existingUser._id);
        if (existingUserId !== authResult.userId) {
          return NextResponse.json(
            { success: false, message: 'Email already taken' },
            { status: 400 }
          );
        }
      }
      user.email = email;
    }

    // Handle image upload
    if (imageFile) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${authResult.userId}-${timestamp}.${imageFile.name.split('.').pop()}`;
      const avatarsDir = join(process.cwd(), 'public', 'avatars');
      const filepath = join(avatarsDir, filename);

      // Ensure avatars directory exists
      if (!existsSync(avatarsDir)) {
        await mkdir(avatarsDir, { recursive: true });
      }

      try {
        await writeFile(filepath, buffer);
        user.image = `/avatars/${filename}`;
      } catch (error) {
        console.error('Error saving avatar:', error);
        // Continue without updating image if file save fails
      }
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: String(user._id),
        username: user.username,
        email: user.email,
        image: user.image,
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error in updateProfile API:', err.message);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
