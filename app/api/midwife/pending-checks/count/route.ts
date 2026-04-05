import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let whereClause: any = {};

    if (session.user.role === 'SUPER_ADMIN') {
    } else if (session.user.role === 'MIDWIFE') {
      const midwife = await prisma.midwife.findUnique({
        where: { userId: session.user.id },
      });

      if (!midwife) {
        return NextResponse.json({ message: 'Midwife profile not found' }, { status: 404 });
      }

      whereClause = { midwifeId: midwife.id };
    } else {
      return NextResponse.json({ count: 0 });
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      include: {
        dailyChecks: {
          where: {
            date: {
              gte: today,
              lt: tomorrow,
            },
          },
          take: 1,
        },
      },
    });

    const pendingCount = patients.filter(patient => patient.dailyChecks.length === 0).length;

    return NextResponse.json({ count: pendingCount }, { status: 200 });
  } catch (error) {
    console.error('Error fetching pending checks count:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}