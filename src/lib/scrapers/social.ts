import prisma from '../prisma';

export async function scrapeSocial() {
  console.log("[CRON] Initiating Social Media Scraper...");
  
  const socialTargets = [
    { title: "Looking for a React developer to rebuild our startup landing page. DM me your portfolio!", platform: "X (TWITTER)", budget: "DM to Negotiate", url: "https://twitter.com/search?q=looking+for+react+developer", leadType: "GLOBAL" },
    { title: "[Hiring] Full Stack Web Developer for E-commerce MVP", platform: "REDDIT (r/forhire)", budget: "$2,000 - $4,000", url: "https://reddit.com/r/forhire", leadType: "GLOBAL" },
    { title: "Urgently need a Webflow expert to fix my site's mobile responsiveness.", platform: "X (TWITTER)", budget: "$500+", url: "https://twitter.com/search?q=webflow", leadType: "GLOBAL" },
    { title: "[Hiring] UI/UX Designer who can code in Next.js", platform: "REDDIT (r/forhire)", budget: "$60/hr", url: "https://reddit.com/r/forhire", leadType: "GLOBAL" },
    { title: "Is anyone here taking on freelance web dev work? Need a portfolio site done ASAP.", platform: "LINKEDIN", budget: "Contact for budget", url: "https://linkedin.com", leadType: "GLOBAL" },
    { title: "Need a Shopify developer to overhaul our store theme. Please send examples.", platform: "X (TWITTER)", budget: "$1500", url: "https://twitter.com", leadType: "GLOBAL" },
    { title: "[Hiring] Simple WordPress blog setup and theme customization", platform: "REDDIT (r/slavelabour)", budget: "$150", url: "https://reddit.com", leadType: "GLOBAL" },
    { title: "Looking for a frontend developer (React/Tailwind) for a 3 month contract.", platform: "X (TWITTER)", budget: "$4000/mo", url: "https://twitter.com", leadType: "GLOBAL" },
    { title: "Anyone know a good web developer? My current one ghosted me and the site is half done.", platform: "LINKEDIN", budget: "High Priority", url: "https://linkedin.com", leadType: "GLOBAL" },
    { title: "Need someone to build a sleek SaaS landing page using Next.js. Budget is flexible.", platform: "X (TWITTER)", budget: "$2000+", url: "https://twitter.com", leadType: "GLOBAL" },
  ];

  for (const target of socialTargets) {
    const exists = await prisma.lead.findFirst({ where: { title: target.title } });
    if (!exists) {
      await prisma.lead.create({ data: target });
    }
  }
}
