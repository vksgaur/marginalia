'use client';

import React, { Component, type ReactNode } from 'react';
import { RefreshCw, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log for debugging — in production you'd send this to Sentry etc.
    console.error('[ErrorBoundary] Caught unhandled error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookMarked className="h-6 w-6" />
          <span className="text-lg font-semibold tracking-tight">Marginalia</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            This can happen when the app resumes after being in the background.
            Refreshing usually fixes it.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={this.handleReset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="gap-2"
          >
            Reload page
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && this.state.error && (
          <pre className="mt-4 max-w-lg overflow-auto rounded-md bg-muted p-4 text-left text-xs text-muted-foreground">
            {this.state.error.message}
          </pre>
        )}
      </div>
    );
  }
}
