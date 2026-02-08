'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/shared/auth-provider';
import { updateArticle } from '@/lib/hooks/use-articles';
import { useFolders } from '@/lib/hooks/use-folders';
import { TagInput } from '@/components/organization/tag-input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/shared/toast';
import { FolderOpen, ChevronDown } from 'lucide-react';
import type { Article } from '@/lib/types';

interface ArticleEditorProps {
  article: Article;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArticleEditor({ article, open, onOpenChange }: ArticleEditorProps) {
  const { user } = useAuth();
  const userId = user?.uid || null;
  const { toast } = useToast();
  const folders = useFolders(userId);

  const [title, setTitle] = useState(article.title);
  const [tags, setTags] = useState<string[]>(article.tags);
  const [folderId, setFolderId] = useState<string | null>(article.folderId);

  // Reset form when article changes
  useEffect(() => {
    setTitle(article.title);
    setTags(article.tags);
    setFolderId(article.folderId);
  }, [article]);

  const selectedFolder = folders?.find((f) => f.id === folderId);

  const handleSave = async () => {
    await updateArticle(article.id, {
      title: title.trim() || article.title,
      tags,
      folderId,
    });
    toast('Article updated');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Article</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
            />
          </div>

          {/* Folder */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Folder
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-9 text-sm">
                  <span className="flex items-center gap-2 truncate">
                    <FolderOpen className="h-3.5 w-3.5 flex-shrink-0" />
                    {selectedFolder ? selectedFolder.name : 'No folder'}
                  </span>
                  <ChevronDown className="h-3 w-3 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-full">
                <DropdownMenuItem onClick={() => setFolderId(null)}>
                  No folder
                </DropdownMenuItem>
                {folders?.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() => setFolderId(folder.id)}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: folder.color }}
                    />
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Tags
            </label>
            <TagInput tags={tags} onChange={setTags} placeholder="Add tags..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
