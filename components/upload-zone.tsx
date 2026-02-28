'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { extractTextFromPDF } from '@/lib/pdf-parser';
import { Upload, FileText, X } from 'lucide-react';

interface UploadZoneProps {
  onResumeExtracted: (text: string) => void;
}

export function UploadZone({ onResumeExtracted }: UploadZoneProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const text = await extractTextFromPDF(file);
      console.log('Extracted resume text:', text);
      localStorage.setItem('resume-text', text);
      setFileName(file.name);
      onResumeExtracted(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('resume-text');
    setFileName(null);
    setError(null);
    onResumeExtracted('');
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Resume</h2>
          {fileName && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {!fileName ? (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={isProcessing}
            />
            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">
              {isProcessing ? 'Processing...' : 'Upload Resume PDF'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click to browse or drag and drop
            </p>
          </label>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <FileText className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {fileName}
              </p>
              <p className="text-xs text-muted-foreground">
                Resume loaded successfully
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    </Card>
  );
}
