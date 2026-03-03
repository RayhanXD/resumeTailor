"use client";

import { useState } from "react";
import { LatexResumeInput } from "@/components/latex-resume-input";
import { OutputPanel } from "@/components/output-panel";
import { WorkdayUrlInput } from "@/components/workday-url-input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function Home() {
  const [latexResume, setLatexResume] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tailoredLatex, setTailoredLatex] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWorkdayDataExtracted = (data: {
    companyName: string;
    jobDescription: string;
  }) => {
    setCompanyName(data.companyName);
    setJobDescription(data.jobDescription);
  };

  const handleTailor = async () => {
    if (!latexResume || !jobDescription) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latex: latexResume,
          jobDescription,
          companyName: companyName || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to tailor resume");
      }

      const data = await response.json();
      setTailoredLatex(data.tailoredLatex ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Resume Tailor</h1>
          <p className="text-muted-foreground">
            Paste your LaTeX resume and job description. Get a tailored resume with
            optimized bullet points and technical skills for the role.
          </p>
        </div>

        <div className="space-y-6">
          <LatexResumeInput value={latexResume} onChange={setLatexResume} />

          <Card className="p-6">
            <div className="space-y-4">
              <WorkdayUrlInput
                onJobDataExtracted={handleWorkdayDataExtracted}
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    or enter manually
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="company-name"
                  className="text-sm font-medium mb-2 block"
                >
                  Company Name{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="company-name"
                  placeholder="e.g. Google, Microsoft, Stripe..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="job-description"
                  className="text-sm font-medium mb-2 block"
                >
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
                onClick={handleTailor}
                disabled={
                  !latexResume || !jobDescription || isGenerating
                }
                className="w-full gap-2"
                size="lg"
              >
                <Sparkles className="h-5 w-5" />
                {isGenerating ? "Tailoring..." : "Tailor Resume"}
              </Button>
            </div>
          </Card>

          <div className="grid gap-6">
            <div className="min-h-[400px]">
              <OutputPanel
                title="Tailored Resume"
                content={tailoredLatex}
                filename="resume-tailored.tex"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
