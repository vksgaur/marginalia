import type { Article } from './types';

const STOPWORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
  'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his',
  'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my',
  'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
  'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like',
  'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
  'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look',
  'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
  'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because',
  'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been',
  'has', 'had', 'did', 'does', 'should', 'may', 'might', 'must', 'shall', 'more',
  'very', 'much', 'many', 'own', 'same', 'such', 'still', 'each', 'every',
]);

function extractTerms(html: string): string[] {
  const text = html.replace(/<[^>]*>/g, ' ').toLowerCase();
  const words = text.split(/\W+/).filter((w) => w.length > 3 && !STOPWORDS.has(w));

  // Count frequency
  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  // Return top 20 by frequency
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([term]) => term);
}

export interface ScoredArticle {
  article: Article;
  score: number;
  matchedTags: string[];
}

export function getRecommendations(
  currentArticle: Article,
  allArticles: Article[]
): ScoredArticle[] {
  const candidates = allArticles.filter(
    (a) => a.id !== currentArticle.id && !a.isRead && !a.isArchived
  );

  if (candidates.length === 0) return [];

  const currentTerms = new Set(extractTerms(currentArticle.content));
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const scored: ScoredArticle[] = candidates.map((article) => {
    let score = 0;
    const matchedTags: string[] = [];

    // Tag overlap: +3 per shared tag
    for (const tag of article.tags) {
      if (currentArticle.tags.includes(tag)) {
        score += 3;
        matchedTags.push(tag);
      }
    }

    // Content similarity: +1 per matched term
    if (currentTerms.size > 0) {
      const candidateText = article.content.replace(/<[^>]*>/g, ' ').toLowerCase();
      for (const term of currentTerms) {
        if (candidateText.includes(term)) {
          score += 1;
        }
      }
    }

    // Recency bonus
    if (now - new Date(article.dateAdded).getTime() < weekMs) {
      score += 1;
    }

    return { article, score, matchedTags };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
