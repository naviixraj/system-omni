export const dynamic = 'force-static';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let targetUrl = url;
    if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl;
    }

    const report = [];
    
    // 1. SSL Security Check
    const isSecure = targetUrl.startsWith('https://');
    if (!isSecure) {
      report.push({
        id: 'ssl',
        status: 'fail',
        title: 'Security Vulnerability',
        message: 'Website is missing a valid SSL Certificate (Not Secure).'
      });
    } else {
      report.push({
        id: 'ssl',
        status: 'pass',
        title: 'SSL Certificate',
        message: 'Website is securely encrypted.'
      });
    }

    // Ping and fetch HTML
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const startTime = performance.now();
    let response;
    try {
      response = await fetch(targetUrl, { 
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
    } catch (err) {
      return NextResponse.json({ 
        report: [{
          id: 'fatal',
          status: 'fail',
          title: 'Fatal Server Error',
          message: 'The website server is down, blocking connections, or does not exist.'
        }] 
      });
    }
    const endTime = performance.now();
    clearTimeout(timeoutId);

    const loadTimeMs = Math.round(endTime - startTime);
    const loadTimeSeconds = (loadTimeMs / 1000).toFixed(2);

    // 2. Performance Check
    if (loadTimeMs > 3500) {
      report.push({
        id: 'speed',
        status: 'fail',
        title: 'Critical Speed Issue',
        message: `Server response took ${loadTimeSeconds}s (Should be under 1.5s).`
      });
    } else if (loadTimeMs > 1500) {
      report.push({
        id: 'speed',
        status: 'warn',
        title: 'Suboptimal Speed',
        message: `Server response took ${loadTimeSeconds}s. Could be optimized.`
      });
    } else {
      report.push({
        id: 'speed',
        status: 'pass',
        title: 'Fast Server Response',
        message: `Server responded in a healthy ${loadTimeSeconds}s.`
      });
    }

    const html = await response.text();
    const htmlLower = html.toLowerCase();

    // 3. Mobile UX (Viewport)
    if (!htmlLower.includes('meta name="viewport"')) {
      report.push({
        id: 'viewport',
        status: 'fail',
        title: 'Mobile Unresponsive',
        message: 'Missing viewport meta tag. Website will look broken on iPhones and Androids.'
      });
    } else {
      report.push({
        id: 'viewport',
        status: 'pass',
        title: 'Mobile Viewport',
        message: 'Viewport tag is present for mobile scaling.'
      });
    }

    // 4. SEO - Title Tag
    if (!htmlLower.includes('<title>') || htmlLower.includes('<title></title>')) {
      report.push({
        id: 'title',
        status: 'fail',
        title: 'SEO Penalty: Missing Title',
        message: 'The homepage is missing a meta title, destroying Google Search rankings.'
      });
    } else {
      report.push({
        id: 'title',
        status: 'pass',
        title: 'SEO Title',
        message: 'Title tag is present.'
      });
    }

    // 5. SEO - H1 Tag
    if (!htmlLower.includes('<h1')) {
      report.push({
        id: 'h1',
        status: 'fail',
        title: 'SEO Penalty: Missing H1',
        message: 'No <h1> tag found. Search engines cannot understand the page topic.'
      });
    } else {
      report.push({
        id: 'h1',
        status: 'pass',
        title: 'SEO H1 Heading',
        message: 'Primary H1 heading is present.'
      });
    }

    // 6. Accessibility - Image Alt Tags (Basic regex check)
    const imgCount = (htmlLower.match(/<img/g) || []).length;
    const altCount = (htmlLower.match(/alt=["'].*?["']/g) || []).length;
    
    if (imgCount > 0 && altCount < imgCount) {
      report.push({
        id: 'alt',
        status: 'warn',
        title: 'Accessibility Warning',
        message: `Found ${imgCount - altCount} images missing 'alt' text. Bad for SEO & screen readers.`
      });
    } else if (imgCount > 0) {
      report.push({
        id: 'alt',
        status: 'pass',
        title: 'Image Accessibility',
        message: 'Images have alt text.'
      });
    }

    return NextResponse.json({ report });

  } catch (error) {
    console.error('Deep Audit API Error:', error);
    return NextResponse.json({ error: 'Failed to perform deep audit' }, { status: 500 });
  }
}
