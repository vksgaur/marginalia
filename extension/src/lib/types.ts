export type SyncStatus = 'synced' | 'pending' | 'error';

export interface Article {
  id: string;
  url: string;
  title: string;
  content: string;
  excerpt: string;
  thumbnail: string;
  siteName: string;
  isRead: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  readProgress: number;
  readingTime: number;
  folderId: string | null;
  tags: string[];
  readCount: number;
  totalReadTime: number;
  lastReadAt: string | null;
  dateAdded: string;
  lastModified: string;
  syncStatus: SyncStatus;
  userId: string | null;
}

export interface ParsedArticle {
  title: string;
  content: string;
  excerpt: string;
  thumbnail: string;
  siteName: string;
  readingTime: number;
}

export interface AuthState {
  userId: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
