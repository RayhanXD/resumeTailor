"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, X } from "lucide-react";
import { extractTextFromPDF } from "@/lib/pdf-parser";

const STORAGE_KEY = "resume-latex";

interface LatexResumeInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function LatexResumeInput({ value, onChange }: LatexResumeInputProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && !value) {
      onChange(saved);
    }
  }, []);

  useEffect(() => {
    if (value) {
      localStorage.setItem(STORAGE_KEY, value);
    }
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);

    try {
      if (file.name.endsWith(".tex") || file.type === "text/plain") {
        const text = await file.text();
        onChange(text);
        setFileName(file.name);
      } else if (file.type === "application/pdf") {
        const text = await extractTextFromPDF(file);
        onChange(text);
        setFileName(file.name + " (extracted text – paste into your LaTeX template)");
      } else {
        setError("Please upload a .tex file or PDF");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
    } finally {
      setIsProcessing(false);
      e.target.value = "";
    }
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFileName(null);
    setError(null);
    onChange("");
    fileInputRef.current?.focus();
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">LaTeX Resume</h2>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".tex,text/plain,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {isProcessing ? "Loading..." : "Upload .tex or PDF"}
            </Button>
            {value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {fileName && (
          <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground truncate">{fileName}</p>
          </div>
        )}

        <Textarea
          placeholder="Paste your LaTeX resume source here, or upload a .tex file. Ensure it contains \item blocks for experience bullets and optionally a Technical Skills section."
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setError(null);
          }}
          className="min-h-[280px] font-mono text-sm resize-y"
        />

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </Card>
  );
}
