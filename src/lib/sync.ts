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
import type { Article, Highlight, Folder, Annotation, HighlightCollection } from './types';

type SyncCollection = 'articles' | 'highlights' | 'folders' | 'annotations' | 'collections';

function getUserCollection(userId: string, collectionName: SyncCollection) {
  const firestore = getFirestoreDb();
  return collection(firestore, 'users', userId, collectionName);
}

// Push local data to Firestore
export async function pushToFirestore(userId: string) {
  if (!isFirebaseConfigured()) return;

  try {
    const articles = await db.articles.filter((a) => a.userId === userId).toArray();
    const highlights = await db.highlights.filter((h) => h.userId === userId).toArray();
    const folders = await db.folders.filter((f) => f.userId === userId).toArray();

    const articlesCol = getUserCollection(userId, 'articles');
    const highlightsCol = getUserCollection(userId, 'highlights');
    const foldersCol = getUserCollection(userId, 'folders');

    // Push articles
    for (const article of articles) {
      try {
        await setDoc(doc(articlesCol, article.id), article);
      } catch (err) {
        console.error(`[Sync] Failed to push article ${article.id}:`, err);
        await db.articles.update(article.id, { syncStatus: 'error' });
      }
    }

    // Push highlights
    for (const highlight of highlights) {
      try {
        await setDoc(doc(highlightsCol, highlight.id), highlight);
      } catch (err) {
        console.error(`[Sync] Failed to push highlight ${highlight.id}:`, err);
      }
    }

    // Push folders
    for (const folder of folders) {
      try {
        await setDoc(doc(foldersCol, folder.id), folder);
      } catch (err) {
        console.error(`[Sync] Failed to push folder ${folder.id}:`, err);
      }
    }

    // Push annotations
    const annotations = await db.annotations.filter((a) => a.userId === userId).toArray();
    const annotationsCol = getUserCollection(userId, 'annotations');
    for (const annotation of annotations) {
      try {
        await setDoc(doc(annotationsCol, annotation.id), annotation);
      } catch (err) {
        console.error(`[Sync] Failed to push annotation ${annotation.id}:`, err);
      }
    }

    // Push collections
    const collections = await db.collections.filter((c) => c.userId === userId).toArray();
    const collectionsCol = getUserCollection(userId, 'collections');
    for (const coll of collections) {
      try {
        await setDoc(doc(collectionsCol, coll.id), coll);
      } catch (err) {
        console.error(`[Sync] Failed to push collection ${coll.id}:`, err);
      }
    }

    // Mark synced articles (only those that didn't error)
    for (const article of articles) {
      if (article.syncStatus !== 'error') {
        await db.articles.update(article.id, { syncStatus: 'synced' });
      }
    }
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

      if (!local || (remote.lastModified && remote.lastModified > (local.lastModified || ''))) {
        await db.folders.put(remote);
      }
    }

    // Pull annotations
    const annotationsCol = getUserCollection(userId, 'annotations');
    const annotationsSnapshot = await getDocs(annotationsCol);
    for (const docSnap of annotationsSnapshot.docs) {
      const remote = docSnap.data() as Annotation;
      const local = await db.annotations.get(remote.id);

      if (!local || remote.lastModified > local.lastModified) {
        await db.annotations.put(remote);
      }
    }

    // Pull collections
    const collectionsCol = getUserCollection(userId, 'collections');
    const collectionsSnapshot = await getDocs(collectionsCol);
    for (const docSnap of collectionsSnapshot.docs) {
      const remote = docSnap.data() as HighlightCollection;
      const local = await db.collections.get(remote.id);

      if (!local) {
        await db.collections.put(remote);
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

  // Shared error handler — Firebase will auto-retry the connection;
  // we just need to avoid crashing the app when the listener drops.
  function makeErrorHandler(name: string) {
    return (error: Error) => {
      console.warn(`[Sync] ${name} listener disconnected (will auto-retry):`, error.message);
    };
  }

  // Listen to articles
  const articlesCol = getUserCollection(userId, 'articles');
  unsubscribers.push(
    onSnapshot(
      articlesCol,
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          try {
            const remote = change.doc.data() as Article;
            if (change.type === 'added' || change.type === 'modified') {
              const local = await db.articles.get(remote.id);
              if (!local || remote.lastModified > local.lastModified) {
                await db.articles.put({ ...remote, syncStatus: 'synced' });
              }
            } else if (change.type === 'removed') {
              await db.articles.delete(remote.id);
            }
          } catch (err) {
            console.error('[Sync] Real-time article sync error:', err);
          }
        }
      },
      makeErrorHandler('articles')
    )
  );

  // Listen to highlights
  const highlightsCol = getUserCollection(userId, 'highlights');
  unsubscribers.push(
    onSnapshot(
      highlightsCol,
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          try {
            const remote = change.doc.data() as Highlight;
            if (change.type === 'added' || change.type === 'modified') {
              const local = await db.highlights.get(remote.id);
              if (!local || remote.lastModified > local.lastModified) {
                await db.highlights.put(remote);
              }
            } else if (change.type === 'removed') {
              await db.highlights.delete(remote.id);
            }
          } catch (err) {
            console.error('[Sync] Real-time highlight sync error:', err);
          }
        }
      },
      makeErrorHandler('highlights')
    )
  );

  // Listen to folders
  const foldersCol = getUserCollection(userId, 'folders');
  unsubscribers.push(
    onSnapshot(
      foldersCol,
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          try {
            const remote = change.doc.data() as Folder;
            if (change.type === 'added' || change.type === 'modified') {
              const local = await db.folders.get(remote.id);
              if (!local || (remote.lastModified && remote.lastModified > (local.lastModified || ''))) {
                await db.folders.put(remote);
              }
            } else if (change.type === 'removed') {
              await db.folders.delete(remote.id);
            }
          } catch (err) {
            console.error('[Sync] Real-time folder sync error:', err);
          }
        }
      },
      makeErrorHandler('folders')
    )
  );

  // Listen to annotations
  const annotationsCol = getUserCollection(userId, 'annotations');
  unsubscribers.push(
    onSnapshot(
      annotationsCol,
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          try {
            const remote = change.doc.data() as Annotation;
            if (change.type === 'added' || change.type === 'modified') {
              const local = await db.annotations.get(remote.id);
              if (!local || remote.lastModified > local.lastModified) {
                await db.annotations.put(remote);
              }
            } else if (change.type === 'removed') {
              await db.annotations.delete(remote.id);
            }
          } catch (err) {
            console.error('[Sync] Real-time annotation sync error:', err);
          }
        }
      },
      makeErrorHandler('annotations')
    )
  );

  // Listen to collections
  const collectionsCol = getUserCollection(userId, 'collections');
  unsubscribers.push(
    onSnapshot(
      collectionsCol,
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          try {
            const remote = change.doc.data() as HighlightCollection;
            if (change.type === 'added' || change.type === 'modified') {
              const local = await db.collections.get(remote.id);
              if (!local) {
                await db.collections.put(remote);
              }
            } else if (change.type === 'removed') {
              await db.collections.delete(remote.id);
            }
          } catch (err) {
            console.error('[Sync] Real-time collection sync error:', err);
          }
        }
      },
      makeErrorHandler('collections')
    )
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

// Sync a single folder change to Firestore
export async function syncFolder(folder: Folder) {
  if (!isFirebaseConfigured() || !folder.userId) return;
  try {
    const col = getUserCollection(folder.userId, 'folders');
    await setDoc(doc(col, folder.id), folder);
  } catch (err) {
    console.error(`[Sync] Failed to sync folder ${folder.id}:`, err);
  }
}

// Sync a single annotation change to Firestore
export async function syncAnnotation(annotation: Annotation) {
  if (!isFirebaseConfigured() || !annotation.userId) return;
  try {
    const col = getUserCollection(annotation.userId, 'annotations');
    await setDoc(doc(col, annotation.id), annotation);
  } catch (err) {
    console.error(`[Sync] Failed to sync annotation ${annotation.id}:`, err);
  }
}

// Sync a single collection change to Firestore
export async function syncCollection(coll: HighlightCollection) {
  if (!isFirebaseConfigured() || !coll.userId) return;
  try {
    const col = getUserCollection(coll.userId, 'collections');
    await setDoc(doc(col, coll.id), coll);
  } catch (err) {
    console.error(`[Sync] Failed to sync collection ${coll.id}:`, err);
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
