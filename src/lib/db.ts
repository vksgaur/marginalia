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

export { db };
