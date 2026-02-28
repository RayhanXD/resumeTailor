'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Download, Check } from 'lucide-react';
import { useState } from 'react';

interface OutputPanelProps {
  title: string;
  content: string;
  filename: string;
}

export function OutputPanel({ title, content, filename }: OutputPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isEmpty = !content.trim();

  return (
    <Card className="p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {!isEmpty && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0">
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Your {title.toLowerCase()} will appear here
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
              {content}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
}
