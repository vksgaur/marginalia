'use client';

import { useState } from 'react';
import { signInWithGoogle } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  BookMarked,
  Highlighter,
  FolderOpen,
  Wifi,
  Loader2,
  Check,
  StickyNote,
} from 'lucide-react';

// ─── App Mockup ──────────────────────────────────────────────────────────────

function AppMockup() {
  return (
    <div className="w-full max-w-[480px] rounded-2xl border border-border/60 shadow-2xl overflow-hidden bg-white dark:bg-zinc-900 select-none">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border-b border-border/50">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400/90" />
          <div className="h-3 w-3 rounded-full bg-yellow-400/90" />
          <div className="h-3 w-3 rounded-full bg-green-400/90" />
        </div>
        <div className="flex-1 mx-3 h-6 rounded-md bg-white dark:bg-zinc-700 border border-border/40 text-[11px] flex items-center px-3 text-muted-foreground/60">
          marginalia.app/read
        </div>
      </div>

      {/* Reader content */}
      <div className="flex">
        {/* Main article column */}
        <div className="flex-1 px-8 py-6">
          {/* Article meta */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
              <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400">A</span>
            </div>
            <span className="text-[11px] text-muted-foreground">The Atlantic · 6 min read</span>
          </div>

          {/* Title */}
          <h2 className="text-[17px] font-bold leading-snug mb-5 text-zinc-900 dark:text-zinc-100">
            The Art of Slow Reading in a Fast World
          </h2>

          {/* Body text with highlights */}
          <div className="text-[13px] leading-7 space-y-3.5 text-zinc-600 dark:text-zinc-400 font-serif">
            <p>
              In an age of endless scroll, the act of{' '}
              <mark className="bg-yellow-200/90 dark:bg-yellow-400/25 text-zinc-800 dark:text-zinc-200 rounded-[3px] px-0.5 not-italic">
                reading deeply has become a form of resistance
              </mark>
              {' '}— a quiet assertion that some ideas deserve more than a glance.
            </p>

            <p>
              Marginalia — notes in the margins — were how{' '}
              <mark className="bg-sky-200/90 dark:bg-sky-400/25 text-zinc-800 dark:text-zinc-200 rounded-[3px] px-0.5 not-italic">
                great thinkers engaged with books
              </mark>
              . Darwin's copies of scientific texts are filled with his thoughts.
            </p>

            <p>
              The difference between{' '}
              <mark className="bg-emerald-200/90 dark:bg-emerald-400/25 text-zinc-800 dark:text-zinc-200 rounded-[3px] px-0.5 not-italic">
                reading and understanding
              </mark>
              {' '}is the space you leave for your own thinking to breathe.
            </p>

            <p className="text-zinc-400 dark:text-zinc-600">
              Annotation is not distraction — it is{' '}
              <mark className="bg-violet-200/90 dark:bg-violet-400/25 text-zinc-800 dark:text-zinc-200 rounded-[3px] px-0.5 not-italic">
                active comprehension
              </mark>
              , the mind in conversation with the page.
            </p>
          </div>

          {/* Floating highlight toolbar */}
          <div className="mt-6 inline-flex items-center gap-1 rounded-lg border border-border/60 bg-white dark:bg-zinc-800 shadow-lg p-1.5">
            <div className="h-5 w-5 rounded-full bg-yellow-400 ring-2 ring-yellow-400/30 cursor-pointer" title="Yellow" />
            <div className="h-5 w-5 rounded-full bg-sky-400 cursor-pointer" title="Blue" />
            <div className="h-5 w-5 rounded-full bg-emerald-400 cursor-pointer" title="Green" />
            <div className="h-5 w-5 rounded-full bg-violet-400 cursor-pointer" title="Purple" />
            <div className="w-px h-4 bg-border mx-0.5" />
            <div className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground cursor-pointer">
              <StickyNote className="h-3 w-3" />
              Note
            </div>
          </div>
        </div>

        {/* Highlights sidebar strip */}
        <div className="w-[110px] border-l border-border/40 bg-zinc-50/80 dark:bg-zinc-800/50 px-3 py-5 flex flex-col gap-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Highlights
          </p>
          {[
            { color: 'bg-yellow-300/80', text: 'reading deeply has become…' },
            { color: 'bg-sky-300/80', text: 'great thinkers engaged…' },
            { color: 'bg-emerald-300/80', text: 'reading and understanding…' },
          ].map((h, i) => (
            <div key={i} className="flex gap-1.5 items-start">
              <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${h.color}`} />
              <p className="text-[10px] leading-4 text-muted-foreground line-clamp-2">{h.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Feature list ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Highlighter,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    label: 'Highlight in 5 colours',
    detail: 'Yellow, blue, green, red, and purple.',
  },
  {
    icon: StickyNote,
    color: 'text-sky-500',
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    label: 'Add margin notes',
    detail: 'Attach your thoughts right to the text.',
  },
  {
    icon: FolderOpen,
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    label: 'Folders, tags & collections',
    detail: 'Keep every article exactly where you want it.',
  },
  {
    icon: Wifi,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    label: 'Sync across all devices',
    detail: 'Read on phone, highlight on desktop.',
  },
];

// ─── Login screen ─────────────────────────────────────────────────────────────

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
    <div className="flex min-h-screen bg-background">
      {/* ── Left: copy + CTA ── */}
      <div className="flex w-full flex-col justify-center px-8 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        {/* Logo */}
        <div className="mb-12 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BookMarked className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Marginalia</span>
        </div>

        {/* Headline */}
        <div className="mb-8 space-y-3">
          <h1 className="text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl">
            Read with<br className="hidden sm:block" /> purpose.
          </h1>
          <p className="max-w-sm text-lg leading-relaxed text-muted-foreground">
            Save any article. Highlight what matters.
            Build a library of ideas that&apos;s truly yours.
          </p>
        </div>

        {/* Feature list */}
        <ul className="mb-10 space-y-3">
          {FEATURES.map(({ icon: Icon, color, bg, label, detail }) => (
            <li key={label} className="flex items-center gap-3">
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-tight">{label}</span>
                <span className="text-xs text-muted-foreground">{detail}</span>
              </div>
              <Check className="ml-auto h-4 w-4 flex-shrink-0 text-muted-foreground/40" />
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="space-y-3">
          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            size="lg"
            className="h-12 w-full max-w-sm gap-3 text-base"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {isLoading ? 'Signing in…' : 'Continue with Google'}
          </Button>

          {error && (
            <p className="max-w-sm text-sm text-destructive">{error}</p>
          )}

          <p className="max-w-sm text-xs text-muted-foreground">
            Free to use. Your highlights and articles sync across all your devices.
          </p>
        </div>
      </div>

      {/* ── Right: app mockup (desktop only) ── */}
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-muted/30 p-12 border-l border-border/40">
        <AppMockup />
      </div>
    </div>
  );
}
