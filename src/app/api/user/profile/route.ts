import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, error: 'userId or email is required' },
        { status: 400 }
      );
    }

    const mongoose = await connectToDatabase();
    if (!mongoose || !mongoose.connection.db) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionName = collections.some((c) => c.name === 'user')
      ? 'user'
      : collections.some((c) => c.name === 'users')
      ? 'users'
      : 'user';

    const usersCol = db.collection(collectionName);

    const orConditions: Record<string, unknown>[] = [];
    if (userId) {
      orConditions.push({ id: userId });
      orConditions.push({ userId: userId });
      if (ObjectId.isValid(userId)) {
        orConditions.push({ _id: new ObjectId(userId) });
      }
    }
    if (email) {
      orConditions.push({ email: email.toLowerCase() });
    }

    const user = await usersCol.findOne({ $or: orConditions });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: String(user.id || user._id),
        name: user.name || '',
        email: user.email || '',
        image: user.image || '',
        gender: user.gender || '',
        phoneNumber: user.phoneNumber || '',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, name, image, gender, phoneNumber } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, error: 'userId or email is required' },
        { status: 400 }
      );
    }

    const mongoose = await connectToDatabase();
    if (!mongoose || !mongoose.connection.db) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionName = collections.some((c) => c.name === 'user')
      ? 'user'
      : collections.some((c) => c.name === 'users')
      ? 'users'
      : 'user';

    const usersCol = db.collection(collectionName);

    const orConditions: Record<string, unknown>[] = [];
    if (userId) {
      orConditions.push({ id: userId });
      orConditions.push({ userId: userId });
      if (ObjectId.isValid(userId)) {
        orConditions.push({ _id: new ObjectId(userId) });
      }
    }
    if (email) {
      orConditions.push({ email: email.toLowerCase() });
    }

    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (typeof name === 'string') updateFields.name = name.trim();
    if (typeof image === 'string') updateFields.image = image;
    if (typeof gender === 'string') updateFields.gender = gender;
    if (typeof phoneNumber === 'string') updateFields.phoneNumber = phoneNumber.trim();

    const result = await usersCol.findOneAndUpdate(
      { $or: orConditions },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    const updated = result;
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'User not found to update' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: String(updated.id || updated._id),
        name: updated.name || '',
        email: updated.email || '',
        image: updated.image || '',
        gender: updated.gender || '',
        phoneNumber: updated.phoneNumber || '',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
