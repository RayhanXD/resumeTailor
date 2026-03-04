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
import { StepIndicator } from "@/components/step-indicator";

type StepId = "resume" | "job" | "options" | "result";

const steps: { id: StepId; label: string; description?: string }[] = [
  {
    id: "resume",
    label: "Resume",
    description: "Upload or paste your LaTeX source",
  },
  {
    id: "job",
    label: "Job",
    description: "Add the job description you’re targeting",
  },
  {
    id: "options",
    label: "Options",
    description: "Tune how we tailor your resume",
  },
  {
    id: "result",
    label: "Result",
    description: "Review and download your tailored resume",
  },
];

type TailorOptions = {
  seniority: "junior" | "mid" | "senior" | "staff";
  focusArea: "general" | "backend" | "infra" | "ml" | "fullstack" | "product";
  aggressiveness: "conservative" | "balanced" | "bold";
  keywordAlign: boolean;
};

function ResumeStep(props: {
  latexResume: string;
  setLatexResume: (value: string) => void;
  onContinue: () => void;
}) {
  const isContinueDisabled = !props.latexResume.trim();

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Your LaTeX resume</h2>
        <p className="text-sm text-muted-foreground">
          Paste your full LaTeX resume source or upload a <code>.tex</code> file.
          We only use this to generate a tailored version for you.
        </p>
      </div>

      <LatexResumeInput
        value={props.latexResume}
        onChange={props.setLatexResume}
      />

      <div className="flex justify-end">
        <Button
          onClick={props.onContinue}
          disabled={isContinueDisabled}
        >
          Continue to job
        </Button>
      </div>
    </Card>
  );
}

function JobStep(props: {
  companyName: string;
  setCompanyName: (value: string) => void;
  jobDescription: string;
  setJobDescription: (value: string) => void;
  onJobDataExtracted: (data: { companyName: string; jobDescription: string }) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const isContinueDisabled = !props.jobDescription.trim();

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Target job</h2>
        <p className="text-sm text-muted-foreground">
          Link a job posting or paste the full job description so we can align your
          resume to the requirements.
        </p>
      </div>

      <div className="space-y-4">
        <WorkdayUrlInput
          onJobDataExtracted={props.onJobDataExtracted}
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

        <div className="space-y-4">
          <div>
            <label
              htmlFor="company-name"
              className="text-sm font-medium mb-2 block"
            >
              Company name{" "}
              <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="company-name"
              placeholder="e.g. Google, Microsoft, Stripe..."
              value={props.companyName}
              onChange={(e) => props.setCompanyName(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="job-description"
              className="text-sm font-medium mb-2 block"
            >
              Job description <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="job-description"
              placeholder="Paste the job description here..."
              value={props.jobDescription}
              onChange={(e) => props.setJobDescription(e.target.value)}
              className="min-h-[200px] resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={props.onBack}>
          Back to resume
        </Button>
        <Button
          onClick={props.onContinue}
          disabled={isContinueDisabled}
        >
          Continue to options
        </Button>
      </div>
    </Card>
  );
}

function OptionsStep(props: {
  options: TailorOptions;
  setOptions: (options: TailorOptions) => void;
  onBack: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  hasRequiredInputs: boolean;
}) {
  const { options, setOptions } = props;

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Tailoring options</h2>
        <p className="text-sm text-muted-foreground">
          Choose how strongly we adapt your resume to this role. We keep your core
          experience the same while emphasizing what matters most.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Seniority target</h3>
          <p className="text-xs text-muted-foreground">
            How senior this role is relative to your experience.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "junior", label: "Junior" },
              { id: "mid", label: "Mid" },
              { id: "senior", label: "Senior" },
              { id: "staff", label: "Staff+" },
            ].map((option) => (
              <Button
                key={option.id}
                type="button"
                variant={
                  options.seniority === option.id ? "default" : "outline"
                }
                size="sm"
                onClick={() =>
                  setOptions({ ...options, seniority: option.id as TailorOptions["seniority"] })
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Focus area</h3>
          <p className="text-xs text-muted-foreground">
            What aspect of your background should we emphasize the most?
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "general", label: "General" },
              { id: "backend", label: "Backend / systems" },
              { id: "infra", label: "Infra / DevOps" },
              { id: "ml", label: "ML / AI" },
              { id: "fullstack", label: "Full-stack" },
              { id: "product", label: "Product-focused" },
            ].map((option) => (
              <Button
                key={option.id}
                type="button"
                variant={
                  options.focusArea === option.id ? "default" : "outline"
                }
                size="sm"
                onClick={() =>
                  setOptions({
                    ...options,
                    focusArea: option.id as TailorOptions["focusArea"],
                  })
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">How bold should we be?</h3>
          <p className="text-xs text-muted-foreground">
            Conservative keeps phrasing close to your original. Bold will reframe
            bullets more aggressively for the role.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "conservative", label: "Conservative" },
              { id: "balanced", label: "Balanced" },
              { id: "bold", label: "Bold" },
            ].map((option) => (
              <Button
                key={option.id}
                type="button"
                variant={
                  options.aggressiveness === option.id ? "default" : "outline"
                }
                size="sm"
                onClick={() =>
                  setOptions({
                    ...options,
                    aggressiveness: option.id as TailorOptions["aggressiveness"],
                  })
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Keyword alignment</h3>
          <p className="text-xs text-muted-foreground">
            Increase emphasis on phrases and skills that appear directly in the job
            description.
          </p>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={options.keywordAlign}
              onChange={(e) =>
                setOptions({ ...options, keywordAlign: e.target.checked })
              }
            />
            <span>Boost job-specific keywords</span>
          </label>
        </div>
      </div>

      <div className="flex justify-between items-center gap-4">
        <Button variant="ghost" type="button" onClick={props.onBack}>
          Back to job
        </Button>
        <Button
          type="button"
          onClick={props.onGenerate}
          disabled={!props.hasRequiredInputs || props.isGenerating}
          className="gap-2"
        >
          <Sparkles className="h-5 w-5" />
          {props.isGenerating ? "Tailoring..." : "Generate tailored resume"}
        </Button>
      </div>
    </Card>
  );
}

function ResultStep(props: {
  tailoredLatex: string;
  originalLatex: string;
  companyName: string;
  jobDescription: string;
  onBackToOptions: () => void;
  onStartOver: () => void;
  error: string | null;
}) {
  const hasResult = props.tailoredLatex.trim().length > 0;

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">Tailored resume</h2>
            <p className="text-sm text-muted-foreground">
              {props.companyName
                ? `Here’s your resume tailored for ${props.companyName}. Review the changes, then download or copy the LaTeX.`
                : "Here’s your tailored resume. Review the changes, then download or copy the LaTeX."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" type="button" onClick={props.onBackToOptions}>
              Adjust options
            </Button>
            <Button variant="outline" type="button" onClick={props.onStartOver}>
              Tailor another job
            </Button>
          </div>
        </div>
        {props.error && (
          <p className="text-sm text-destructive mt-2">{props.error}</p>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-h-[360px]">
          <OutputPanel
            title="Tailored LaTeX"
            content={props.tailoredLatex}
            filename="resume-tailored.tex"
          />
        </div>
        <div className="min-h-[360px]">
          <OutputPanel
            title="Original LaTeX"
            content={props.originalLatex}
            filename="resume-original.tex"
          />
        </div>
      </div>

      {!hasResult && !props.error && (
        <p className="text-sm text-muted-foreground">
          Once tailoring completes, your new LaTeX source will appear here. You can
          compare it side-by-side with your original.
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const [latexResume, setLatexResume] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tailoredLatex, setTailoredLatex] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<StepId>("resume");
  const [options, setOptions] = useState<TailorOptions>({
    seniority: "mid",
    focusArea: "general",
    aggressiveness: "balanced",
    keywordAlign: true,
  });

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
          seniority: options.seniority,
          focusArea: options.focusArea,
          aggressiveness: options.aggressiveness,
          keywordAlign: options.keywordAlign,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to tailor resume");
      }

      const data = await response.json();
      setTailoredLatex(data.tailoredLatex ?? "");
      setCurrentStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const hasRequiredInputs = Boolean(latexResume.trim() && jobDescription.trim());

  const handleStartOver = () => {
    setCompanyName("");
    setJobDescription("");
    setTailoredLatex("");
    setError(null);
    setOptions({
      seniority: "mid",
      focusArea: "general",
      aggressiveness: "balanced",
      keywordAlign: true,
    });
    setCurrentStep("job");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resume Tailor</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Turn your existing LaTeX resume into a targeted version for a specific role,
              with optimized bullets and skills.
            </p>
          </div>
        </header>

        <StepIndicator steps={steps} currentStep={currentStep} />

        <main className="space-y-6">
          {currentStep === "resume" && (
            <ResumeStep
              latexResume={latexResume}
              setLatexResume={setLatexResume}
              onContinue={() => setCurrentStep("job")}
            />
          )}

          {currentStep === "job" && (
            <JobStep
              companyName={companyName}
              setCompanyName={setCompanyName}
              jobDescription={jobDescription}
              setJobDescription={setJobDescription}
              onJobDataExtracted={handleWorkdayDataExtracted}
              onBack={() => setCurrentStep("resume")}
              onContinue={() => setCurrentStep("options")}
            />
          )}

          {currentStep === "options" && (
            <OptionsStep
              options={options}
              setOptions={setOptions}
              onBack={() => setCurrentStep("job")}
              onGenerate={handleTailor}
              isGenerating={isGenerating}
              hasRequiredInputs={hasRequiredInputs}
            />
          )}

          {currentStep === "result" && (
            <ResultStep
              tailoredLatex={tailoredLatex}
              originalLatex={latexResume}
              companyName={companyName}
              jobDescription={jobDescription}
              onBackToOptions={() => setCurrentStep("options")}
              onStartOver={handleStartOver}
              error={error}
            />
          )}
        </main>
      </div>
    </div>
  );
}

