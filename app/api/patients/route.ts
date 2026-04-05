// app/api/patients/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const midwifeId = searchParams.get('midwifeId');

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (session.user.role === 'SUPER_ADMIN' && midwifeId) {
      const patients = await prisma.patient.findMany({
        where: { midwifeId },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(patients, { status: 200 });
    }

    if (session.user.role !== 'MIDWIFE') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const midwife = await prisma.midwife.findUnique({
      where: { userId: session.user.id },
    });

    if (!midwife) {
      return NextResponse.json({ message: 'Midwife profile not found' }, { status: 404 });
    }

    const patients = await prisma.patient.findMany({
      where: { midwifeId: midwife.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(patients, { status: 200 });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
