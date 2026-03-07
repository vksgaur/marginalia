import { nanoid } from 'nanoid';
import { doc, setDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import type { Article, ParsedArticle } from './types';

const API_URL = 'https://reader-app-pi.vercel.app/api/parse';

export async function parseArticle(url: string): Promise<ParsedArticle> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  const text = await response.text();
  if (!response.ok) {
    let errorMsg = 'Failed to parse article';
    try {
      const err = JSON.parse(text);
      errorMsg = err.error || errorMsg;
    } catch {
      // use default message
    }
    throw new Error(errorMsg);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid response from server');
  }
}

export async function checkDuplicate(userId: string, url: string): Promise<boolean> {
  const db = getFirestoreDb();
  const articlesRef = collection(db, 'users', userId, 'articles');
  const q = query(articlesRef, where('url', '==', url));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function saveArticle(
  userId: string,
  url: string,
  tags: string[] = []
): Promise<string> {
  const isDuplicate = await checkDuplicate(userId, url);
  if (isDuplicate) {
    throw new Error('Article already saved');
  }

  const parsed = await parseArticle(url);

  const now = new Date().toISOString();
  const article: Article = {
    id: nanoid(),
    url,
    title: parsed.title,
    content: parsed.content,
    excerpt: parsed.excerpt,
    thumbnail: parsed.thumbnail,
    siteName: parsed.siteName,
    isRead: false,
    isFavorite: false,
    isArchived: false,
    readProgress: 0,
    readingTime: parsed.readingTime,
    folderId: null,
    tags: tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
    readCount: 0,
    totalReadTime: 0,
    lastReadAt: null,
    dateAdded: now,
    lastModified: now,
    syncStatus: 'synced',
    userId,
  };

  const db = getFirestoreDb();
  const docRef = doc(db, 'users', userId, 'articles', article.id);
  await setDoc(docRef, article);

  return article.title;
}
