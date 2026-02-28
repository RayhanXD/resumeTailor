'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, Loader2, Check, AlertCircle } from 'lucide-react';

interface WorkdayUrlInputProps {
  onJobDataExtracted: (data: { companyName: string; jobDescription: string }) => void;
}

export function WorkdayUrlInput({ onJobDataExtracted }: WorkdayUrlInputProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFetch = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/parse-workday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse job posting');
      }

      onJobDataExtracted({
        companyName: data.data.companyName,
        jobDescription: data.data.jobDescription,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleFetch();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium mb-2 block">
        Workday Job URL <span className="text-muted-foreground">(optional)</span>
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Paste Workday job URL to auto-fill..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
              setSuccess(false);
            }}
            onKeyDown={handleKeyDown}
            className="pl-9"
            disabled={isLoading}
          />
        </div>
        <Button
          onClick={handleFetch}
          disabled={!url.trim() || isLoading}
          variant={success ? 'default' : 'secondary'}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Fetching...
            </>
          ) : success ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Done
            </>
          ) : (
            'Fetch Job'
          )}
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Supports URLs like: company.wd1.myworkdayjobs.com/...
      </p>
    </div>
  );
}
