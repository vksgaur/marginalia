'use client';

import { useState } from 'react';
import { useAuth } from '@/components/shared/auth-provider';
import { useCollections, addCollection, deleteCollection } from '@/lib/hooks/use-highlights';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layers, Plus, Trash2, X } from 'lucide-react';

interface CollectionListProps {
  activeCollectionId: string | null;
  onSelectCollection: (id: string | null) => void;
}

export function CollectionList({ activeCollectionId, onSelectCollection }: CollectionListProps) {
  const { user } = useAuth();
  const userId = user?.uid || null;
  const collections = useCollections(userId);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    await addCollection(name, userId);
    setNewName('');
    setIsAdding(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteCollection(id);
    if (activeCollectionId === id) onSelectCollection(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between px-2 py-1.5">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Collections</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </Button>
      </div>

      {isAdding && (
        <div className="px-2 pb-2">
          <div className="flex gap-1">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Collection name"
              className="h-7 text-xs"
              autoFocus
            />
            <Button size="sm" className="h-7 px-2 text-xs" onClick={handleAdd}>
              Add
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-0.5">
        {collections?.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectCollection(activeCollectionId === c.id ? null : c.id)}
            className={`group flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
              activeCollectionId === c.id
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="truncate flex-1 text-left">{c.name}</span>
            <button
              onClick={(e) => handleDelete(e, c.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}
