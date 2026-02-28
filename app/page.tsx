'use client';

import { useState, useEffect } from 'react';
import { UploadZone } from '@/components/upload-zone';
import { OutputPanel } from '@/components/output-panel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const [resumeText, setResumeText] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tailoredResume, setTailoredResume] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedResume = localStorage.getItem('resume-text');
    if (savedResume) {
      setResumeText(savedResume);
    }
  }, []);

  const handleGenerate = async () => {
    if (!resumeText || !companyName || !jobDescription) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: resumeText,
          companyName,
          jobDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const data = await response.json();
      setTailoredResume(data.tailoredResume);
      setCoverLetter(data.coverLetter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Resume & Cover Letter Agent</h1>
          <p className="text-muted-foreground">
            Upload your resume once, paste any job description, and get tailored documents instantly.
          </p>
        </div>

        <div className="space-y-6">
          <UploadZone onResumeExtracted={setResumeText} />

          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="company-name" className="text-sm font-medium mb-2 block">
                  Company Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="company-name"
                  placeholder="e.g. Google, Microsoft, Stripe..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="job-description" className="text-sm font-medium mb-2 block">
                  Job Description <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="job-description"
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                onClick={handleGenerate}
                disabled={!resumeText || !companyName || !jobDescription || isGenerating}
                className="w-full gap-2"
                size="lg"
              >
                <Sparkles className="h-5 w-5" />
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="min-h-[400px]">
              <OutputPanel
                title="Tailored Resume"
                content={tailoredResume}
                filename="tailored-resume.txt"
              />
            </div>
            <div className="min-h-[400px]">
              <OutputPanel
                title="Cover Letter"
                content={coverLetter}
                filename="cover-letter.txt"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
