// app/api/educational-materials/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  // For now, allow both patient and midwife to view educational materials
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const materials = await prisma.educationalMaterial.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(materials, { status: 200 });
  } catch (error) {
    console.error('Error fetching educational materials:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
