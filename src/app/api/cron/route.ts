export const dynamic = 'force-static';

import { NextResponse } from 'next/server';
import { scrapeMarketplaces } from '@/lib/scrapers/marketplaces';
import { scrapeGoogleMapsDrip } from '@/lib/scrapers/google-maps';
import { scrapeSocial } from '@/lib/scrapers/social';
import { scrapeRemoteBoards } from '@/lib/scrapers/remote';

export async function GET(req: Request) {
  console.log("=== OMNI-CRON CYCLE INITIATED ===");
  
  try {
    // Run ALL 4 global and local scraper modules in parallel
    await Promise.all([
      scrapeMarketplaces(),    // Upwork, Freelancer, etc.
      scrapeSocial(),          // X (Twitter), Reddit
      scrapeRemoteBoards(),    // WeWorkRemotely, Wellfound
      scrapeGoogleMapsDrip()   // Local Google Maps
    ]);

    return NextResponse.json({ 
      success: true, 
      message: "Omni-Cron cycle completed. Data from Marketplaces, Social, Remote Boards, and Local Maps successfully synced." 
    });
  } catch (error) {
    console.error("Cron failed:", error);
    return NextResponse.json({ error: "Cron cycle failed" }, { status: 500 });
  }
}
