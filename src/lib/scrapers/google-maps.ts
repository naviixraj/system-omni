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

    if (!response.ok) return 'ERROR';

    const loadTime = endTime - startTime;
    if (loadTime > 3500) return 'SLOW_LOAD';

    const html = await response.text();
    const hasViewport = html.toLowerCase().includes('meta name="viewport"');
    if (!hasViewport) return 'NOT_MOBILE_FRIENDLY';

    return null; 
  } catch (error) {
    return 'ERROR';
  }
}

// ==========================================
// FREE OPEN-SOURCE SCRAPER (NO API KEY NEEDED)
// ==========================================
async function scrapeOpenStreetMapFallback() {
  const cities = ["Chennai", "Coimbatore", "Mumbai", "Bangalore", "Madurai"];
  const amenities = ["restaurant", "hospital", "dentist", "cafe", "pharmacy"];
  
  const city = cities[Math.floor(Math.random() * cities.length)];
  const amenity = amenities[Math.floor(Math.random() * amenities.length)];
  
  console.log(`[CRON] Scraping REAL ${amenity}s in ${city} via OpenStreetMap (100% Free Engine)...`);
  
  // Overpass API Query Language (Finds real businesses in a specific city)
  const overpassQuery = `
    [out:json][timeout:15];
    area["name"="${city}"]->.searchArea;
    node["amenity"="${amenity}"](area.searchArea);
    out 20;
  `;
  
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery
    });
    
    if (!response.ok) {
      console.log("[CRON] OSM API Rate limited, skipping cycle...");
      return;
    }
    
    const data = await response.json();
    if (!data.elements || data.elements.length === 0) return;

    // Pick 3 random businesses from the real-world results
    const shuffled = data.elements.sort(() => 0.5 - Math.random());
    const topResults = shuffled.slice(0, 3);

    for (const element of topResults) {
      if (!element.tags || !element.tags.name) continue;
      
      const businessName = element.tags.name;
      let websiteUrl = element.tags.website || element.tags['contact:website'] || null;
      
      // Deduplication check
      const exists = await prisma.lead.findFirst({ where: { title: businessName } });
      if (exists) {
        console.log(`[CRON] Skipping ${businessName} (Already in Database)`);
        continue;
      }

      let issueDetected = null;

      if (!websiteUrl) {
        issueDetected = 'NO_WEBSITE';
      } else {
        // Fix URLs missing http://
        if (!websiteUrl.startsWith('http')) {
          websiteUrl = 'https://' + websiteUrl;
        }
        console.log(`[CRON] Auditing real official website: ${websiteUrl}`);
        issueDetected = await auditWebsite(websiteUrl);
      }

      // If we found a real issue, save it!
      if (issueDetected) {
        await prisma.lead.create({
          data: {
            title: businessName,
            platform: 'OPEN_STREET_MAP',
            district: city,
            niche: amenity,
            url: websiteUrl || '',
            issueDetected: issueDetected,
            leadType: 'LOCAL',
            status: 'SAVED' 
          }
        });
        console.log(`[CRON] ✅ Saved Real Lead: ${businessName} [Issue: ${issueDetected}]`);
      } else {
        console.log(`[CRON] ❌ Ignored ${businessName} (Website is completely healthy)`);
      }
    }
  } catch (err) {
    console.error("[CRON] Error during OpenStreetMap scrape:", err);
  }
}

export async function scrapeGoogleMapsDrip() {
  console.log("[CRON] Initiating REAL-WORLD Local Auditor...");
  
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  // If the user doesn't have a Google API Key, seamlessly fallback to the FREE OpenStreetMap engine!
  if (!apiKey) {
    console.log("[CRON] No Google Places API Key found. Using 100% Free OpenStreetMap Engine...");
    await scrapeOpenStreetMapFallback();
    return;
  }

  // --- GOOGLE PLACES LOGIC (Remains unchanged for when they get a key) ---
  try {
    const niches = ["dental clinic", "restaurant", "lawyer", "chartered accountant", "architect", "fitness center"];
    const cities = ["Chennai", "Coimbatore", "Madurai", "Bangalore", "Hyderabad"];
    
    const randomNiche = niches[Math.floor(Math.random() * niches.length)];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const query = `${randomNiche} in ${randomCity}`;
    
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    const res = await fetch(searchUrl);
    const data = await res.json();

    if (!data.results || data.results.length === 0) return;

    const topResults = data.results.slice(0, 3);

    for (const place of topResults) {
      const businessName = place.name;
      const district = place.formatted_address?.split(',').slice(-2, -1)[0]?.trim() || randomCity;
      
      const exists = await prisma.lead.findFirst({ where: { title: businessName } });
      if (exists) continue;

      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website&key=${apiKey}`;
      const detailsRes = await fetch(detailsUrl);
      const detailsData = await detailsRes.json();
      
      const websiteUrl = detailsData.result?.website;

      let issueDetected = null;

      if (!websiteUrl) {
        issueDetected = 'NO_WEBSITE';
      } else {
        issueDetected = await auditWebsite(websiteUrl);
      }

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
            status: 'SAVED'
          }
        });
      }
    }
  } catch (error) {
    console.error("[CRON] Error during real Google Maps scrape:", error);
  }
}
