// app/api/educational-materials/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

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

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, content, videoUrl1, videoUrl2, videoUrl3 } = body;

    if (!title || !content) {
      return NextResponse.json(
        { message: 'Title and content are required' },
        { status: 400 }
      );
    }

    const material = await prisma.educationalMaterial.create({
      data: {
        title,
        content,
        videoUrl1: videoUrl1 || null,
        videoUrl2: videoUrl2 || null,
        videoUrl3: videoUrl3 || null,
      },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error('Error creating educational material:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}