import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || (session.user.role !== 'MIDWIFE' && session.user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const midwife = await prisma.midwife.findUnique({
      where: { userId: session.user.id },
    });

    if (!midwife) {
      return NextResponse.json({ message: 'Midwife profile not found' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const patients = await prisma.patient.findMany({
      where: { midwifeId: midwife.id },
      include: {
        dailyChecks: {
          where: {
            date: {
              gte: today,
              lt: tomorrow,
            },
          },
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    const patientsWithPendingChecks = patients
      .filter(patient => {
        const hasCheckToday = patient.dailyChecks.length > 0;
        return !hasCheckToday;
      })
      .map(patient => ({
        id: patient.id,
        name: patient.name,
        phoneNumber: patient.phoneNumber,
        address: patient.address,
        lastMenstrualPeriod: patient.lastMenstrualPeriod,
      }));

    return NextResponse.json(patientsWithPendingChecks, { status: 200 });
  } catch (error) {
    console.error('Error fetching patients with pending checks:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}