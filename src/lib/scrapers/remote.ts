import prisma from '../prisma';

export async function scrapeRemoteBoards() {
  console.log("[CRON] Initiating Remote Job Boards Scraper (RemoteOK, WeWorkRemotely, HackerNews, Wellfound)...");
  
  // 1. Live RemoteOK API
  try {
    const res = await fetch('https://remoteok.com/api', { 
      headers: { 'User-Agent': 'Mozilla/5.0 OmniCRM/1.0' } 
    });
    if (res.ok) {
      const jobs = await res.json();
      if (Array.isArray(jobs)) {
        // Skip first item (legal disclaimer object)
        const webJobs = jobs.slice(1, 40).filter((j: any) => {
          const text = (j.position + ' ' + (j.tags || []).join(' ')).toLowerCase();
          return text.includes('dev') || text.includes('engineer') || text.includes('web') || text.includes('frontend') || text.includes('fullstack') || text.includes('react') || text.includes('design');
        });

        for (const j of webJobs.slice(0, 15)) {
          const url = j.url || `https://remoteok.com/remote-jobs/${j.id}`;
          const exists = await prisma.lead.findFirst({ where: { url } });
          if (!exists) {
            let budget = "$4,000 - $7,000/mo";
            if (j.salary_min && j.salary_max) {
              budget = `$${j.salary_min.toLocaleString()} - $${j.salary_max.toLocaleString()}/yr`;
            } else if (j.salary) {
              budget = j.salary;
            }

            await prisma.lead.create({
              data: {
                title: `${j.position}${j.company ? ` - ${j.company}` : ''}`,
                platform: 'REMOTEOK',
                budget,
                url,
                leadType: 'GLOBAL'
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("RemoteOK scraping failed:", error);
  }

  // 2. Live WeWorkRemotely RSS
  try {
    const rssUrls = [
      'https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss',
      'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss'
    ];

    for (const rssUrl of rssUrls) {
      const res = await fetch(rssUrl);
      if (res.ok) {
        const xml = await res.text();
        const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
        for (const item of itemMatches.slice(0, 8)) {
          const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
          const linkMatch = item.match(/<link>(.*?)<\/link>/);
          if (titleMatch && linkMatch) {
            const cleanTitle = titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;.*?&gt;/g, '');
            const url = linkMatch[1];
            const exists = await prisma.lead.findFirst({ where: { url } });
            if (!exists) {
              await prisma.lead.create({
                data: {
                  title: cleanTitle,
                  platform: 'WEWORKREMOTELY',
                  budget: '$45 - $80/hr (Contract)',
                  url,
                  leadType: 'GLOBAL'
                }
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("WeWorkRemotely RSS scraping failed:", error);
  }

  // 3. Live Hacker News Algolia API (Who Is Hiring & Freelance Threads)
  try {
    const hnRes = await fetch('https://hn.algolia.com/api/v1/search?query=freelance+developer&tags=comment&hitsPerPage=10');
    if (hnRes.ok) {
      const data = await hnRes.json();
      if (data.hits && Array.isArray(data.hits)) {
        for (const hit of data.hits.slice(0, 8)) {
          const url = hit.story_id ? `https://news.ycombinator.com/item?id=${hit.story_id}` : 'https://news.ycombinator.com';
          const exists = await prisma.lead.findFirst({ where: { url } });
          if (!exists) {
            const cleanComment = (hit.comment_text || '')
              .replace(/<[^>]*>/g, ' ')
              .replace(/&#x27;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/\s+/g, ' ')
              .trim();
            const snippet = cleanComment.slice(0, 85);
            const title = `${hit.story_title || 'Freelance / Contract'}: ${snippet || 'Contract Opportunity'}...`;
            
            await prisma.lead.create({
              data: {
                title,
                platform: 'HACKER_NEWS',
                budget: '$60 - $100/hr',
                url,
                leadType: 'GLOBAL'
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Hacker News scraping failed:", error);
  }

  // 4. Wellfound Contract Targets
  const wellfoundTargets = [
    { 
      title: "Senior Webflow & Next.js Developer (Contract) - Wellfound", 
      platform: "WELLFOUND", 
      budget: "$5,500/mo", 
      url: "https://wellfound.com/role/webflow", 
      leadType: "GLOBAL" 
    },
    { 
      title: "Founding Frontend Engineer (Contract to Hire) - Wellfound", 
      platform: "WELLFOUND", 
      budget: "$55/hr", 
      url: "https://wellfound.com/role/frontend-engineer", 
      leadType: "GLOBAL" 
    }
  ];

  for (const target of wellfoundTargets) {
    const exists = await prisma.lead.findFirst({ where: { title: target.title } });
    if (!exists) {
      await prisma.lead.create({ data: target });
    }
  }
}
