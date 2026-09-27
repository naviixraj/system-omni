import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Only return leads that are actively in the CRM pipeline (not in the discovery inbox)
    const jobs = await prisma.lead.findMany({
      where: {
        status: { in: ['QUEUED', 'PITCHED', 'WON'] }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(jobs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // We don't actually use POST to save from Discovery anymore. We use PATCH to move them!
  return NextResponse.json({ error: 'Use PATCH to move leads to pipeline' }, { status: 400 });
}

export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json();
    
    const updatedJob = await prisma.lead.update({
      where: { id },
      data: { status }
    });
    
    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error("Failed to update status", error);
    return NextResponse.json({ error: 'Failed to update job status' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await prisma.lead.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete job", error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
