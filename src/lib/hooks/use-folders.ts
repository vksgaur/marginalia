'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import type { Folder } from '@/lib/types';

export function useFolders(userId: string | null) {
  return useLiveQuery(async () => {
    return db.folders.filter((f) => f.userId === userId).sortBy('order');
  }, [userId]);
}

export function useFolderArticleCounts(userId: string | null) {
  return useLiveQuery(async () => {
    const articles = await db.articles.filter((a) => a.userId === userId).toArray();
    const counts = new Map<string, number>();
    for (const article of articles) {
      if (article.folderId && !article.isArchived) {
        counts.set(article.folderId, (counts.get(article.folderId) || 0) + 1);
      }
    }
    return counts;
  }, [userId]);
}

export async function addFolder(name: string, color: string, userId: string | null) {
  const existing = await db.folders.filter((f) => f.userId === userId).count();
  const folder: Folder = {
    id: nanoid(),
    name,
    color,
    order: existing,
    createdAt: new Date().toISOString(),
    userId,
  };
  await db.folders.add(folder);
  return folder;
}

export async function updateFolder(id: string, changes: Partial<Folder>) {
  await db.folders.update(id, changes);
}

export async function deleteFolder(id: string) {
  await db.transaction('rw', db.folders, db.articles, async () => {
    const articles = await db.articles.where('folderId').equals(id).toArray();
    for (const article of articles) {
      await db.articles.update(article.id, { folderId: null });
    }
    await db.folders.delete(id);
  });
}
