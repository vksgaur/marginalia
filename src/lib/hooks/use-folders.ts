'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import type { Folder } from '@/lib/types';

export function useFolders() {
  return useLiveQuery(async () => {
    return db.folders.orderBy('order').toArray();
  }, []);
}

export function useFolderArticleCounts() {
  return useLiveQuery(async () => {
    const articles = await db.articles.toArray();
    const counts = new Map<string, number>();
    for (const article of articles) {
      if (article.folderId && !article.isArchived) {
        counts.set(article.folderId, (counts.get(article.folderId) || 0) + 1);
      }
    }
    return counts;
  }, []);
}

export async function addFolder(name: string, color: string) {
  const count = await db.folders.count();
  const folder: Folder = {
    id: nanoid(),
    name,
    color,
    order: count,
    createdAt: new Date().toISOString(),
    userId: null,
  };
  await db.folders.add(folder);
  return folder;
}

export async function updateFolder(id: string, changes: Partial<Folder>) {
  await db.folders.update(id, changes);
}

export async function deleteFolder(id: string) {
  await db.transaction('rw', db.folders, db.articles, async () => {
    // Unassign articles from this folder
    const articles = await db.articles.where('folderId').equals(id).toArray();
    for (const article of articles) {
      await db.articles.update(article.id, { folderId: null });
    }
    await db.folders.delete(id);
  });
}
