export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { scrapeMarketplaces } from '@/lib/scrapers/marketplaces';
import { scrapeGoogleMapsDrip } from '@/lib/scrapers/google-maps';
import { scrapeSocial } from '@/lib/scrapers/social';
import { scrapeRemoteBoards } from '@/lib/scrapers/remote';

async function executeCronCycle() {
  console.log("=== OMNI-CRON CYCLE INITIATED ===");
  const startTime = Date.now();
  
  let initialCount = 0;
  try {
    initialCount = await prisma.lead.count();
  } catch (e) {
    console.warn("Could not read initial lead count", e);
  }

  // Run ALL 4 global and local scraper modules with allSettled so one failure cannot halt others
  const moduleNames = ["Marketplaces (Freelancer/Upwork/Fiverr)", "Social (X/Reddit/LinkedIn)", "Remote Boards (RemoteOK/WWR/HN)", "Local Maps & OSM"];
  const results = await Promise.allSettled([
    scrapeMarketplaces(),
    scrapeSocial(),
    scrapeRemoteBoards(),
    scrapeGoogleMapsDrip()
  ]);

  const errors: string[] = [];
  const moduleStatuses: { [key: string]: 'SUCCESS' | 'ERROR' } = {};

  results.forEach((res, index) => {
    const mod = moduleNames[index];
    if (res.status === 'fulfilled') {
      moduleStatuses[mod] = 'SUCCESS';
    } else {
      moduleStatuses[mod] = 'ERROR';
      const reasonMsg = res.reason?.message || String(res.reason || 'Unknown error');
      console.error(`[CRON ERROR] Module '${mod}' failed:`, reasonMsg);
      errors.push(`${mod}: ${reasonMsg}`);
    }
  });

  let finalCount = initialCount;
  try {
    finalCount = await prisma.lead.count();
  } catch (e) {
    console.warn("Could not read final lead count", e);
  }

  const durationMs = Date.now() - startTime;
  const newLeadsFound = Math.max(0, finalCount - initialCount);

  return {
    success: errors.length < moduleNames.length, // considered success as long as at least 1 module ran
    message: errors.length === 0 
      ? `Omni-Cron completed successfully. Found ${newLeadsFound} new orders/leads.`
      : `Omni-Cron partially synced. ${errors.length} module(s) encountered network issues. Found ${newLeadsFound} new orders/leads.`,
    newLeadsFound,
    totalLeads: finalCount,
    moduleStatuses,
    errors,
    durationMs,
    timestamp: new Date().toISOString()
  };
}

export async function GET() {
  try {
    const report = await executeCronCycle();
    return NextResponse.json(report, { status: report.success ? 200 : 500 });
  } catch (error: any) {
    console.error("Critical Cron Failure:", error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || "Critical cron cycle failure",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
