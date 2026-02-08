'use client';

import { useCallback, useRef } from 'react';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import { updateArticle } from './use-articles';

export function useReadingSession(articleId: string | null) {
  const startTimeRef = useRef<number | null>(null);

  const startSession = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  const endSession = useCallback(async () => {
    if (!startTimeRef.current || !articleId) return;

    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;
    startTimeRef.current = null;

    // Only save sessions longer than 5 seconds
    if (duration < 5000) return;

    await db.sessions.add({
      id: nanoid(),
      articleId,
      startTime: endTime - duration,
      endTime,
      duration,
    });

    // Update article total read time
    const article = await db.articles.get(articleId);
    if (article) {
      await updateArticle(articleId, {
        totalReadTime: article.totalReadTime + duration,
        readCount: article.readCount + 1,
        lastReadAt: new Date().toISOString(),
      });
    }
  }, [articleId]);

  return { startSession, endSession };
}
