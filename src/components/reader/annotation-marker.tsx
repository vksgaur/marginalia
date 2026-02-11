'use client';

import { useState, useRef, useEffect } from 'react';
import { updateAnnotation, deleteAnnotation } from '@/lib/hooks/use-annotations';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, Trash2, Check, X } from 'lucide-react';
import type { Annotation } from '@/lib/types';

interface AnnotationMarkerProps {
  annotation: Annotation;
  top: number;
}

export function AnnotationMarker({ annotation, top }: AnnotationMarkerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [text, setText] = useState(annotation.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  useEffect(() => {
    setText(annotation.text);
  }, [annotation.text]);

  const handleSave = async () => {
    if (text.trim()) {
      await updateAnnotation(annotation.id, text.trim());
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    await deleteAnnotation(annotation.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      setText(annotation.text);
      setIsEditing(false);
      setIsExpanded(false);
    }
  };

  if (isEditing) {
    return (
      <div
        ref={markerRef}
        className="absolute right-0 z-30 w-56 animate-in fade-in slide-in-from-left-2"
        style={{ top: `${top}px` }}
      >
        <div className="rounded-lg border border-primary/30 bg-card shadow-lg p-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full text-xs bg-transparent border-none outline-none resize-none min-h-[60px]"
            placeholder="Write your note..."
          />
          <div className="flex items-center justify-between mt-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleDelete}
              title="Delete"
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => {
                  setText(annotation.text);
                  setIsEditing(false);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={handleSave}
              >
                <Check className="h-3 w-3 text-primary" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isExpanded) {
    return (
      <div
        ref={markerRef}
        className="absolute right-0 z-20 w-52 animate-in fade-in slide-in-from-left-2"
        style={{ top: `${top}px` }}
      >
        <div
          className="rounded-lg border border-border/50 bg-card/95 shadow-md p-2.5 cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => setIsEditing(true)}
        >
          <p className="text-xs leading-relaxed whitespace-pre-wrap">{annotation.text}</p>
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
            <span>{new Date(annotation.createdAt).toLocaleDateString()}</span>
            <span className="italic">click to edit</span>
          </div>
        </div>
      </div>
    );
  }

  // Collapsed: just a dot
  return (
    <div
      className="absolute right-1 z-10 cursor-pointer group"
      style={{ top: `${top + 2}px` }}
      onClick={() => setIsExpanded(true)}
    >
      <div className="h-4 w-4 rounded-full bg-primary/70 flex items-center justify-center transition-transform group-hover:scale-125">
        <MessageSquarePlus className="h-2.5 w-2.5 text-primary-foreground" />
      </div>
    </div>
  );
}

interface AddAnnotationButtonProps {
  top: number;
  onClick: () => void;
}

export function AddAnnotationButton({ top, onClick }: AddAnnotationButtonProps) {
  return (
    <div
      className="absolute right-1 z-10 cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
      style={{ top: `${top + 2}px` }}
      onClick={onClick}
    >
      <div className="h-4 w-4 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center hover:border-primary hover:bg-primary/10 transition-colors">
        <span className="text-[10px] text-muted-foreground leading-none">+</span>
      </div>
    </div>
  );
}
