import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { title, platform, leadType, district } = await req.json();
    
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    let pitch = "";

    if (leadType === "LOCAL") {
      pitch = `Hi ${title} team,\n\nI noticed your business while searching for top-rated services in ${district}. You have great reviews, but I saw your website is currently flagged as having issues.\n\nI am a local web developer and I'd love to help you rebuild a blazing-fast, mobile-friendly site that actually converts your Google Maps traffic into paying customers. Are you open to a quick 5-minute chat this week?`;
    } else {
      pitch = `Hi there,\n\nI just saw your post for "${title}" on ${platform}. I specialize in exactly this kind of web development and have successfully delivered similar projects.\n\nI can start immediately and ensure a highly responsive, modern solution. I'd love to jump on a quick call to discuss your exact timeline and requirements.\n\nBest,\n[Your Name]`;
    }

    return NextResponse.json({ pitch });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate pitch' }, { status: 500 });
  }
}
