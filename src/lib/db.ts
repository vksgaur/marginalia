import Dexie, { type EntityTable } from 'dexie';
import type { Article, Highlight, Folder, ReadingSession, HighlightCollection, Annotation } from './types';

const db = new Dexie('MarginaliaDB') as Dexie & {
  articles: EntityTable<Article, 'id'>;
  highlights: EntityTable<Highlight, 'id'>;
  folders: EntityTable<Folder, 'id'>;
  sessions: EntityTable<ReadingSession, 'id'>;
  collections: EntityTable<HighlightCollection, 'id'>;
  annotations: EntityTable<Annotation, 'id'>;
};

db.version(1).stores({
  articles: 'id, url, title, folderId, isRead, isFavorite, isArchived, dateAdded, lastReadAt, *tags',
  highlights: 'id, articleId, color, timestamp, *tags',
  folders: 'id, name, order',
  sessions: 'id, articleId, startTime',
});

db.version(2).stores({
  articles: 'id, url, title, folderId, isRead, isFavorite, isArchived, dateAdded, lastReadAt, *tags',
  highlights: 'id, articleId, color, timestamp, collectionId, *tags',
  folders: 'id, name, order',
  sessions: 'id, articleId, startTime',
  collections: 'id, name, userId, createdAt',
});

db.version(3).stores({
  articles: 'id, url, title, folderId, isRead, isFavorite, isArchived, dateAdded, lastReadAt, *tags',
  highlights: 'id, articleId, color, timestamp, collectionId, *tags',
  folders: 'id, name, order',
  sessions: 'id, articleId, startTime',
  collections: 'id, name, userId, createdAt',
  annotations: 'id, articleId, paragraphIndex',
});

db.version(4).stores({
  articles: 'id, userId, url, title, folderId, isRead, isFavorite, isArchived, dateAdded, lastReadAt, syncStatus, *tags',
  highlights: 'id, userId, articleId, color, timestamp, collectionId, *tags',
  folders: 'id, userId, name, order',
  sessions: 'id, articleId, startTime',
  collections: 'id, userId, name, createdAt',
  annotations: 'id, userId, articleId, paragraphIndex',
}).upgrade((tx) => {
  // Ensure existing records have userId: null instead of undefined
  tx.table('articles').toCollection().modify((article) => {
    if (article.userId === undefined) article.userId = null;
    if (article.syncStatus === undefined) article.syncStatus = 'pending';
  });
  tx.table('highlights').toCollection().modify((highlight) => {
    if (highlight.userId === undefined) highlight.userId = null;
  });
  tx.table('folders').toCollection().modify((folder) => {
    if (folder.userId === undefined) folder.userId = null;
  });
  tx.table('annotations').toCollection().modify((annotation) => {
    if (annotation.userId === undefined) annotation.userId = null;
  });
});

export { db };
