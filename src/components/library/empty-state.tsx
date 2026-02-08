'use client';

import { BookOpen, Plus } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-muted p-5 mb-4">
        <BookOpen className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No articles yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Paste an article URL above to get started. Your saved articles will appear here.
      </p>
      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <Plus className="h-3 w-3" />
        <span>Tip: Use Ctrl+V to quickly paste a URL</span>
      </div>
    </div>
  );
}
