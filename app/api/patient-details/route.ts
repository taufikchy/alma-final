// app/api/patient-details/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'PATIENT') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      include: {
        midwife: {
          select: {
            name: true,
          },
        },
        dailyChecks: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ message: 'Patient profile not found' }, { status: 404 });
    }

    return NextResponse.json(patient, { status: 200 });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}