'use client';

import { useState } from 'react';
import { signInWithGoogle } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { BookMarked, Highlighter, FolderOpen, Moon, Loader2 } from 'lucide-react';

export function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo & Brand */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3">
            <BookMarked className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Marginalia</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Save, read, and highlight articles
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 py-6">
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border p-4">
            <Highlighter className="h-6 w-6 text-yellow-500" />
            <span className="text-sm font-medium">Multi-color Highlights</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border p-4">
            <FolderOpen className="h-6 w-6 text-blue-500" />
            <span className="text-sm font-medium">Folders & Tags</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border p-4">
            <Moon className="h-6 w-6 text-purple-500" />
            <span className="text-sm font-medium">Reading Themes</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border p-4">
            <BookMarked className="h-6 w-6 text-green-500" />
            <span className="text-sm font-medium">Offline Reading</span>
          </div>
        </div>

        {/* Sign In Button */}
        <div className="space-y-3">
          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            size="lg"
            className="w-full h-12 text-base gap-3"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <p className="text-xs text-muted-foreground">
            Your articles and highlights are synced across all your devices
          </p>
        </div>
      </div>
    </div>
  );
}
