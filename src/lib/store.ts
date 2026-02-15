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
  SearchScope,
  ReadTimeFilter,
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

  // Search scope
  searchScope: SearchScope;
  setSearchScope: (scope: SearchScope) => void;

  // Read time filter
  readTimeFilter: ReadTimeFilter;
  setReadTimeFilter: (filter: ReadTimeFilter) => void;

  // Daily highlights
  dailyHighlightDismissedDate: string | null;
  dismissDailyHighlights: () => void;

  // Bulk actions
  bulkSelectMode: boolean;
  selectedArticleIds: string[];
  toggleBulkSelectMode: () => void;
  toggleSelectArticle: (id: string) => void;
  selectAllArticles: (ids: string[]) => void;
  clearSelection: () => void;

  // Surprise Me
  surpriseArticleId: string | null;
  setSurpriseArticleId: (id: string | null) => void;

  // Stats dialog
  isStatsOpen: boolean;
  setStatsOpen: (open: boolean) => void;

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

  // Tag-to-color mapping
  tagColorMap: Record<string, HighlightColor>;
  setTagColor: (tag: string, color: HighlightColor) => void;
  removeTagColor: (tag: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Sidebar — default closed; desktop users toggle with panel button, mobile with hamburger
      isSidebarOpen: false,
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

      // Search scope
      searchScope: 'title',
      setSearchScope: (scope) => set({ searchScope: scope }),

      // Read time filter
      readTimeFilter: null,
      setReadTimeFilter: (filter) => set((s) => ({ readTimeFilter: s.readTimeFilter === filter ? null : filter })),

      // Daily highlights
      dailyHighlightDismissedDate: null,
      dismissDailyHighlights: () => set({ dailyHighlightDismissedDate: new Date().toDateString() }),

      // Bulk actions
      bulkSelectMode: false,
      selectedArticleIds: [],
      toggleBulkSelectMode: () => set((s) => ({
        bulkSelectMode: !s.bulkSelectMode,
        selectedArticleIds: s.bulkSelectMode ? [] : s.selectedArticleIds,
      })),
      toggleSelectArticle: (id) => set((s) => ({
        bulkSelectMode: true,
        selectedArticleIds: s.selectedArticleIds.includes(id)
          ? s.selectedArticleIds.filter((i) => i !== id)
          : [...s.selectedArticleIds, id],
      })),
      selectAllArticles: (ids) => set({ selectedArticleIds: ids, bulkSelectMode: true }),
      clearSelection: () => set({ selectedArticleIds: [], bulkSelectMode: false }),

      // Surprise Me
      surpriseArticleId: null,
      setSurpriseArticleId: (id) => set({ surpriseArticleId: id }),

      // Stats dialog
      isStatsOpen: false,
      setStatsOpen: (open) => set({ isStatsOpen: open }),

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

      // Tag-to-color mapping
      tagColorMap: {},
      setTagColor: (tag, color) => set((s) => ({ tagColorMap: { ...s.tagColorMap, [tag]: color } })),
      removeTagColor: (tag) => set((s) => {
        const { [tag]: _, ...rest } = s.tagColorMap;
        return { tagColorMap: rest };
      }),
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
        tagColorMap: state.tagColorMap,
      }),
    }
  )
);
