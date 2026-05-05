import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="flex justify-center">
          <FileQuestion className="h-16 w-16 text-muted-foreground" />
        </div>
        
        <h1 className="text-4xl font-bold text-foreground">
          404
        </h1>
        
        <h2 className="text-2xl font-semibold text-foreground">
          Page Not Found
        </h2>
        
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex gap-2 justify-center pt-4">
          <Link href="/">
            <Button variant="default">
              Go Home
            </Button>
          </Link>
          <Link href="/chat">
            <Button variant="outline">
              Start Chat
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
