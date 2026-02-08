import { NextRequest, NextResponse } from 'next/server';
import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';
import { WORDS_PER_MINUTE } from '@/lib/constants';

export const maxDuration = 30; // Allow up to 30s on Vercel

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = body?.url;

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
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
    } catch (err) {
      clearTimeout(timeout);
      const message =
        err instanceof Error && err.name === 'AbortError'
          ? 'Request timed out. The site may be slow or blocking requests.'
          : 'Failed to fetch the URL. Please check the link and try again.';
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

    if (!html || html.length < 100) {
      return NextResponse.json(
        { error: 'The page returned very little content. It may require JavaScript to load.' },
        { status: 422 }
      );
    }

    // Parse with linkedom (lightweight, serverless-compatible)
    const { document } = parseHTML(html);

    // Set documentURI for Readability (it needs this for relative URL resolution)
    Object.defineProperty(document, 'documentURI', {
      value: parsedUrl.toString(),
      writable: false,
    });

    // Extract Open Graph metadata before Readability mutates the DOM
    const ogTitle =
      document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    const ogDescription =
      document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      document.querySelector('meta[name="description"]')?.getAttribute('content') ||
      '';
    const ogImage =
      document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
    const ogSiteName =
      document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || '';

    // Parse readable content
    const reader = new Readability(document as unknown as Document);
    const article = reader.parse();

    if (!article || !article.content) {
      return NextResponse.json(
        {
          error:
            'Could not extract article content from this page. The site may be behind a paywall or require JavaScript.',
        },
        { status: 422 }
      );
    }

    // Calculate reading time
    const textContent = article.textContent || '';
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));

    // Build excerpt
    const excerpt = (
      article.excerpt ||
      ogDescription ||
      textContent.slice(0, 200)
    ).slice(0, 200);

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
      content: article.content,
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
