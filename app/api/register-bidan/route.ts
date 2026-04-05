import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'MIDWIFE' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const {
      username,
      password,
      name,
    } = await request.json();

    if (!username || !password || !name) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserAndMidwife = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role: 'MIDWIFE',
        },
      });

      const newMidwife = await prisma.midwife.create({
        data: {
          userId: newUser.id,
          name,
        },
      });

      return { user: newUser, midwife: newMidwife };
    });

    return NextResponse.json(
      { message: 'Bidan berhasil didaftarkan', data: newUserAndMidwife },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering bidan:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}