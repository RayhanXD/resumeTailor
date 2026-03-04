import { cn } from "@/lib/utils";

type StepId = "resume" | "job" | "options" | "result";

type Step = {
  id: StepId;
  label: string;
  description?: string;
};

type Props = {
  steps: Step[];
  currentStep: StepId;
};

export function StepIndicator({ steps, currentStep }: Props) {
  return (
    <ol className="flex flex-wrap gap-4 md:gap-6 mb-8">
      {steps.map((step, index) => {
        const currentIndex = steps.findIndex((s) => s.id === currentStep);
        const isCompleted = index < currentIndex;
        const isCurrent = step.id === currentStep;

        return (
          <li key={step.id} className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium",
                isCurrent &&
                  "border-primary bg-primary text-primary-foreground shadow-sm",
                isCompleted &&
                  "border-primary/40 bg-primary/5 text-primary",
                !isCurrent &&
                  !isCompleted &&
                  "border-border bg-background text-muted-foreground"
              )}
            >
              {isCompleted ? "✓" : index + 1}
            </div>
            <div className="flex flex-col">
              <span
                className={cn(
                  "text-sm font-medium",
                  isCurrent
                    ? "text-foreground"
                    : isCompleted
                    ? "text-muted-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {step.description ? (
                <span className="text-xs text-muted-foreground">
                  {step.description}
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

