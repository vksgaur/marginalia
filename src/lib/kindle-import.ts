import { nanoid } from 'nanoid';
import { db } from './db';
import type { Highlight } from './types';

interface KindleClipping {
  title: string;
  author: string;
  text: string;
  location: string;
  date: string;
}

export function parseKindleClippings(content: string): KindleClipping[] {
  const clippings: KindleClipping[] = [];
  const entries = content.split('==========');

  for (const entry of entries) {
    const lines = entry.trim().split('\n').filter(Boolean);
    if (lines.length < 3) continue;

    // First line: "Title (Author)"
    const titleLine = lines[0].trim();
    const authorMatch = titleLine.match(/\(([^)]+)\)\s*$/);
    const author = authorMatch ? authorMatch[1] : '';
    const title = authorMatch
      ? titleLine.replace(/\s*\([^)]+\)\s*$/, '')
      : titleLine;

    // Second line: "- Your Highlight on Location 123-456 | Added on ..."
    const metaLine = lines[1].trim();
    const locationMatch = metaLine.match(/Location\s+([\d-]+)/i);
    const location = locationMatch ? locationMatch[1] : '';
    const dateMatch = metaLine.match(/Added on\s+(.+)/i);
    const date = dateMatch ? dateMatch[1] : '';

    // Skip bookmarks (no text content)
    if (metaLine.includes('Bookmark')) continue;

    // Remaining lines: highlight text
    const text = lines.slice(2).join('\n').trim();
    if (!text) continue;

    clippings.push({ title, author, text, location, date });
  }

  return clippings;
}

export async function importKindleClippings(content: string): Promise<{
  highlights: number;
  articles: number;
}> {
  const clippings = parseKindleClippings(content);

  // Group by title
  const byTitle = new Map<string, KindleClipping[]>();
  for (const clip of clippings) {
    const existing = byTitle.get(clip.title) || [];
    existing.push(clip);
    byTitle.set(clip.title, existing);
  }

  let highlightCount = 0;
  let articleCount = 0;

  for (const [title, clips] of byTitle.entries()) {
    // Check if article already exists (by title for Kindle imports)
    let article = await db.articles
      .filter((a) => a.title === title)
      .first();

    if (!article) {
      const id = nanoid();
      article = {
        id,
        url: `kindle://${encodeURIComponent(title)}`,
        title,
        content: `<p><em>Imported from Kindle — ${clips[0].author || 'Unknown Author'}</em></p>`,
        excerpt: `Kindle highlights from "${title}"`,
        thumbnail: '',
        siteName: 'Kindle',
        isRead: true,
        isFavorite: false,
        isArchived: false,
        readProgress: 100,
        readingTime: 0,
        folderId: null,
        tags: ['kindle'],
        readCount: 0,
        totalReadTime: 0,
        lastReadAt: null,
        dateAdded: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        syncStatus: 'pending',
        userId: null,
      };
      await db.articles.add(article);
      articleCount++;
    }

    // Add highlights
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      // Check for duplicate by text
      const existingHighlight = await db.highlights
        .where('articleId')
        .equals(article.id)
        .filter((h) => h.text === clip.text)
        .first();

      if (!existingHighlight) {
        const highlight: Highlight = {
          id: nanoid(),
          articleId: article.id,
          text: clip.text,
          color: 'yellow',
          note: '',
          tags: [],
          paragraphIndex: i,
          startOffset: 0,
          endOffset: clip.text.length,
          collectionId: null,
          timestamp: clip.date ? new Date(clip.date).toISOString() : new Date().toISOString(),
          lastModified: new Date().toISOString(),
          userId: null,
        };
        await db.highlights.add(highlight);
        highlightCount++;
      }
    }
  }

  return { highlights: highlightCount, articles: articleCount };
}
