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
        model: "llama3-8b-8192", // Using Llama 3 for blazing fast generation
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    if (!groqRes.ok) {
      throw new Error(`Groq API returned ${groqRes.status}`);
    }

    const groqData = await groqRes.json();
    const pitch = groqData.choices[0].message.content.trim();

    return NextResponse.json({ pitch });
  } catch (error) {
    console.error("AI Pitch Generation Error:", error);
    // Fallback if API fails
    return NextResponse.json({ pitch: "Hi there,\n\nI noticed your business recently and saw that your website could use some technical optimization to help convert more local traffic. I'm a specialized web developer and I'd love to help you fix these issues and rebuild a blazing-fast site.\n\nAre you open to a quick 5-minute chat this week?" });
  }
}
