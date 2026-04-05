import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== 'MIDWIFE') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  try {
    const midwife = await prisma.midwife.findUnique({
      where: { userId: session.user.id },
    });

    if (!midwife) {
      return NextResponse.json({ message: 'Midwife profile not found' }, { status: 404 });
    }

    const patients = await prisma.patient.findMany({
      where: { midwifeId: midwife.id },
      select: {
        id: true,
        name: true,
        gestationalAge: true,
      },
    });

    const patientIds = patients.map(p => p.id);

    const whereClause: Record<string, unknown> = {
      patientId: { in: patientIds },
    };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const dailyChecks = await prisma.dailyCheck.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            gestationalAge: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const result = dailyChecks.map(dc => ({
      id: dc.id,
      patientId: dc.patientId,
      patientName: dc.patient.name,
      lastMenstrualPeriod: dc.patient.lastMenstrualPeriod,
      date: dc.date,
      createdAt: dc.createdAt,
      takenMedication: dc.takenMedication,
      photoUrl: dc.photoUrl,
      notes: dc.notes,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching all daily checks:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}