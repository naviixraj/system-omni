export const dynamic = 'force-static';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const job = await req.json();
    const { title, platform, leadType, district, url, issueDetected } = job;
    
    let auditContext = "";
    
    if (leadType === "LOCAL") {
      if (issueDetected === 'NOT_MOBILE_FRIENDLY') {
        auditContext = `The website is not mobile-friendly and lacks responsive viewport scaling, which costs them mobile visitors.`;
      } else if (issueDetected === 'SLOW_LOAD') {
        auditContext = `The website takes over 3 seconds to load, causing significant bounce rates.`;
      } else if (issueDetected === 'ERROR') {
        auditContext = `The website currently throws a server error or is offline, meaning visitors cannot access their business.`;
      } else if (issueDetected === 'NO_WEBSITE') {
        auditContext = `The business currently has no website listed on Google Maps, losing potential customers to competitors.`;
      }
    }

    const systemPrompt = `You are an expert, highly persuasive freelance web developer.
Your goal is to write a short, punchy, and aggressive cold email to a potential client.
You must be highly specific, professional, and convincing.
Do NOT use generic placeholders like [Your Name]. Just write the body of the email.
${auditContext ? `Crucially mention this technical issue: ${auditContext}` : ""}`;

    const userPrompt = leadType === "LOCAL" 
      ? `Write a cold email to the owner of "${title}", a local business in ${district || 'your area'}. ${auditContext ? `Issue: ${auditContext}` : "Offer to rebuild their website so it converts traffic into paying customers."}`
      : `Write a customized proposal for a freelance job titled "${title}" posted on ${platform}. I specialize in modern web development and want to jump on a quick 5-minute call to discuss their exact timeline.`;

    let pitch = "";

    // 1. Try Groq AI if key is available
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 400
          })
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          pitch = groqData.choices?.[0]?.message?.content?.trim() || "";
        }
      } catch (apiErr) {
        console.warn("Groq API call failed, using intelligent fallback...", apiErr);
      }
    }

    // 2. High-converting Dynamic Fallback Engine if AI didn't return a pitch
    if (!pitch) {
      if (leadType === "LOCAL") {
        let specificIssue = "a few critical technical flaws on your online presence";
        let solution = "rebuild a blazing-fast, high-converting website in Next.js & Tailwind CSS";
        
        if (issueDetected === "NOT_MOBILE_FRIENDLY") {
          specificIssue = "that your website is not properly formatted for mobile devices, causing high bounce rates";
          solution = "overhaul your site with a sleek, mobile-first responsive design";
        } else if (issueDetected === "SLOW_LOAD") {
          specificIssue = "that your website takes over 3 seconds to load, losing valuable customers";
          solution = "rebuild your frontend so it loads instantly with a 95+ Google PageSpeed score";
        } else if (issueDetected === "ERROR") {
          specificIssue = "a critical error preventing your website from loading when customers search for you";
          solution = "restore and modernize your website on fast, reliable cloud infrastructure";
        } else if (issueDetected === "NO_WEBSITE") {
          specificIssue = "that you don't currently have an official website linked to your Google Business profile";
          solution = "build a modern, search-optimized landing page so you capture all local search traffic";
        }

        pitch = `Hi ${title} Team,\n\nI reviewed your business presence in ${district || 'your area'} and noticed ${specificIssue}.\n\nWhen local clients search for your services, this causes a major drop-off in inquiries. As a specialized web developer, I would love to help you ${solution} to immediately boost your client conversions.\n\nWould you be open to a quick 5-minute chat this week to review a quick preview?\n\nBest regards,\nNavi`;
      } else {
        pitch = `Hi there,\n\nI just reviewed your project listing for "${title}" on ${platform}. I specialize in modern full-stack web development (React, Next.js, Node.js, Tailwind CSS) and have built similar high-performance applications.\n\nI can start immediately and deliver a clean, production-ready solution within your timeline. Let me know if you would be open to a quick 5-minute call to discuss the project scope.\n\nBest regards,\nNavi`;
      }
    }

    return NextResponse.json({ pitch });
  } catch (error) {
    console.error("Critical Pitch Generation Error:", error);
    return NextResponse.json({ 
      pitch: `Hi there,\n\nI reviewed your requirements and would love to help you build and launch a high-converting solution. I specialize in modern web development and can deliver this cleanly within your budget and timeline.\n\nLet's connect for a brief 5-minute chat to discuss the details!` 
    });
  }
}
