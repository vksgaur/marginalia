'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { toggleArchive, deleteArticle, updateArticle } from '@/lib/hooks/use-articles';
import { useFolders } from '@/lib/hooks/use-folders';
import { useAuth } from '@/components/shared/auth-provider';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/shared/toast';
import {
  Archive,
  Trash2,
  Tag,
  FolderInput,
  X,
  CheckSquare,
} from 'lucide-react';

interface BulkToolbarProps {
  allArticleIds: string[];
}

export function BulkToolbar({ allArticleIds }: BulkToolbarProps) {
  const selectedArticleIds = useAppStore((s) => s.selectedArticleIds);
  const selectAllArticles = useAppStore((s) => s.selectAllArticles);
  const clearSelection = useAppStore((s) => s.clearSelection);
  const { user } = useAuth();
  const userId = user?.uid || null;
  const folders = useFolders(userId);
  const { toast } = useToast();

  const [showDelete, setShowDelete] = useState(false);
  const [tagValue, setTagValue] = useState('');
  const [tagOpen, setTagOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);

  const count = selectedArticleIds.length;
  if (count === 0) return null;

  const handleArchiveAll = async () => {
    for (const id of selectedArticleIds) {
      await toggleArchive(id);
    }
    toast(`${count} articles archived`);
    clearSelection();
  };

  const handleDeleteAll = async () => {
    for (const id of selectedArticleIds) {
      await deleteArticle(id);
    }
    toast(`${count} articles deleted`);
    clearSelection();
  };

  const handleAddTag = async () => {
    const tags = tagValue.split(',').map((t) => t.trim()).filter(Boolean);
    if (tags.length === 0) return;
    for (const id of selectedArticleIds) {
      const { db } = await import('@/lib/db');
      const article = await db.articles.get(id);
      if (article) {
        const newTags = [...new Set([...article.tags, ...tags])];
        await updateArticle(id, { tags: newTags });
      }
    }
    toast(`Tags added to ${count} articles`);
    setTagValue('');
    setTagOpen(false);
    clearSelection();
  };

  const handleMoveToFolder = async (folderId: string | null) => {
    for (const id of selectedArticleIds) {
      await updateArticle(id, { folderId });
    }
    toast(`${count} articles moved`);
    setFolderOpen(false);
    clearSelection();
  };

  return (
    <>
      <div className="sticky top-0 z-20 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg mx-6 mt-4">
        <CheckSquare className="h-4 w-4" />
        <span className="text-sm font-medium">{count} selected</span>

        <Button
          variant="secondary"
          size="sm"
          className="ml-2 h-7 text-xs"
          onClick={() => selectAllArticles(allArticleIds)}
        >
          Select All
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            className="h-7 text-xs"
            onClick={handleArchiveAll}
          >
            <Archive className="h-3.5 w-3.5 mr-1" />
            Archive
          </Button>

          {/* Add Tag */}
          <Popover open={tagOpen} onOpenChange={setTagOpen}>
            <PopoverTrigger asChild>
              <Button variant="secondary" size="sm" className="h-7 text-xs">
                <Tag className="h-3.5 w-3.5 mr-1" />
                Tag
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-3" align="end">
              <div className="space-y-2">
                <Input
                  placeholder="tag1, tag2..."
                  value={tagValue}
                  onChange={(e) => setTagValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  className="h-8 text-sm"
                />
                <Button size="sm" className="w-full h-7" onClick={handleAddTag}>
                  Add Tags
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Move to Folder */}
          <Popover open={folderOpen} onOpenChange={setFolderOpen}>
            <PopoverTrigger asChild>
              <Button variant="secondary" size="sm" className="h-7 text-xs">
                <FolderInput className="h-3.5 w-3.5 mr-1" />
                Folder
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="space-y-0.5">
                <button
                  onClick={() => handleMoveToFolder(null)}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent"
                >
                  No folder
                </button>
                {folders?.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleMoveToFolder(f.id)}
                    className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: f.color }}
                    />
                    {f.name}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="secondary"
            size="sm"
            className="h-7 text-xs text-destructive"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={clearSelection}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Articles"
        description={`This will permanently delete ${count} articles and all their highlights.`}
        confirmLabel="Delete All"
        variant="destructive"
        onConfirm={handleDeleteAll}
      />
    </>
  );
}
