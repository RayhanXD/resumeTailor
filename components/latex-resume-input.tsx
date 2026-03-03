"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const STORAGE_KEY = "resume-latex";

export function LatexResumeInput({ value, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached && !value) onChange(cached);
  }, []);

  useEffect(() => {
    if (value) localStorage.setItem(STORAGE_KEY, value);
  }, [value]);

  const onUpload = async (file?: File) => {
    if (!file) return;
    if (!file.name.endsWith(".tex")) {
      setError("Please upload a .tex file.");
      return;
    }
    const text = await file.text();
    onChange(text);
    setError(null);
  };

  return (
    <Card className="p-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">LaTeX Resume Source</h2>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".tex"
              className="hidden"
              onChange={(e) => onUpload(e.target.files?.[0])}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Upload .tex
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                onChange("");
              }}
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[320px] font-mono text-xs"
          placeholder="Paste your full .tex resume source..."
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </Card>
  );
}
