'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="flex justify-center">
          <AlertCircle className="size-16 text-destructive" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground">
          Something went wrong
        </h1>
        
        <p className="text-muted-foreground">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        
        {error.digest && (
          <p className="text-sm text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-4 bg-muted rounded-lg text-left">
            <summary className="cursor-pointer font-semibold mb-2">
              Error Details (Development Only)
            </summary>
            <pre className="text-xs overflow-auto whitespace-pre-wrap break-words">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
        
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} variant="default">
            Try Again
          </Button>
          <Button
            onClick={() => { window.location.href = '/'; }}
            variant="outline"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
