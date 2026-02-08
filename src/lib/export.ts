import { db } from './db';
import { HIGHLIGHT_COLORS } from './constants';
import type { Highlight } from './types';

export async function exportHighlightsAsMarkdown(articleId: string): Promise<string> {
  const article = await db.articles.get(articleId);
  if (!article) return '';

  const highlights = await db.highlights.where('articleId').equals(articleId).sortBy('timestamp');

  let md = `# ${article.title}\n\n`;
  md += `Source: ${article.url}\n\n`;
  md += `---\n\n`;

  for (const h of highlights) {
    md += `> ${h.text}\n\n`;
    if (h.note) {
      md += `**Note:** ${h.note}\n\n`;
    }
    md += `*Color: ${HIGHLIGHT_COLORS[h.color].label}*\n\n---\n\n`;
  }

  return md;
}

export async function exportAllHighlightsAsMarkdown(): Promise<string> {
  const highlights = await db.highlights.orderBy('timestamp').toArray();
  const articleIds = [...new Set(highlights.map((h) => h.articleId))];

  let md = `# Marginalia — All Highlights\n\n`;
  md += `Exported: ${new Date().toLocaleDateString()}\n\n`;

  for (const articleId of articleIds) {
    const article = await db.articles.get(articleId);
    if (!article) continue;

    const articleHighlights = highlights.filter((h) => h.articleId === articleId);

    md += `## ${article.title}\n\n`;
    md += `Source: ${article.url}\n\n`;

    for (const h of articleHighlights) {
      md += `> ${h.text}\n\n`;
      if (h.note) md += `**Note:** ${h.note}\n\n`;
    }

    md += `---\n\n`;
  }

  return md;
}

export async function exportAllDataAsJSON(): Promise<string> {
  const articles = await db.articles.toArray();
  const highlights = await db.highlights.toArray();
  const folders = await db.folders.toArray();
  const sessions = await db.sessions.toArray();

  return JSON.stringify(
    {
      version: 1,
      exportDate: new Date().toISOString(),
      articles,
      highlights,
      folders,
      sessions,
    },
    null,
    2
  );
}

export async function importDataFromJSON(jsonString: string): Promise<{ articles: number; highlights: number; folders: number }> {
  const data = JSON.parse(jsonString);

  let articleCount = 0;
  let highlightCount = 0;
  let folderCount = 0;

  if (data.folders) {
    for (const folder of data.folders) {
      const existing = await db.folders.get(folder.id);
      if (!existing) {
        await db.folders.add(folder);
        folderCount++;
      }
    }
  }

  if (data.articles) {
    for (const article of data.articles) {
      const existing = await db.articles.get(article.id);
      if (!existing) {
        await db.articles.add(article);
        articleCount++;
      }
    }
  }

  if (data.highlights) {
    for (const highlight of data.highlights) {
      const existing = await db.highlights.get(highlight.id);
      if (!existing) {
        await db.highlights.add(highlight);
        highlightCount++;
      }
    }
  }

  return { articles: articleCount, highlights: highlightCount, folders: folderCount };
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
