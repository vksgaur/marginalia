import Dexie, { type EntityTable } from 'dexie';
import type { Article, Highlight, Folder, ReadingSession } from './types';

const db = new Dexie('MarginaliaDB') as Dexie & {
  articles: EntityTable<Article, 'id'>;
  highlights: EntityTable<Highlight, 'id'>;
  folders: EntityTable<Folder, 'id'>;
  sessions: EntityTable<ReadingSession, 'id'>;
};

db.version(1).stores({
  articles: 'id, url, title, folderId, isRead, isFavorite, isArchived, dateAdded, lastReadAt, *tags',
  highlights: 'id, articleId, color, timestamp, *tags',
  folders: 'id, name, order',
  sessions: 'id, articleId, startTime',
});

export { db };
