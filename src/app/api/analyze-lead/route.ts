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

      Your goal is to tell the freelancer exactly what to build to win this client, and exactly what to charge in INR (₹).
      
      Respond in STRICT JSON format with exactly these two keys:
      {
        "requirements": "Write a 2-3 sentence strategic breakdown of exactly what tech stack and features to pitch to this specific client to solve their problem.",
        "suggestedPrice": "Write the exact price range in INR (e.g. '₹25,000 - ₹35,000') and a 1-sentence justification on why."
      }
    `;

    // Execute Groq Llama 3 70B (Insanely Fast Inference)
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const text = chatCompletion.choices[0]?.message?.content || "{}";
    const aiData = JSON.parse(text);

    return NextResponse.json(aiData);
    
  } catch (error: any) {
    console.warn("AI Analysis Failed or Unavailable, executing Local Intelligence Fallback Engine...", error.message);

    // ==========================================
    // FAIL-SAFE LOCAL FALLBACK ENGINE
    // ==========================================
    let requirements = "";
    let suggestedPrice = "";

    const parseBudget = (budgetStr: string | null) => {
      if (!budgetStr) return 0;
      const digits = budgetStr.replace(/[^0-9]/g, '');
      return digits ? parseInt(digits) : 0;
    };

    if (job.leadType === "LOCAL") {
      if (job.issueDetected === "NO_WEBSITE") {
        requirements = `A modern, high-converting 3-to-5 page website for a local ${job.niche} business. Needs a mobile-first design, clear "Call to Action" buttons (Call Now / Book Appointment), and Google Maps integration to capture local SEO traffic in ${job.district}.`;
        suggestedPrice = "₹25,000 - ₹35,000 (Setup) + ₹2,000/mo (Maintenance)";
      } else if (job.issueDetected === "NOT_MOBILE_FRIENDLY") {
        requirements = `A complete UI/UX overhaul. The current site is losing customers on phones. Rebuild the frontend using responsive Tailwind CSS. Focus on improving the navigation menu for touch screens and optimizing image sizes.`;
        suggestedPrice = "₹15,000 - ₹25,000 (Redesign)";
      } else {
        requirements = `Performance and technical audit. The site is currently facing "${job.issueDetected}" issues. Migrate them to a faster hosting provider or rebuild the heavy WordPress theme into a lightning-fast Next.js architecture.`;
        suggestedPrice = "₹20,000 - ₹30,000 (Migration & Optimization)";
      }
    } else {
      requirements = `Based on the request "${job.title}", you need to deliver exactly what they asked for using a modern scalable tech stack (React/Next.js). Ensure you highlight your ability to communicate daily and deliver the MVP within 2-3 weeks to stand out.`;
      
      const numericalBudget = parseBudget(job.budget);
      if (numericalBudget > 0) {
        if (job.budget?.includes("/hr") || job.budget?.includes("/mo")) {
          suggestedPrice = `Bid their exact rate: ${job.budget}, but offer the first 5 hours as a risk-free trial to build trust.`;
        } else {
          suggestedPrice = `Bid roughly ₹${(numericalBudget * 80 * 0.9).toLocaleString('en-IN')} (10% under their max) to win on competitive value while maintaining high margins.`;
        }
      } else {
        suggestedPrice = "Offer a Phase 1 Discovery Call for Free, then pitch ₹30,000+ for the MVP.";
      }
    }

    return NextResponse.json({ requirements, suggestedPrice });
  }
}
