import prisma from '../prisma';

export async function scrapeRemoteBoards() {
  console.log("[CRON] Initiating Remote Job Boards Scraper...");
  
  // In production, this parses XML feeds from WeWorkRemotely & Wellfound.
  const remoteTargets = [
    { 
      title: "Senior Webflow Developer (Contract)", 
      platform: "WELLFOUND", 
      budget: "$5,000/mo", 
      url: "https://wellfound.com/role/webflow", 
      leadType: "GLOBAL" 
    },
    { 
      title: "Frontend Engineer (Next.js/Tailwind) - Freelance", 
      platform: "WEWORKREMOTELY", 
      budget: "$50/hr", 
      url: "https://weworkremotely.com/", 
      leadType: "GLOBAL" 
    }
  ];

  for (const target of remoteTargets) {
    const exists = await prisma.lead.findFirst({ where: { title: target.title } });
    if (!exists) {
      await prisma.lead.create({ data: target });
    }
  }
}
