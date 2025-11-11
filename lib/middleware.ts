import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/db';
import User from '@/models/User';
import type { User as UserType } from '@/types/user';

export interface AuthenticatedRequest extends NextRequest {
  user?: UserType;
}

export async function protectRoute(
  req: NextRequest
): Promise<
  { userId: string; user: UserType } | { error: string; status: number }
> {
  try {
    await connectDB();

    const token = req.cookies.get('jwt-netflix')?.value;

    if (!token) {
      return { error: 'Unauthorized - No Token Provided', status: 401 };
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return { error: 'Unauthorized - Invalid Token', status: 401 };
    }

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    const userObj = user.toObject();
    // Convert searchHistory createdAt from Date to string
    const userWithStringDates: UserType = {
      ...userObj,
      _id: String(userObj._id),
      searchHistory: userObj.searchHistory.map((item) => ({
        ...item,
        createdAt: item.createdAt ? item.createdAt.toISOString() : undefined,
      })),
    };

    return { userId: String(user._id), user: userWithStringDates };
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.log('Error in protectRoute middleware: ', err.message);
    return { error: 'Internal Server Error', status: 500 };
  }
}
