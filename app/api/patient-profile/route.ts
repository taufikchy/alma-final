import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (session.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { userId: session.user.id },
        select: {
          id: true,
          name: true,
          user: {
            select: {
              username: true,
              role: true,
            },
          },
        },
      });

      if (!patient) {
        return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
      }

      return NextResponse.json(patient, { status: 200 });
    }

    return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}