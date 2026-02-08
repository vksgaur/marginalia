'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  FilterOption,
  SortOption,
  ViewMode,
  ReaderTheme,
  FontFamily,
  FontSize,
  LineHeight,
  ContentWidth,
  HighlightColor,
} from './types';

interface AppState {
  // Sidebar
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Library view
  currentFilter: FilterOption;
  setFilter: (filter: FilterOption) => void;
  currentFolderId: string | null;
  setFolderId: (id: string | null) => void;
  currentTagFilter: string | null;
  setTagFilter: (tag: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;

  // Reader
  activeArticleId: string | null;
  setActiveArticleId: (id: string | null) => void;
  readerTheme: ReaderTheme;
  setReaderTheme: (theme: ReaderTheme) => void;
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  lineHeight: LineHeight;
  setLineHeight: (height: LineHeight) => void;
  contentWidth: ContentWidth;
  setContentWidth: (width: ContentWidth) => void;
  isHighlightsPanelOpen: boolean;
  toggleHighlightsPanel: () => void;
  selectedHighlightColor: HighlightColor;
  setSelectedHighlightColor: (color: HighlightColor) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Sidebar
      isSidebarOpen: true,
      toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),

      // Library
      currentFilter: 'all',
      setFilter: (filter) => set({ currentFilter: filter, currentFolderId: null, currentTagFilter: null }),
      currentFolderId: null,
      setFolderId: (id) => set({ currentFolderId: id, currentFilter: 'all', currentTagFilter: null }),
      currentTagFilter: null,
      setTagFilter: (tag) => set({ currentTagFilter: tag, currentFilter: 'all', currentFolderId: null }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      viewMode: 'grid',
      setViewMode: (mode) => set({ viewMode: mode }),
      sortOption: 'dateAdded',
      setSortOption: (sort) => set({ sortOption: sort }),

      // Reader
      activeArticleId: null,
      setActiveArticleId: (id) => set({ activeArticleId: id }),
      readerTheme: 'light',
      setReaderTheme: (theme) => set({ readerTheme: theme }),
      fontFamily: 'sans',
      setFontFamily: (font) => set({ fontFamily: font }),
      fontSize: 'medium',
      setFontSize: (size) => set({ fontSize: size }),
      lineHeight: 'normal',
      setLineHeight: (height) => set({ lineHeight: height }),
      contentWidth: 'medium',
      setContentWidth: (width) => set({ contentWidth: width }),
      isHighlightsPanelOpen: false,
      toggleHighlightsPanel: () => set((s) => ({ isHighlightsPanelOpen: !s.isHighlightsPanelOpen })),
      selectedHighlightColor: 'yellow',
      setSelectedHighlightColor: (color) => set({ selectedHighlightColor: color }),
    }),
    {
      name: 'marginalia-settings',
      partialize: (state) => ({
        viewMode: state.viewMode,
        sortOption: state.sortOption,
        readerTheme: state.readerTheme,
        fontFamily: state.fontFamily,
        fontSize: state.fontSize,
        lineHeight: state.lineHeight,
        contentWidth: state.contentWidth,
        selectedHighlightColor: state.selectedHighlightColor,
      }),
    }
  )
);
