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

  const articles = await db.articles.toArray();
  const highlights = await db.highlights.toArray();
  const folders = await db.folders.toArray();

  const articlesCol = getUserCollection(userId, 'articles');
  const highlightsCol = getUserCollection(userId, 'highlights');
  const foldersCol = getUserCollection(userId, 'folders');

  // Push articles
  for (const article of articles) {
    await setDoc(doc(articlesCol, article.id), { ...article, userId });
  }

  // Push highlights
  for (const highlight of highlights) {
    await setDoc(doc(highlightsCol, highlight.id), { ...highlight, userId });
  }

  // Push folders
  for (const folder of folders) {
    await setDoc(doc(foldersCol, folder.id), { ...folder, userId });
  }

  // Mark all as synced
  await db.articles.toCollection().modify({ syncStatus: 'synced', userId });
  await db.highlights.toCollection().modify({ userId });
  await db.folders.toCollection().modify({ userId });
}

// Pull from Firestore to local
export async function pullFromFirestore(userId: string) {
  if (!isFirebaseConfigured()) return;

  const articlesCol = getUserCollection(userId, 'articles');
  const highlightsCol = getUserCollection(userId, 'highlights');
  const foldersCol = getUserCollection(userId, 'folders');

  // Pull articles
  const articlesSnapshot = await getDocs(articlesCol);
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
  const col = getUserCollection(article.userId, 'articles');
  await setDoc(doc(col, article.id), article);
}

// Sync a single highlight change to Firestore
export async function syncHighlight(highlight: Highlight) {
  if (!isFirebaseConfigured() || !highlight.userId) return;
  const col = getUserCollection(highlight.userId, 'highlights');
  await setDoc(doc(col, highlight.id), highlight);
}

// Delete from Firestore
export async function deleteFromFirestore(
  userId: string,
  collectionName: SyncCollection,
  docId: string
) {
  if (!isFirebaseConfigured()) return;
  const col = getUserCollection(userId, collectionName);
  await deleteDoc(doc(col, docId));
}
