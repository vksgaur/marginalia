'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import { syncArticle, deleteFromFirestore } from '@/lib/sync';
import type { Article, FilterOption, SortOption, ReadTimeFilter, SearchScope } from '@/lib/types';

export function useArticles(
  filter: FilterOption,
  folderId: string | null,
  tagFilter: string | null,
  searchQuery: string,
  sortOption: SortOption,
  userId: string | null,
  readTimeFilter?: ReadTimeFilter,
  searchScope?: SearchScope
) {
  return useLiveQuery(async () => {
    let articles = await db.articles.toArray();

    // Scope by user — show only this user's articles (or anonymous articles if no user)
    articles = articles.filter((a) => a.userId === userId);

    // Apply filter
    if (filter === 'favorites') articles = articles.filter((a) => a.isFavorite);
    else if (filter === 'archived') articles = articles.filter((a) => a.isArchived);
    else if (filter === 'unread') articles = articles.filter((a) => !a.isRead && !a.isArchived);
    else articles = articles.filter((a) => !a.isArchived); // 'all' hides archived

    // Filter by folder
    if (folderId) articles = articles.filter((a) => a.folderId === folderId);

    // Filter by tag
    if (tagFilter) articles = articles.filter((a) => a.tags.includes(tagFilter));

    // Filter by read time
    if (readTimeFilter) {
      articles = articles.filter((a) => {
        if (readTimeFilter === 'short') return a.readingTime < 5;
        if (readTimeFilter === 'medium') return a.readingTime >= 5 && a.readingTime <= 15;
        if (readTimeFilter === 'long') return a.readingTime > 15;
        return true;
      });
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const scope = searchScope || 'title';
      articles = articles.filter((a) => {
        const titleMatch =
          a.title.toLowerCase().includes(q) ||
          a.url.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q));
        if (scope === 'title') return titleMatch;
        if (scope === 'fulltext') {
          const plainContent = a.content.replace(/<[^>]*>/g, '').toLowerCase();
          return titleMatch || plainContent.includes(q);
        }
        return titleMatch;
      });
    }

    // Sort
    articles.sort((a, b) => {
      switch (sortOption) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'readingTime':
          return a.readingTime - b.readingTime;
        case 'lastRead':
          return (b.lastReadAt || '').localeCompare(a.lastReadAt || '');
        case 'dateAdded':
        default:
          return b.dateAdded.localeCompare(a.dateAdded);
      }
    });

    return articles;
  }, [filter, folderId, tagFilter, searchQuery, sortOption, userId, readTimeFilter, searchScope]);
}

export function useArticle(id: string | null) {
  return useLiveQuery(async () => {
    if (!id) return null;
    return db.articles.get(id);
  }, [id]);
}

export function useAllTags(userId: string | null) {
  return useLiveQuery(async () => {
    const articles = await db.articles.filter((a) => a.userId === userId).toArray();
    const tagMap = new Map<string, number>();
    for (const article of articles) {
      for (const tag of article.tags) {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      }
    }
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [userId]);
}

export function useArticleCount(userId: string | null) {
  return useLiveQuery(async () => {
    const articles = await db.articles.filter((a) => a.userId === userId).toArray();
    const total = articles.length;
    const unread = articles.filter((a) => !a.isRead && !a.isArchived).length;
    return { total, unread };
  }, [userId]);
}

export async function addArticle(data: {
  url: string;
  title: string;
  content: string;
  excerpt: string;
  thumbnail: string;
  siteName: string;
  readingTime: number;
  tags?: string[];
  folderId?: string | null;
  userId?: string | null;
}) {
  // Check duplicates scoped by user
  const existing = await db.articles
    .filter((a) => a.url === data.url && a.userId === (data.userId || null))
    .first();
  if (existing) throw new Error('Article already saved');

  const article: Article = {
    id: nanoid(),
    url: data.url,
    title: data.title,
    content: data.content,
    excerpt: data.excerpt,
    thumbnail: data.thumbnail,
    siteName: data.siteName,
    isRead: false,
    isFavorite: false,
    isArchived: false,
    readProgress: 0,
    readingTime: data.readingTime,
    folderId: data.folderId || null,
    tags: data.tags || [],
    readCount: 0,
    totalReadTime: 0,
    lastReadAt: null,
    dateAdded: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    syncStatus: 'pending',
    userId: data.userId || null,
  };

  await db.articles.add(article);
  syncArticle(article);
  return article;
}

export async function updateArticle(id: string, changes: Partial<Article>) {
  await db.articles.update(id, { ...changes, lastModified: new Date().toISOString() });
  const updated = await db.articles.get(id);
  if (updated) syncArticle(updated);
}

export async function deleteArticle(id: string) {
  const article = await db.articles.get(id);
  await db.transaction('rw', db.articles, db.highlights, db.sessions, async () => {
    await db.highlights.where('articleId').equals(id).delete();
    await db.sessions.where('articleId').equals(id).delete();
    await db.articles.delete(id);
  });
  if (article?.userId) {
    deleteFromFirestore(article.userId, 'articles', id);
  }
}

export async function toggleFavorite(id: string) {
  const article = await db.articles.get(id);
  if (article) {
    await updateArticle(id, { isFavorite: !article.isFavorite });
  }
}

export async function toggleArchive(id: string) {
  const article = await db.articles.get(id);
  if (article) {
    await updateArticle(id, { isArchived: !article.isArchived });
  }
}

export async function markAsRead(id: string) {
  await updateArticle(id, { isRead: true, lastReadAt: new Date().toISOString() });
}

export function useReadingStats(userId: string | null) {
  return useLiveQuery(async () => {
    const articles = await db.articles.filter((a) => a.userId === userId).toArray();
    const highlights = await db.highlights.toArray();
    const sessions = await db.sessions.toArray();
    const userHighlights = highlights.filter((h) => {
      const articleIds = new Set(articles.map((a) => a.id));
      return articleIds.has(h.articleId);
    });

    const totalArticles = articles.length;
    const readArticles = articles.filter((a) => a.isRead).length;
    const totalReadTime = articles.reduce((sum, a) => sum + a.totalReadTime, 0);
    const avgReadTime = readArticles > 0 ? Math.round(totalReadTime / readArticles) : 0;

    // Articles read this week / month
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const readThisWeek = articles.filter((a) => a.lastReadAt && new Date(a.lastReadAt) >= weekAgo).length;
    const readThisMonth = articles.filter((a) => a.lastReadAt && new Date(a.lastReadAt) >= monthAgo).length;

    // Reading streak
    const readDates = new Set(
      sessions.map((s) => new Date(s.startTime).toDateString())
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (readDates.has(d.toDateString())) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Top tags
    const tagMap = new Map<string, number>();
    for (const a of articles) {
      for (const t of a.tags) tagMap.set(t, (tagMap.get(t) || 0) + 1);
    }
    const topTags = Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    // Articles per week (last 8 weeks)
    const weeklyData: { label: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const count = articles.filter(
        (a) => a.lastReadAt && new Date(a.lastReadAt) >= weekStart && new Date(a.lastReadAt) < weekEnd
      ).length;
      weeklyData.push({
        label: `W${8 - i}`,
        count,
      });
    }

    return {
      totalArticles,
      readArticles,
      totalReadTime,
      avgReadTime,
      readThisWeek,
      readThisMonth,
      streak,
      highlightCount: userHighlights.length,
      topTags,
      weeklyData,
    };
  }, [userId]);
}
