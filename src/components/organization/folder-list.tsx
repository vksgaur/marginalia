'use client';

import { useState } from 'react';
import { addFolder, deleteFolder, updateFolder } from '@/lib/hooks/use-folders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FOLDER_COLORS } from '@/lib/constants';
import { FolderOpen, Plus, Trash2, X } from 'lucide-react';
import type { Folder } from '@/lib/types';

interface FolderListProps {
  folders: Folder[];
  folderCounts: Map<string, number>;
  currentFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  userId: string | null;
}

export function FolderList({ folders, folderCounts, currentFolderId, onSelectFolder, userId }: FolderListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addFolder(newName.trim(), selectedColor, userId);
    setNewName('');
    setIsAdding(false);
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    await updateFolder(id, { name: editName.trim() });
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between px-3 mb-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Folders
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </Button>
      </div>

      {/* Add folder form */}
      {isAdding && (
        <div className="px-3 py-2 space-y-2">
          <Input
            placeholder="Folder name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="h-8 text-sm"
            autoFocus
          />
          <div className="flex gap-1 flex-wrap">
            {FOLDER_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`h-5 w-5 rounded-full transition-transform ${
                  selectedColor === color ? 'scale-125 ring-2 ring-offset-1 ring-offset-background ring-primary' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <Button size="sm" className="w-full h-7 text-xs" onClick={handleAdd}>
            Create Folder
          </Button>
        </div>
      )}

      {/* Folder list */}
      <div className="space-y-0.5">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors ${
              currentFolderId === folder.id
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            }`}
            onClick={() =>
              onSelectFolder(currentFolderId === folder.id ? null : folder.id)
            }
          >
            <FolderOpen className="h-4 w-4 flex-shrink-0" style={{ color: folder.color }} />
            {editingId === folder.id ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(folder.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onBlur={() => handleRename(folder.id)}
                className="h-6 text-sm flex-1"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="flex-1 truncate"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingId(folder.id);
                  setEditName(folder.name);
                }}
              >
                {folder.name}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {folderCounts.get(folder.id) || 0}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteId(folder.id);
              }}
              className="hidden group-hover:block"
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Folder"
        description="Articles in this folder won't be deleted, they'll just be unassigned."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) {
            deleteFolder(deleteId);
            if (currentFolderId === deleteId) onSelectFolder(null);
          }
        }}
      />
    </div>
  );
}
