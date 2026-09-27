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

      Your goal is to tell the freelancer exactly what to build to win this client, and exactly what to charge.
      
      Respond in STRICT JSON format with exactly these two keys:
      {
        "requirements": "Write a simple but properly explained technical breakdown of the project. Use 2-3 bullet points explaining exactly what features to build.",
        "suggestedPrice": "Write the exact price range to pitch in INR (₹). If their budget is in USD ($), multiply it by 84 to convert to INR. If it is already INR (₹), use that base to suggest a smart, competitive bid slightly under their max. Give a 1-sentence justification."
      }
    `;

    // Execute Groq Llama 3 70B
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const text = chatCompletion.choices[0]?.message?.content || "{}";
    
    // Safely parse JSON in case Groq includes markdown ticks
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

    // FIXED: Smart budget parser that prevents massive numbers and handles INR/USD correctly
    const parseBudget = (budgetStr: string | null) => {
      if (!budgetStr) return { max: 0, isUSD: false };
      
      const isUSD = budgetStr.includes('$') || budgetStr.toLowerCase().includes('usd');
      const noCommas = budgetStr.replace(/,/g, '');
      const numbers = noCommas.match(/\d+/g);
      
      if (!numbers) return { max: 0, isUSD };
      
      // Take the last number in the string (e.g. "12500 - 37500" -> 37500)
      const maxNumber = parseInt(numbers[numbers.length - 1]);
      return { max: maxNumber, isUSD };
    };

    if (job.leadType === "LOCAL") {
      if (job.issueDetected === "NO_WEBSITE") {
        requirements = `• Build a modern 3-page landing site for a ${job.niche} business.\n• Implement a mobile-first design with a sticky "Call Now" button.\n• Integrate Google Maps & SEO tags to capture local traffic in ${job.district}.`;
        suggestedPrice = "₹25,000 - ₹35,000 (Base Setup) + ₹2,000/mo Maintenance";
      } else if (job.issueDetected === "NOT_MOBILE_FRIENDLY") {
        requirements = `• Perform a complete UI/UX responsive overhaul.\n• Rebuild the frontend using Tailwind CSS so it perfectly fits mobile screens.\n• Optimize image sizes to improve loading speeds for mobile users.`;
        suggestedPrice = "₹15,000 - ₹25,000 (Responsive Redesign)";
      } else {
        requirements = `• Conduct a technical performance audit.\n• Fix the "${job.issueDetected}" issue affecting their current site.\n• Migrate hosting or optimize their heavy theme for lightning-fast speeds.`;
        suggestedPrice = "₹20,000 - ₹30,000 (Technical Optimization)";
      }
    } else {
      requirements = `• Develop a scalable MVP utilizing React/Next.js based on their request for "${job.title}".\n• Ensure clean component architecture and fast delivery.\n• Provide a 2-3 week roadmap to the client.`;
      
      const parsed = parseBudget(job.budget);
      if (parsed.max > 0) {
        // Convert to INR only if it was originally USD
        const maxINR = parsed.isUSD ? parsed.max * 84 : parsed.max;
        const competitiveBid = Math.floor(maxINR * 0.9); // Bid 10% under max
        
        if (job.budget?.includes("/hr") || job.budget?.includes("/mo")) {
          suggestedPrice = `Pitch their exact rate of ${job.budget}, but offer the first 5 hours risk-free to build absolute trust.`;
        } else {
          suggestedPrice = `Bid roughly ₹${competitiveBid.toLocaleString('en-IN')} (10% under their max) to win on value while keeping high margins.`;
        }
      } else {
        suggestedPrice = "Offer a Free Discovery Call, then pitch ₹30,000+ for the MVP.";
      }
    }

    return NextResponse.json({ requirements, suggestedPrice });
  }
}
