// app/api/register-patient/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { calculateGestationalAge } from '@/lib/gestationalAge';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'MIDWIFE') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const {
    username,
    password,
    confirmPassword,
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
  } = await request.json();

  if (!username || !password || !name || !phoneNumber || !address || !pregnancyOrder || !lastMenstrualPeriod || !estimatedDueDate || !lastHemoglobin) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ message: 'Password and confirm password do not match' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ message: 'Password must be at least 8 characters' }, { status: 400 });
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return NextResponse.json({ message: 'Password must contain at least 1 uppercase, 1 lowercase, and 1 number' }, { status: 400 });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this username already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const midwife = await prisma.midwife.findUnique({
      where: { userId: session.user.id as string },
    });

    if (!midwife) {
      return NextResponse.json({ message: 'Midwife profile not found' }, { status: 404 });
    }

    const newUserAndPatient = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role: 'PATIENT',
        },
      });

      const newPatient = await prisma.patient.create({
        data: {
          userId: newUser.id,
          midwifeId: midwife.id,
          name,
          husbandName,
          age: parseInt(age),
          phoneNumber,
          address,
          gestationalAge: calculateGestationalAge(lastMenstrualPeriod),
          pregnancyOrder: parseInt(pregnancyOrder),
          hasMiscarriage,
          miscarriageCount: hasMiscarriage ? parseInt(miscarriageCount || '0') : null,
          lastMenstrualPeriod: new Date(lastMenstrualPeriod),
          estimatedDueDate: new Date(estimatedDueDate),
          lastHemoglobin: parseFloat(lastHemoglobin),
        },
      });
      return { newUser, newPatient };
    });

    return NextResponse.json({ message: 'Patient registered successfully', patient: newUserAndPatient.newPatient }, { status: 201 });
  } catch (error) {
    console.error('Error registering patient:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}