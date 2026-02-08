'use client';

import { useState } from 'react';
import { addArticle } from '@/lib/hooks/use-articles';
import { useFolders } from '@/lib/hooks/use-folders';
import { TagInput } from '@/components/organization/tag-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/shared/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Loader2, ChevronDown, FolderOpen } from 'lucide-react';
import type { ParsedArticle } from '@/lib/types';

export function AddArticleForm() {
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const folders = useFolders();

  const selectedFolder = folders?.find((f) => f.id === folderId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      // Handle non-JSON or empty responses safely
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          'Server returned an invalid response. The article may be too large or the site may be blocking requests.'
        );
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse article');
      }

      const parsed: ParsedArticle = data;

      await addArticle({
        url: url.trim(),
        title: parsed.title,
        content: parsed.content,
        excerpt: parsed.excerpt,
        thumbnail: parsed.thumbnail,
        siteName: parsed.siteName,
        readingTime: parsed.readingTime,
        tags,
        folderId,
      });

      toast('Article saved!');
      setUrl('');
      setTags([]);
      setFolderId(null);
      setIsExpanded(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save article';
      toast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-b border-border px-6 py-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            placeholder="Paste article URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            className="pr-10"
            type="url"
          />
        </div>
        <Button type="submit" disabled={!url.trim() || isLoading} size="default">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span className="ml-1.5">Save</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-9 w-9"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      {/* Expanded options */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          <div className="flex gap-3 items-start">
            {/* Folder selector */}
            <div className="w-48">
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
                <DropdownMenuContent align="start" className="w-48">
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
            <div className="flex-1">
              <TagInput tags={tags} onChange={setTags} placeholder="Add tags..." />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
