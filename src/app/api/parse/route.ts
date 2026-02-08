import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { WORDS_PER_MINUTE } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Fetch the page
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
      response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; Marginalia/1.0; +https://marginalia.app)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
    } catch (err) {
      clearTimeout(timeout);
      const message = err instanceof Error && err.name === 'AbortError'
        ? 'Request timed out'
        : 'Failed to fetch the URL';
      return NextResponse.json({ error: message }, { status: 502 });
    }
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: HTTP ${response.status}` },
        { status: 502 }
      );
    }

    const html = await response.text();

    // Parse with JSDOM + Readability
    const dom = new JSDOM(html, { url: parsedUrl.toString() });
    const doc = dom.window.document;

    // Extract Open Graph metadata
    const ogTitle =
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    const ogDescription =
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      '';
    const ogImage =
      doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
    const ogSiteName =
      doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || '';

    // Parse readable content
    const reader = new Readability(doc);
    const article = reader.parse();

    if (!article) {
      return NextResponse.json(
        { error: 'Could not extract article content. Try pasting the text manually.' },
        { status: 422 }
      );
    }

    // Calculate reading time
    const textContent = article.textContent || '';
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));

    // Build excerpt
    const excerpt = (article.excerpt || ogDescription || textContent.slice(0, 200)).slice(
      0,
      200
    );

    // Resolve relative image URL
    let thumbnail = ogImage;
    if (thumbnail && !thumbnail.startsWith('http')) {
      try {
        thumbnail = new URL(thumbnail, parsedUrl.toString()).toString();
      } catch {
        thumbnail = '';
      }
    }

    return NextResponse.json({
      title: article.title || ogTitle || parsedUrl.hostname,
      content: article.content || '',
      excerpt: excerpt.trim(),
      thumbnail,
      siteName: ogSiteName || article.siteName || parsedUrl.hostname,
      readingTime,
    });
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while parsing the article.' },
      { status: 500 }
    );
  }
}
