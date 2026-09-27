import prisma from '../prisma';

// ==========================================
// THE LIVE WEBSITE AUDIT ENGINE
// ==========================================
async function auditWebsite(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6-second max wait time

    const startTime = performance.now();
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const endTime = performance.now();
    clearTimeout(timeoutId);

    // 1. Check for Broken Site (404, 500, etc.)
    if (!response.ok) {
      return 'ERROR';
    }

    // 2. Check for Slow Load Time (Takes longer than 3.5 seconds to respond)
    const loadTime = endTime - startTime;
    if (loadTime > 3500) {
      return 'SLOW_LOAD';
    }

    // 3. Check for Mobile-Friendliness (Missing Viewport Meta Tag)
    const html = await response.text();
    const hasViewport = html.toLowerCase().includes('meta name="viewport"');
    if (!hasViewport) {
      return 'NOT_MOBILE_FRIENDLY';
    }

    // Website passed all checks! It is perfectly healthy.
    return null; 
  } catch (error) {
    // If the ping fails entirely (DNS Error, Server Timeout)
    return 'ERROR';
  }
}

export async function scrapeGoogleMapsDrip() {
  console.log("[CRON] Initiating REAL-WORLD Google Maps Auditor...");
  
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    console.warn("[CRON] ⚠️ HALTED: Missing GOOGLE_PLACES_API_KEY in your .env file.");
    console.warn("[CRON] ⚠️ To start scraping real businesses, please add your Google Maps API Key.");
    return;
  }

  try {
    // Target High-Value Niches across India
    const niches = ["dental clinic", "restaurant", "lawyer", "chartered accountant", "architect", "fitness center"];
    const cities = ["Chennai", "Coimbatore", "Madurai", "Bangalore", "Hyderabad"];
    
    // Pick a random niche and city to scrape every 5 minutes
    const randomNiche = niches[Math.floor(Math.random() * niches.length)];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const query = `${randomNiche} in ${randomCity}`;
    
    console.log(`[CRON] Searching Google Places for: "${query}"`);

    // Fetch Real Businesses from Google Places Text Search
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    const res = await fetch(searchUrl);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      console.log("[CRON] No results found for query.");
      return;
    }

    // Process top 3 results to conserve API usage
    const topResults = data.results.slice(0, 3);

    for (const place of topResults) {
      const businessName = place.name;
      // Basic extraction for district/city
      const district = place.formatted_address?.split(',').slice(-2, -1)[0]?.trim() || randomCity;
      
      // Strict Deduplication Check
      const exists = await prisma.lead.findFirst({ where: { title: businessName } });
      if (exists) {
        console.log(`[CRON] Skipping ${businessName} (Already in Database)`);
        continue;
      }

      // We need the Place Details API to extract the real website URL
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website&key=${apiKey}`;
      const detailsRes = await fetch(detailsUrl);
      const detailsData = await detailsRes.json();
      
      const websiteUrl = detailsData.result?.website;

      let issueDetected = null;

      if (!websiteUrl) {
        issueDetected = 'NO_WEBSITE';
      } else {
        console.log(`[CRON] Auditing real website URL: ${websiteUrl}`);
        issueDetected = await auditWebsite(websiteUrl);
      }

      // If we successfully found a flaw in their website, save it to the CRM!
      if (issueDetected) {
        await prisma.lead.create({
          data: {
            title: businessName,
            platform: 'GOOGLE_MAPS',
            district: district,
            niche: randomNiche,
            url: websiteUrl || '',
            issueDetected: issueDetected,
            leadType: 'LOCAL',
            status: 'SAVED' // Immediately push to Discovery feed
          }
        });
        console.log(`[CRON] ✅ Saved Real Lead: ${businessName} [Issue: ${issueDetected}]`);
      } else {
        console.log(`[CRON] ❌ Ignored ${businessName} (Website is completely healthy)`);
      }
    }

  } catch (error) {
    console.error("[CRON] Error during real Google Maps scrape:", error);
  }
}
