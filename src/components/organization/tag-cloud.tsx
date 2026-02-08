'use client';

import { Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TagCloudProps {
  tags: { tag: string; count: number }[];
  currentTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function TagCloud({ tags, currentTag, onSelectTag }: TagCloudProps) {
  if (tags.length === 0) {
    return (
      <div className="px-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Tags
        </span>
        <p className="text-xs text-muted-foreground mt-2">No tags yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 px-3 mb-2">
        <Tag className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Tags
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 px-3">
        {tags.map(({ tag, count }) => (
          <Badge
            key={tag}
            variant={currentTag === tag ? 'default' : 'secondary'}
            className="cursor-pointer text-xs py-0 h-6"
            onClick={() => onSelectTag(currentTag === tag ? null : tag)}
          >
            {tag}
            <span className="ml-1 opacity-60">{count}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}
