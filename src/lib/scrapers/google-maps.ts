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
    // Lowered threshold to 1.5 seconds to aggressively catch unoptimized websites
    if (loadTime > 1500) return 'SLOW_LOAD';

    const html = await response.text();
    const hasViewport = html.toLowerCase().includes('meta name="viewport"');
    if (!hasViewport) return 'NOT_MOBILE_FRIENDLY';

    return null; 
  } catch (error) {
    return 'ERROR';
  }
}

// ==========================================
// MASSIVE BULK OPEN-SOURCE SCRAPER
// ==========================================
async function runOSMQuery(city: string, amenity: string) {
  console.log(`[CRON] Scraping REAL ${amenity}s in ${city} via OSM...`);
  const overpassQuery = `
    [out:json][timeout:60];
    area["name"="${city}"]->.searchArea;
    node["amenity"="${amenity}"](area.searchArea);
    out 100;
  `;
  try {
    const response = await fetch('https://lz4.overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'FreelanceCRM/1.0' },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });
    if (!response.ok) return;
    const data = await response.json();
    if (!data.elements || data.elements.length === 0) return;

    for (const element of data.elements) {
      if (!element.tags || !element.tags.name) continue;
      const businessName = element.tags.name;
      let websiteUrl = element.tags.website || element.tags['contact:website'] || null;
      const exists = await prisma.lead.findFirst({ where: { title: businessName } });
      if (exists) continue;

      let issueDetected = null;
      if (!websiteUrl) {
        issueDetected = 'NO_WEBSITE';
      } else {
        if (!websiteUrl.startsWith('http')) websiteUrl = 'http://' + websiteUrl;
        issueDetected = await auditWebsite(websiteUrl);
      }

      if (issueDetected) {
        await prisma.lead.create({
          data: {
            title: businessName, platform: 'OPEN_STREET_MAP', district: city, niche: amenity,
            url: websiteUrl || '', issueDetected: issueDetected, leadType: 'LOCAL', status: 'SAVED' 
          }
        });
        console.log(`[CRON] ✅ Saved Lead: ${businessName} [Issue: ${issueDetected}]`);
      }
    }
  } catch (err) {
    console.error("[CRON] Error during OSM query:", err);
  }
}

async function scrapeOpenStreetMapFallback() {
  // Heavy focus on Tamil Nadu local areas
  const tnCities = [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", 
    "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Dindigul", 
    "Thanjavur", "Kanyakumari", "Karur", "Ooty"
  ];
  // Secondary other state targets
  const otherCities = ["Bangalore", "Kochi", "Hyderabad", "Mumbai"];
  
  // 80% of the time, pick a Tamil Nadu city. 20% of the time, pick another state.
  const allCities = [...tnCities, ...tnCities, ...tnCities, ...otherCities];
  
  const amenities = ["restaurant", "hospital", "dentist", "cafe", "pharmacy", "clinic", "gym", "spa", "college"];
  
  // Pick 3 random combinations to run at the same time to guarantee huge volume
  const queries = Array.from({ length: 3 }).map(() => ({
    city: allCities[Math.floor(Math.random() * allCities.length)],
    amenity: amenities[Math.floor(Math.random() * amenities.length)]
  }));

  await Promise.all(queries.map(q => runOSMQuery(q.city, q.amenity)));
}

export async function scrapeGoogleMapsDrip() {
  console.log("[CRON] Initiating REAL-WORLD Local Auditor...");
  
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!apiKey || apiKey === "your_api_key_here") {
    await scrapeOpenStreetMapFallback();
    return;
  }

  // --- GOOGLE PLACES LOGIC ---
  try {
    const niches = ["dental clinic", "restaurant", "lawyer", "chartered accountant", "architect", "fitness center"];
    const cities = ["Chennai", "Coimbatore", "Madurai", "Bangalore", "Hyderabad"];
    
    const randomNiche = niches[Math.floor(Math.random() * niches.length)];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const query = `${randomNiche} in ${randomCity}`;
    
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    console.log(`[CRON] Querying Google Places API for: ${query}`);
    const res = await fetch(searchUrl);
    const data = await res.json();
    console.log(`[CRON] Google API Response Status:`, data.status);

    if (data.status === 'REQUEST_DENIED') {
       console.log("[CRON] Google API rejected key. Falling back to OSM...");
       await scrapeOpenStreetMapFallback();
       return;
    }

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
