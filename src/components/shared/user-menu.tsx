'use client';

import { useAuth } from './auth-provider';
import { signOut } from '@/lib/firebase';
import { useToast } from './toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  exportAllHighlightsAsMarkdown,
  exportAllDataAsJSON,
  importDataFromJSON,
  downloadFile,
} from '@/lib/export';
import { importKindleClippings } from '@/lib/kindle-import';
import {
  User,
  LogOut,
  Download,
  Upload,
  FileText,
  BookOpen,
} from 'lucide-react';
import { useRef } from 'react';

export function UserMenu() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kindleInputRef = useRef<HTMLInputElement>(null);

  const handleExportHighlights = async () => {
    const md = await exportAllHighlightsAsMarkdown();
    if (!md.includes('---')) {
      toast('No highlights to export', 'info');
      return;
    }
    downloadFile(md, 'marginalia-highlights.md', 'text/markdown');
    toast('Highlights exported');
  };

  const handleExportData = async () => {
    const json = await exportAllDataAsJSON();
    downloadFile(json, 'marginalia-backup.json', 'application/json');
    toast('Backup exported');
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = await importDataFromJSON(text);
      toast(`Imported ${result.articles} articles, ${result.highlights} highlights`);
    } catch {
      toast('Invalid backup file', 'error');
    }
    e.target.value = '';
  };

  const handleKindleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = await importKindleClippings(text);
      toast(`Imported ${result.highlights} highlights from ${result.articles} books`);
    } catch {
      toast('Could not parse Kindle clippings file', 'error');
    }
    e.target.value = '';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast('Signed out');
    } catch {
      toast('Sign out failed', 'error');
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportData}
      />
      <input
        ref={kindleInputRef}
        type="file"
        accept=".txt"
        className="hidden"
        onChange={handleKindleImport}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="h-7 w-7 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {user && (
            <>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem onClick={handleExportHighlights}>
            <FileText className="h-4 w-4 mr-2" />
            Export Highlights
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export All Data
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import Backup
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => kindleInputRef.current?.click()}>
            <BookOpen className="h-4 w-4 mr-2" />
            Import Kindle Clippings
          </DropdownMenuItem>

          {user && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
