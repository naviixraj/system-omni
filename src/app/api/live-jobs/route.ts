export const dynamic = 'force-static';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // STRICT DEDUPLICATION: Only show leads that have NOT been moved to the Pipeline yet.
    // In our schema, new leads default to "SAVED". 
    // When added to pipeline, they become "QUEUED", "PITCHED", or "WON".
    const jobs = await prisma.lead.findMany({
      where: { status: 'SAVED' }, // 'SAVED' is the prisma default status for brand new leads
      orderBy: { createdAt: 'desc' },
      take: 1000 
    });
    
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Failed to fetch live jobs:", error);
    return NextResponse.json([], { status: 200 }); 
  }
}
