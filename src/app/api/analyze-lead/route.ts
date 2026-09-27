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
        "suggestedPrice": "Calculate a highly specific price in INR (₹) that falls strictly within their budget range. If their budget is USD ($), multiply it by 84 to convert to INR. VERY IMPORTANT: Do NOT pick a perfectly round number (like ₹40,000). Pick a highly specific, organic number (like ₹39,450 or ₹41,200) to make the bid look carefully calculated by a human based on exact difficulty. Give a 1-sentence justification for the price."
      }
    `;

    // Execute Groq Llama 3.1 70B
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.7, // Added higher temperature to ensure varied, organic responses
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

    const parseBudget = (budgetStr: string | null) => {
      if (!budgetStr) return { min: 0, max: 0, isUSD: false };
      
      const isUSD = budgetStr.includes('$') || budgetStr.toLowerCase().includes('usd');
      const noCommas = budgetStr.replace(/,/g, '');
      const numbers = noCommas.match(/\d+/g);
      
      if (!numbers) return { min: 0, max: 0, isUSD };
      if (numbers.length === 1) return { min: parseInt(numbers[0]), max: parseInt(numbers[0]), isUSD };
      
      return { 
        min: parseInt(numbers[0]), 
        max: parseInt(numbers[numbers.length - 1]), 
        isUSD 
      };
    };

    if (job.leadType === "LOCAL") {
      if (job.issueDetected === "NO_WEBSITE") {
        requirements = `• Build a modern 3-page landing site for a ${job.niche} business.\n• Implement a mobile-first design with a sticky "Call Now" button.\n• Integrate Google Maps & SEO tags to capture local traffic in ${job.district}.`;
        suggestedPrice = "₹24,500 (Base Setup) + ₹2,000/mo Maintenance. Reason: Standard 3-page sites are low complexity but offer immense local SEO value.";
      } else if (job.issueDetected === "NOT_MOBILE_FRIENDLY") {
        requirements = `• Perform a complete UI/UX responsive overhaul.\n• Rebuild the frontend using Tailwind CSS so it perfectly fits mobile screens.\n• Optimize image sizes to improve loading speeds for mobile users.`;
        suggestedPrice = "₹14,850 (Responsive Redesign). Reason: You are just modifying existing assets using Tailwind classes, which is low-to-medium difficulty.";
      } else {
        requirements = `• Conduct a technical performance audit.\n• Fix the "${job.issueDetected}" issue affecting their current site.\n• Migrate hosting or optimize their heavy theme for lightning-fast speeds.`;
        suggestedPrice = "₹28,200 (Technical Optimization). Reason: Server migrations and deep performance debugging require high-level technical expertise.";
      }
    } else {
      requirements = `• Develop a scalable MVP utilizing React/Next.js based on their request for "${job.title}".\n• Ensure clean component architecture and fast delivery.\n• Provide a 2-3 week roadmap to the client.`;
      
      const parsed = parseBudget(job.budget);
      if (parsed.max > 0) {
        const minINR = parsed.isUSD ? parsed.min * 84 : parsed.min;
        const maxINR = parsed.isUSD ? parsed.max * 84 : parsed.max;
        
        const titleLower = job.title.toLowerCase();
        let baseBid = 0;
        let reason = "";

        if (titleLower.includes("simple") || titleLower.includes("fix") || titleLower.includes("basic") || titleLower.includes("html") || titleLower.includes("wordpress")) {
           baseBid = minINR + ((maxINR - minINR) * 0.2); 
           reason = "Because this is a low-complexity task, bidding near their minimum budget guarantees you win the contract over greedy freelancers.";
        } else if (titleLower.includes("react") || titleLower.includes("app") || titleLower.includes("backend") || titleLower.includes("complex") || titleLower.includes("ecommerce")) {
           baseBid = maxINR * 0.9; 
           reason = "Because this requires complex full-stack architecture, we are pricing it near their maximum limit (but under to maintain a competitive edge).";
        } else {
           baseBid = (minINR + maxINR) / 2; 
           reason = "Because the technical difficulty is moderate, bidding the median of their budget signals a fair and honest estimation.";
        }
        
        // ADD ORGANIC RANDOM VARIANCE (± 4%) so bids never look robotic or repeated
        const variance = (Math.random() * 0.08) - 0.04; 
        let finalBid = baseBid * (1 + variance);
        
        // Round to nearest 50 rupees to make it look like a real human calculation (e.g., 31450 instead of 31457)
        finalBid = Math.round(finalBid / 50) * 50;
        
        if (job.budget?.includes("/hr") || job.budget?.includes("/mo")) {
          suggestedPrice = `Pitch their exact rate of ${job.budget}, but offer the first 5 hours risk-free to build absolute trust.`;
        } else {
          suggestedPrice = `Bid exactly ₹${finalBid.toLocaleString('en-IN')}. ${reason}`;
        }
      } else {
        suggestedPrice = "Offer a Free Discovery Call to audit their complexity, then pitch ₹29,500+ for the MVP.";
      }
    }

    return NextResponse.json({ requirements, suggestedPrice });
  }
}
