import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'PATIENT') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const takenMedication = formData.get('takenMedication') === 'true';
    const notes = formData.get('notes') as string | null;
    const photo = formData.get('photo') as File | null;

    let photoUrl: string | null = null;

    if (photo && photo.size > 0) {
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      photoUrl = `data:${photo.type};base64,${buffer.toString('base64')}`;
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
    });

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    const newDailyCheck = await prisma.dailyCheck.create({
      data: {
        patientId: patient.id,
        takenMedication,
        photoUrl,
        notes: notes || null,
      },
    });

    return NextResponse.json(newDailyCheck, { status: 201 });
  } catch (error) {
    console.error('Error creating daily check:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');

  if (!patientId) {
    return NextResponse.json({ message: 'patientId is required' }, { status: 400 });
  }

  try {
    if (session.user.role === 'MIDWIFE') {
      const midwife = await prisma.midwife.findUnique({
        where: { userId: session.user.id },
      });

      if (!midwife) {
        return NextResponse.json({ message: 'Midwife profile not found' }, { status: 404 });
      }

      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
      });

      if (!patient) {
        return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
      }

      if (patient.midwifeId !== midwife.id) {
        return NextResponse.json({ message: 'You do not have access to this patient data' }, { status: 403 });
      }
    } else if (session.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { userId: session.user.id },
      });

      if (!patient) {
        return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
      }

      if (patient.id !== patientId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const dailyChecks = await prisma.dailyCheck.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(dailyChecks, { status: 200 });
  } catch (error) {
    console.error('Error fetching daily checks:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}