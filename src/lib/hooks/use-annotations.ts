'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import { syncAnnotation, deleteFromFirestore } from '@/lib/sync';
import type { Annotation } from '@/lib/types';

export function useAnnotations(articleId: string | null) {
  return useLiveQuery(async () => {
    if (!articleId) return [];
    return db.annotations.where('articleId').equals(articleId).sortBy('paragraphIndex');
  }, [articleId]);
}

export async function addAnnotation(data: {
  articleId: string;
  paragraphIndex: number;
  text: string;
  userId: string | null;
}) {
  const annotation: Annotation = {
    id: nanoid(),
    articleId: data.articleId,
    paragraphIndex: data.paragraphIndex,
    text: data.text,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    userId: data.userId,
  };
  await db.annotations.add(annotation);
  await syncAnnotation(annotation);
  return annotation;
}

export async function updateAnnotation(id: string, text: string) {
  await db.annotations.update(id, { text, lastModified: new Date().toISOString() });
  const updated = await db.annotations.get(id);
  if (updated) await syncAnnotation(updated);
}

export async function deleteAnnotation(id: string) {
  const annotation = await db.annotations.get(id);
  await db.annotations.delete(id);
  if (annotation?.userId) {
    await deleteFromFirestore(annotation.userId, 'annotations', id);
  }
}
