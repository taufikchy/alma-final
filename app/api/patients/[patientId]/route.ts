import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'MIDWIFE') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { patientId } = await params;

  if (!patientId) {
    return NextResponse.json({ message: 'patientId is required' }, { status: 400 });
  }

  try {
    const midwife = await prisma.midwife.findUnique({
      where: { userId: session.user.id },
    });

    if (!midwife) {
      return NextResponse.json({ message: 'Midwife profile not found' }, { status: 404 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        dailyChecks: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    if (patient.midwifeId !== midwife.id) {
      return NextResponse.json({ message: 'You do not have access to this patient' }, { status: 403 });
    }

    return NextResponse.json(patient, { status: 200 });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'MIDWIFE') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { patientId } = await params;

  if (!patientId) {
    return NextResponse.json({ message: 'patientId is required' }, { status: 400 });
  }

  try {
    const midwife = await prisma.midwife.findUnique({
      where: { userId: session.user.id },
    });

    if (!midwife) {
      return NextResponse.json({ message: 'Midwife profile not found' }, { status: 404 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        dailyChecks: true,
        user: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    if (patient.midwifeId !== midwife.id) {
      return NextResponse.json({ message: 'You do not have permission to delete this patient' }, { status: 403 });
    }

    const userId = patient.userId;

    await prisma.dailyCheck.deleteMany({
      where: { patientId },
    });

    await prisma.patient.delete({
      where: { id: patientId },
    });

    if (userId) {
      await prisma.user.delete({
        where: { id: userId },
      });
    }

    return NextResponse.json({ message: 'Patient deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}