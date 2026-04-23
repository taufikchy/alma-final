import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'MIDWIFE' && session.user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { patientId } = await params;

  if (!patientId) {
    return NextResponse.json({ message: 'patientId is required' }, { status: 400 });
  }

  try {
    let midwife = null;
    if (session.user.role === 'MIDWIFE') {
      midwife = await prisma.midwife.findUnique({
        where: { userId: session.user.id },
      });

      if (!midwife) {
        return NextResponse.json({ message: 'Midwife profile not found' }, { status: 404 });
      }
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

    if (midwife && patient.midwifeId !== midwife.id) {
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'MIDWIFE' && session.user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { patientId } = await params;

  if (!patientId) {
    return NextResponse.json({ message: 'patientId is required' }, { status: 400 });
  }

  try {
    let midwife = null;
    if (session.user.role === 'MIDWIFE') {
      midwife = await prisma.midwife.findUnique({
        where: { userId: session.user.id },
      });

      if (!midwife) {
        return NextResponse.json({ message: 'Midwife profile not found' }, { status: 404 });
      }
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json({ message: 'Patient not found' }, { status: 404 });
    }

    if (midwife && patient.midwifeId !== midwife.id) {
      return NextResponse.json({ message: 'You do not have permission to edit this patient' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      husbandName,
      age,
      phoneNumber,
      address,
      pregnancyOrder,
      hasMiscarriage,
      miscarriageCount,
      lastMenstrualPeriod,
      estimatedDueDate,
      lastHemoglobin,
    } = body;

    if (!name || !husbandName || !age || !phoneNumber || !address || pregnancyOrder === undefined ||
        hasMiscarriage === undefined || !lastMenstrualPeriod || !estimatedDueDate || lastHemoglobin === undefined) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 10 || ageNum > 60) {
      return NextResponse.json({ message: 'Umur harus antara 10-60 tahun' }, { status: 400 });
    }

    const pregnancyOrderNum = parseInt(pregnancyOrder);
    if (isNaN(pregnancyOrderNum) || pregnancyOrderNum < 1 || pregnancyOrderNum > 20) {
      return NextResponse.json({ message: 'Kehamilan ke harus antara 1-20' }, { status: 400 });
    }

    const hb = parseFloat(lastHemoglobin);
    if (isNaN(hb) || hb < 5 || hb > 20) {
      return NextResponse.json({ message: 'Hemoglobin harus antara 5-20 g/dL' }, { status: 400 });
    }

    const lmpDate = new Date(lastMenstrualPeriod);
    if (isNaN(lmpDate.getTime())) {
      return NextResponse.json({ message: 'Format tanggal HPHT tidak valid' }, { status: 400 });
    }

    const eddDate = new Date(estimatedDueDate);
    if (isNaN(eddDate.getTime())) {
      return NextResponse.json({ message: 'Format tanggal perkiraan lahir tidak valid' }, { status: 400 });
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        name,
        husbandName,
        age: ageNum,
        phoneNumber,
        address,
        pregnancyOrder: pregnancyOrderNum,
        hasMiscarriage: Boolean(hasMiscarriage),
        miscarriageCount: hasMiscarriage ? (parseInt(miscarriageCount) || 0) : 0,
        lastMenstrualPeriod: lmpDate,
        estimatedDueDate: eddDate,
        lastHemoglobin: hb,
      },
    });

    return NextResponse.json(updatedPatient, { status: 200 });
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}