export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';
export type ReaderTheme = 'dark' | 'light' | 'sepia';
export type FontFamily = 'serif' | 'sans';
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type LineHeight = 'compact' | 'normal' | 'relaxed';
export type ContentWidth = 'narrow' | 'medium' | 'wide';
export type ViewMode = 'grid' | 'list';
export type SortOption = 'dateAdded' | 'lastRead' | 'readingTime' | 'title';
export type FilterOption = 'all' | 'favorites' | 'archived' | 'unread';
export type SyncStatus = 'synced' | 'pending' | 'error';
export type SearchScope = 'title' | 'fulltext' | 'highlights';
export type ReadTimeFilter = 'short' | 'medium' | 'long' | null;

export interface Article {
  id: string;
  url: string;
  title: string;
  content: string;
  excerpt: string;
  thumbnail: string;
  siteName: string;

  // Reading state
  isRead: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  readProgress: number;
  readingTime: number;

  // Organization
  folderId: string | null;
  tags: string[];

  // Analytics
  readCount: number;
  totalReadTime: number;
  lastReadAt: string | null;

  // Timestamps
  dateAdded: string;
  lastModified: string;

  // Sync
  syncStatus: SyncStatus;
  userId: string | null;
}

export interface Highlight {
  id: string;
  articleId: string;
  text: string;
  color: HighlightColor;
  note: string;
  tags: string[];

  // Position tracking
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;

  // Collections
  collectionId: string | null;

  timestamp: string;
  lastModified: string;
  userId: string | null;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: string;
  userId: string | null;
}

export interface ReadingSession {
  id: string;
  articleId: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface HighlightCollection {
  id: string;
  name: string;
  userId: string | null;
  createdAt: string;
}

export interface ParsedArticle {
  title: string;
  content: string;
  excerpt: string;
  thumbnail: string;
  siteName: string;
  readingTime: number;
}
