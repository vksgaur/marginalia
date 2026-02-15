'use client';

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirestoreDb, isFirebaseConfigured } from './firebase';
import { db } from './db';
import type { Article, Highlight, Folder } from './types';

type SyncCollection = 'articles' | 'highlights' | 'folders';

function getUserCollection(userId: string, collectionName: SyncCollection) {
  const firestore = getFirestoreDb();
  return collection(firestore, 'users', userId, collectionName);
}

// Push local data to Firestore
export async function pushToFirestore(userId: string) {
  if (!isFirebaseConfigured()) return;

  try {
    const articles = await db.articles.toArray();
    const highlights = await db.highlights.toArray();
    const folders = await db.folders.toArray();

    const articlesCol = getUserCollection(userId, 'articles');
    const highlightsCol = getUserCollection(userId, 'highlights');
    const foldersCol = getUserCollection(userId, 'folders');

    // Push articles
    for (const article of articles) {
      try {
        await setDoc(doc(articlesCol, article.id), { ...article, userId });
      } catch (err) {
        console.error(`[Sync] Failed to push article ${article.id}:`, err);
        await db.articles.update(article.id, { syncStatus: 'error' });
      }
    }

    // Push highlights
    for (const highlight of highlights) {
      try {
        await setDoc(doc(highlightsCol, highlight.id), { ...highlight, userId });
      } catch (err) {
        console.error(`[Sync] Failed to push highlight ${highlight.id}:`, err);
      }
    }

    // Push folders
    for (const folder of folders) {
      try {
        await setDoc(doc(foldersCol, folder.id), { ...folder, userId });
      } catch (err) {
        console.error(`[Sync] Failed to push folder ${folder.id}:`, err);
      }
    }

    // Mark all as synced (only those that didn't error)
    await db.articles.where('syncStatus').notEqual('error').modify({ syncStatus: 'synced', userId });
    await db.highlights.toCollection().modify({ userId });
    await db.folders.toCollection().modify({ userId });
  } catch (err) {
    console.error('[Sync] pushToFirestore failed:', err);
  }
}

// Pull from Firestore to local
export async function pullFromFirestore(userId: string) {
  if (!isFirebaseConfigured()) return;

  try {
    const articlesCol = getUserCollection(userId, 'articles');
    const highlightsCol = getUserCollection(userId, 'highlights');
    const foldersCol = getUserCollection(userId, 'folders');

    // Pull articles
    const articlesSnapshot = await getDocs(articlesCol);
    console.log(`[Sync] Pulling ${articlesSnapshot.docs.length} articles from Firestore`);
    for (const docSnap of articlesSnapshot.docs) {
      const remote = docSnap.data() as Article;
      const local = await db.articles.get(remote.id);

      if (!local || remote.lastModified > local.lastModified) {
        await db.articles.put({ ...remote, syncStatus: 'synced' });
      }
    }

    // Pull highlights
    const highlightsSnapshot = await getDocs(highlightsCol);
    for (const docSnap of highlightsSnapshot.docs) {
      const remote = docSnap.data() as Highlight;
      const local = await db.highlights.get(remote.id);

      if (!local || remote.lastModified > local.lastModified) {
        await db.highlights.put(remote);
      }
    }

    // Pull folders
    const foldersSnapshot = await getDocs(foldersCol);
    for (const docSnap of foldersSnapshot.docs) {
      const remote = docSnap.data() as Folder;
      const local = await db.folders.get(remote.id);

      if (!local) {
        await db.folders.put(remote);
      }
    }

    console.log('[Sync] Pull from Firestore complete');
  } catch (err) {
    console.error('[Sync] pullFromFirestore failed:', err);
    throw err; // Re-throw so caller can handle
  }
}

// Real-time sync listener
export function startRealtimeSync(userId: string): Unsubscribe[] {
  if (!isFirebaseConfigured()) return [];

  const unsubscribers: Unsubscribe[] = [];

  // Listen to articles
  const articlesCol = getUserCollection(userId, 'articles');
  unsubscribers.push(
    onSnapshot(articlesCol, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const remote = change.doc.data() as Article;
        if (change.type === 'added' || change.type === 'modified') {
          const local = await db.articles.get(remote.id);
          if (!local || remote.lastModified > local.lastModified) {
            await db.articles.put({ ...remote, syncStatus: 'synced' });
          }
        } else if (change.type === 'removed') {
          await db.articles.delete(remote.id);
        }
      });
    })
  );

  // Listen to highlights
  const highlightsCol = getUserCollection(userId, 'highlights');
  unsubscribers.push(
    onSnapshot(highlightsCol, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const remote = change.doc.data() as Highlight;
        if (change.type === 'added' || change.type === 'modified') {
          const local = await db.highlights.get(remote.id);
          if (!local || remote.lastModified > local.lastModified) {
            await db.highlights.put(remote);
          }
        } else if (change.type === 'removed') {
          await db.highlights.delete(remote.id);
        }
      });
    })
  );

  // Listen to folders
  const foldersCol = getUserCollection(userId, 'folders');
  unsubscribers.push(
    onSnapshot(foldersCol, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const remote = change.doc.data() as Folder;
        if (change.type === 'added' || change.type === 'modified') {
          const local = await db.folders.get(remote.id);
          if (!local) {
            await db.folders.put(remote);
          }
        } else if (change.type === 'removed') {
          await db.folders.delete(remote.id);
        }
      });
    })
  );

  return unsubscribers;
}

// Sync a single article change to Firestore
export async function syncArticle(article: Article) {
  if (!isFirebaseConfigured() || !article.userId) return;
  try {
    const col = getUserCollection(article.userId, 'articles');
    await setDoc(doc(col, article.id), article);
    await db.articles.update(article.id, { syncStatus: 'synced' });
  } catch (err) {
    console.error(`[Sync] Failed to sync article ${article.id}:`, err);
    await db.articles.update(article.id, { syncStatus: 'error' }).catch(() => {});
  }
}

// Sync a single highlight change to Firestore
export async function syncHighlight(highlight: Highlight) {
  if (!isFirebaseConfigured() || !highlight.userId) return;
  try {
    const col = getUserCollection(highlight.userId, 'highlights');
    await setDoc(doc(col, highlight.id), highlight);
  } catch (err) {
    console.error(`[Sync] Failed to sync highlight ${highlight.id}:`, err);
  }
}

// Delete from Firestore
export async function deleteFromFirestore(
  userId: string,
  collectionName: SyncCollection,
  docId: string
) {
  if (!isFirebaseConfigured()) return;
  try {
    const col = getUserCollection(userId, collectionName);
    await deleteDoc(doc(col, docId));
  } catch (err) {
    console.error(`[Sync] Failed to delete ${collectionName}/${docId}:`, err);
  }
}
