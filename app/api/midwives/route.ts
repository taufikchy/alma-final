import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || (session.user.role !== 'MIDWIFE' && session.user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const midwives = await prisma.midwife.findMany({
      include: {
        user: {
          select: {
            username: true,
            role: true,
          },
        },
        patients: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = midwives.map(midwife => ({
      id: midwife.id,
      userId: midwife.userId,
      name: midwife.name,
      username: midwife.user.username,
      role: midwife.user.role,
      patientCount: midwife.patients.length,
      createdAt: midwife.createdAt,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching midwives:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}