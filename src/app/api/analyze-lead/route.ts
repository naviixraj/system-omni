export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize the lightning-fast Groq AI Engine
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

export async function POST(req: Request) {
  const job = await req.json();

  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("Missing Groq API Key"); 
    }

    const prompt = `
      You are an elite, senior freelance web developer in India analyzing a new lead.
      Here are the details of the job/client:
      - Title/Name: ${job.title}
      - Platform: ${job.platform}
      - Lead Type: ${job.leadType}
      - Budget Listed: ${job.budget || 'Not specified'}
      - District/Location: ${job.district || 'Remote'}
      - Niche: ${job.niche || 'Web Development'}
      - Detected Issue: ${job.issueDetected || 'None'}

      Your goal is to tell the freelancer exactly what to build to win this client, and exactly what to charge based on the specific work.
      
      Respond in STRICT JSON format with exactly these two keys:
      {
        "requirements": "Write a simple but properly explained technical breakdown of the project. Use 2-3 bullet points explaining exactly what features to build.",
        "suggestedPrice": "Calculate a specific total price in INR (₹). VERY IMPORTANT: The budget '${job.budget}' could be in ANY global currency (USD, EUR, GBP, AUD, SGD, AED, etc). You MUST use your knowledge to perfectly convert their specific currency into Indian Rupees (INR). Break this total INR bid down into 2-3 line items based on the SPECIFIC PROJECT WORK (e.g., 'Total Bid: ₹63,450. Breakdown: UI Design (₹20,000), React Frontend (₹30,000), Database Setup (₹13,450)')."
      }
    `;

    // Execute Groq Llama 3.1 8B Instant (Current & Lightning Fast)
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
      temperature: 0.7, 
    });

    const text = chatCompletion.choices[0]?.message?.content || "{}";
    
    // Safely parse JSON
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(cleanJson);

    return NextResponse.json(aiData);
    
  } catch (error: any) {
    console.warn("Groq AI Analysis Failed, executing Local Intelligence Fallback Engine...", error.message);

    // ==========================================
    // FAIL-SAFE LOCAL FALLBACK ENGINE
    // ==========================================
    let requirements = "";
    let suggestedPrice = "";

    const parseBudget = (budgetStr: string | null) => {
      if (!budgetStr) return { min: 0, max: 0, multiplier: 1 };
      
      let multiplier = 1; 
      const lower = budgetStr.toLowerCase();
      
      // Comprehensive Global Currency Map to INR (₹)
      const rates: Record<string, number> = {
        'usd': 84, '$': 84,
        'eur': 92, '€': 92,
        'gbp': 107, '£': 107,
        'aud': 55, 'a$': 55,
        'cad': 62, 'c$': 62,
        'sgd': 63, 's$': 63,
        'aed': 23, 'dirham': 23,
        'nzd': 51, 'nz$': 51,
        'chf': 95, 'franc': 95,
        'jpy': 0.56, '¥': 0.56,
        'cny': 11.6, 'rmb': 11.6,
        'zar': 4.4, 'rand': 4.4,
        'sar': 22.4,
        'inr': 1, '₹': 1, 'rs': 1
      };

      // Detect the exact currency
      let detected = false;
      for (const [key, rate] of Object.entries(rates)) {
        if (lower.includes(key)) {
          multiplier = rate;
          detected = true;
          break;
        }
      }
      
      const noCommas = budgetStr.replace(/,/g, '');
      const numbers = noCommas.match(/\d+(\.\d+)?/g);
      
      if (!numbers) return { min: 0, max: 0, multiplier };
      
      const min = parseFloat(numbers[0]);
      const max = parseFloat(numbers[numbers.length - 1]);
      
      // Failsafe: If no explicit currency found, but max is suspiciously low, default to USD
      if (!detected && max < 5000) {
        multiplier = 84; 
      }
      
      return { min, max, multiplier };
    };

    if (job.leadType === "LOCAL") {
      if (job.issueDetected === "NO_WEBSITE") {
        requirements = `• Build a modern 3-page landing site for a ${job.niche} business.\n• Implement a mobile-first design with a sticky "Call Now" button.\n• Integrate Google Maps & SEO tags to capture local traffic in ${job.district}.`;
        suggestedPrice = "Total Bid: ₹28,500. Breakdown: UI/UX Design (₹8,500), Frontend Development (₹15,000), Google Maps SEO (₹5,000).";
      } else if (job.issueDetected === "NOT_MOBILE_FRIENDLY") {
        requirements = `• Perform a complete UI/UX responsive overhaul.\n• Rebuild the frontend using Tailwind CSS so it perfectly fits mobile screens.\n• Optimize image sizes to improve loading speeds for mobile users.`;
        suggestedPrice = "Total Bid: ₹16,450. Breakdown: Mobile UI Audit (₹4,000), Tailwind CSS Overhaul (₹12,450).";
      } else {
        requirements = `• Conduct a technical performance audit.\n• Fix the "${job.issueDetected}" issue affecting their current site.\n• Migrate hosting or optimize their heavy theme for lightning-fast speeds.`;
        suggestedPrice = "Total Bid: ₹22,100. Breakdown: Technical Audit (₹5,000), Server/Theme Optimization (₹17,100).";
      }
    } else {
      requirements = `• Develop a scalable MVP utilizing React/Next.js based on their request for "${job.title}".\n• Ensure clean component architecture and fast delivery.\n• Provide a 2-3 week roadmap to the client.`;
      
      const parsed = parseBudget(job.budget);
      if (parsed.max > 0) {
        // Convert to INR perfectly using the massive currency dictionary
        const minINR = parsed.min * parsed.multiplier;
        const maxINR = parsed.max * parsed.multiplier;
        
        const titleLower = job.title.toLowerCase();
        let baseBid = 0;
        let breakdown = "";

        if (titleLower.includes("simple") || titleLower.includes("fix") || titleLower.includes("basic") || titleLower.includes("html") || titleLower.includes("wordpress")) {
           baseBid = minINR + ((maxINR - minINR) * 0.2); 
           const p1 = Math.round((baseBid * 0.4) / 50) * 50;
           const p2 = Math.round((baseBid * 0.6) / 50) * 50;
           breakdown = `UI Fixes (₹${p1.toLocaleString('en-IN')}), Implementation (₹${p2.toLocaleString('en-IN')})`;
        } else if (titleLower.includes("react") || titleLower.includes("app") || titleLower.includes("backend") || titleLower.includes("complex") || titleLower.includes("ecommerce")) {
           baseBid = maxINR * 0.9; 
           const p1 = Math.round((baseBid * 0.3) / 50) * 50;
           const p2 = Math.round((baseBid * 0.5) / 50) * 50;
           const p3 = Math.round((baseBid * 0.2) / 50) * 50;
           breakdown = `Frontend React (₹${p1.toLocaleString('en-IN')}), Backend Architecture (₹${p2.toLocaleString('en-IN')}), Deployment (₹${p3.toLocaleString('en-IN')})`;
        } else {
           baseBid = (minINR + maxINR) / 2; 
           const p1 = Math.round((baseBid * 0.4) / 50) * 50;
           const p2 = Math.round((baseBid * 0.6) / 50) * 50;
           breakdown = `Component Design (₹${p1.toLocaleString('en-IN')}), Logic & Integration (₹${p2.toLocaleString('en-IN')})`;
        }
        
        const variance = (Math.random() * 0.08) - 0.04; 
        let finalBid = baseBid * (1 + variance);
        finalBid = Math.round(finalBid / 50) * 50;
        
        if (job.budget?.includes("/hr") || job.budget?.includes("/mo")) {
          suggestedPrice = `Total: ${job.budget}. Breakdown: Hourly rate changes based on tasks (e.g. Frontend work billed standard, Backend work billed at +15% premium).`;
        } else {
          suggestedPrice = `Total Bid: ₹${finalBid.toLocaleString('en-IN')}. Breakdown: ${breakdown}.`;
        }
      } else {
        suggestedPrice = "Total Bid: ₹30,000+. Breakdown: Discovery Phase (₹5,000), Core Development (₹25,000+ depending on exact features).";
      }
    }

    return NextResponse.json({ requirements, suggestedPrice });
  }
}
