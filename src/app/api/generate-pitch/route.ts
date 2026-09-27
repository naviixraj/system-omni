import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const job = await req.json();
    const { title, platform, leadType, district, url } = job;
    
    let auditContext = "";
    
    // If it's a local business with a website, perform a deep audit first to get facts for the AI
    if (leadType === "LOCAL" && url) {
      try {
        const host = req.headers.get("host") || "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";
        const auditRes = await fetch(`${protocol}://${host}/api/deep-audit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url })
        });
        
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          if (auditData.report) {
            const failedChecks = auditData.report
              .filter((r: any) => r.status === 'fail' || r.status === 'warn')
              .map((r: any) => `- ${r.title}: ${r.message}`)
              .join('\n');
            
            if (failedChecks) {
              auditContext = `I audited their website (${url}) and found these specific technical errors:\n${failedChecks}\n\n`;
            }
          }
        }
      } catch (err) {
        console.error("Internal deep audit failed:", err);
      }
    }

    const systemPrompt = `You are an expert, highly persuasive freelance web developer.
Your goal is to write a short, punchy, and aggressive cold email to a potential client.
You must be highly specific, professional, and convincing.
Do NOT use generic placeholders like [Your Name]. Just write the body of the email.
${auditContext ? "Crucially: Mention the specific technical errors found on their website to prove you are an expert, and explain how fixing them will increase their sales." : ""}`;

    const userPrompt = leadType === "LOCAL" 
      ? `Write a cold email to the owner of "${title}", a local business in ${district}. ${auditContext ? auditContext : "Their website has issues or they don't have one."} Offer to rebuild their website so it converts local Google Maps traffic into paying customers.`
      : `Write a customized proposal for a freelance job titled "${title}" posted on ${platform}. I specialize in modern web development and want to jump on a quick 5-minute call to discuss their exact timeline.`;

    // Call Groq Llama-3 API
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("No Groq API Key found");

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      throw new Error(`Groq API returned ${groqRes.status}: ${errText}`);
    }

    const groqData = await groqRes.json();
    const pitch = groqData.choices[0].message.content.trim();

    return NextResponse.json({ pitch });
  } catch (error) {
    console.error("AI Pitch Generation Error:", error);

    // ==========================================
    // DYNAMIC LOCAL FALLBACK ENGINE
    // ==========================================
    let pitch = "";

    if (leadType === "LOCAL") {
      let specificIssue = "a few critical technical errors";
      let solution = "rebuild a blazing-fast, mobile-friendly site";
      
      if (auditContext.includes("viewport")) {
        specificIssue = "that your website is not properly formatted for mobile devices (missing viewport tags)";
        solution = "overhaul your site with a Tailwind CSS mobile-first design";
      } else if (auditContext.includes("load")) {
        specificIssue = "that your website is extremely slow to load (taking over 3 seconds)";
        solution = "rebuild your frontend in React/Next.js so it loads instantly";
      } else if (auditContext.includes("SSL") || auditContext.includes("HTTPS")) {
        specificIssue = "a major security flaw (missing SSL certificate) which scares away customers";
        solution = "secure and rebuild your infrastructure";
      } else if (auditContext && !url) {
        specificIssue = "that you don't even have a website listed on Google Maps for your business";
        solution = "build you a highly-converting, modern landing page";
      }

      pitch = `Hi ${title} Team,\n\nI was looking up local businesses in ${district} and noticed your stellar reviews. However, I ran a quick audit on your online presence and saw ${specificIssue}.\n\nWhen local customers find you on Google Maps, this issue causes a massive drop-off in sales. I am a specialized web developer based right here, and I'd love to help you ${solution} to start converting more traffic.\n\nAre you open to a quick 5-minute chat this week?`;
    } else {
      pitch = `Hi there,\n\nI just saw your post for "${title}" on ${platform}. I specialize in exactly this kind of web development and have successfully delivered similar complex projects recently.\n\nI can start immediately and ensure a highly responsive, scalable solution. I'd love to jump on a quick call to discuss your exact timeline and requirements.\n\nBest,\nNavi`;
    }

    return NextResponse.json({ pitch });
  }
}
