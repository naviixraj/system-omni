import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Gemini AI (100% Free Developer Tier)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const job = await req.json();

    // If no API key is provided, we return a fallback response asking the user to add it.
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        requirements: "SYSTEM ALERT: Gemini API Key is missing. Please add your free GEMINI_API_KEY to the .env file to enable true AI analysis.",
        suggestedPrice: "API KEY REQUIRED" 
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // We build a highly intelligent prompt for the AI
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
      
      Respond in STRICT JSON format with no markdown, no \`\`\` blocks, and no extra text. Just this exact structure:
      {
        "requirements": "Write a 2-3 sentence strategic breakdown of exactly what tech stack and features to pitch to this specific client to solve their problem.",
        "suggestedPrice": "Write the exact price range in INR (e.g. '₹25,000 - ₹35,000') and a 1-sentence justification on why."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up the response in case Gemini adds markdown blocks like ```json
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(cleanJson);

    return NextResponse.json(aiData);
    
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return NextResponse.json({ 
      requirements: "The AI encountered an error while analyzing this lead. Please try again.", 
      suggestedPrice: "ERROR" 
    }, { status: 500 });
  }
}
