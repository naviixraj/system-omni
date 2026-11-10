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

    const html = await response.text().then(t => t.toLowerCase());
    const hasViewport = html.includes('name="viewport"') || html.includes("name='viewport'") || (html.includes('viewport') && html.includes('width=device-width'));
    if (!hasViewport) return 'NOT_MOBILE_FRIENDLY';

    return null; 
  } catch (error) {
    return 'ERROR';
  }
}

// ==========================================
// MASSIVE BULK OPEN-SOURCE SCRAPER (Nominatim API)
// ==========================================
async function runOSMQuery(city: string, amenity: string) {
  console.log(`[CRON] Scraping REAL ${amenity}s in ${city} via OSM...`);
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${amenity} in ${city}`)}&addressdetails=1&extratags=1&limit=25`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OmniSystemCRM/1.0 (contact@omnisystem.local)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return;
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return;

    for (const item of data) {
      const businessName = item.name || item.display_name?.split(',')[0]?.trim();
      if (!businessName || businessName.length < 3) continue;

      let websiteUrl = item.extratags?.website || item.extratags?.['contact:website'] || null;
      let phoneNum = item.extratags?.phone || item.extratags?.['contact:phone'] || item.extratags?.['contact:mobile'] || null;
      let emailAddr = item.extratags?.email || item.extratags?.['contact:email'] || null;

      const exists = await prisma.lead.findFirst({ where: { title: businessName } });
      if (exists) continue;

      let issueDetected: string | null = null;
      if (!websiteUrl) {
        // Prioritize finding real businesses with actual website issues
        if (Math.random() < 0.70) continue;
        issueDetected = 'NO_WEBSITE';
      } else {
        if (!websiteUrl.startsWith('http')) websiteUrl = 'http://' + websiteUrl;
        issueDetected = await auditWebsite(websiteUrl);
      }

      if (issueDetected) {
        await prisma.lead.create({
          data: {
            title: businessName, 
            platform: 'OPEN_STREET_MAP', 
            district: city, 
            niche: amenity,
            url: websiteUrl || '', 
            issueDetected: issueDetected, 
            phone: phoneNum,
            email: emailAddr,
            leadType: 'LOCAL', 
            status: 'SAVED' 
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
  // Exhaustive list of all Tamil Nadu districts and major commercial towns
  const tnCities = [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Trichy", "Salem", 
    "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Tuticorin", "Dindigul", 
    "Thanjavur", "Kanyakumari", "Nagercoil", "Karur", "Ooty", "Kanchipuram",
    "Chengalpattu", "Tiruvallur", "Tiruvannamalai", "Cuddalore", "Villupuram",
    "Kumbakonam", "Namakkal", "Tiruppur", "Hosur", "Rajapalayam", "Sivakasi",
    "Pudukkottai", "Dharmapuri", "Krishnagiri", "Ramanathapuram", "Theni",
    "Virudhunagar", "Sivaganga", "Kallakurichi", "Tenkasi", "Ranipet",
    "Tirupathur", "Mayiladuthurai", "Nagapattinam", "Tiruvarur", "Ariyalur",
    "Perambalur", "Nilgiris", "Ambur", "Pollachi", "Mettupalayam"
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
