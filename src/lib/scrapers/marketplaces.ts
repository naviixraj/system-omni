import prisma from '../prisma';

export async function scrapeMarketplaces() {
  console.log("[CRON] Initiating Marketplaces Scraper...");
  
  try {
    // INCREASED LIMIT TO 50 FOR MAXIMUM GLOBAL REACH
    const response = await fetch('https://www.freelancer.com/api/projects/0.1/projects/active/?query=website&compact=true&limit=50');
    const data = await response.json();
    
    if (data.status === 'success') {
      for (const p of data.result.projects) {
        const exists = await prisma.lead.findFirst({ where: { url: `https://www.freelancer.com/projects/${p.seo_url}` } });
        if (!exists) {
          await prisma.lead.create({
            data: {
              title: p.title,
              platform: 'FREELANCER',
              budget: p.currency.sign + p.budget.minimum + ' - ' + p.currency.sign + p.budget.maximum,
              url: `https://www.freelancer.com/projects/${p.seo_url}`,
              leadType: 'GLOBAL'
            }
          });
        }
      }
    }
  } catch (error) {
    console.error("Marketplace scraping failed:", error);
  }
}
