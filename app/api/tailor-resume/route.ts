import { NextRequest, NextResponse } from "next/server";
import { resumeTailorGraph } from "@/lib/graph/resume-tailor-graph";
import { reconstructLatex } from "@/lib/latex/reconstruct";

const MAX_LATEX_LENGTH = 50_000;
const MAX_JOB_DESC_LENGTH = 30_000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latex, jobDescription, companyName } = body;

    if (!latex || typeof latex !== "string") {
      return NextResponse.json(
        { error: "latex is required and must be a string" },
        { status: 400 },
      );
    }

    if (!jobDescription || typeof jobDescription !== "string") {
      return NextResponse.json(
        { error: "jobDescription is required and must be a string" },
        { status: 400 },
      );
    }

    const trimmedLatex = latex.slice(0, MAX_LATEX_LENGTH).trim();
    const trimmedJobDesc = jobDescription.slice(0, MAX_JOB_DESC_LENGTH).trim();
    const company = typeof companyName === "string" ? companyName.trim() : "";

    const initialState = {
      latex: trimmedLatex,
      jobDescription: trimmedJobDesc,
      companyName: company,
      companyResearch: "",
      jobAnalysis: "",
      recruiterLens: "",
      parsedResume: undefined,
      tailoredBullets: [] as string[],
      tailoredSkillsLine: undefined as string | undefined,
      critique: undefined as string | undefined,
      done: false,
    };

    const finalState = await resumeTailorGraph.invoke(initialState);

    const parsed = finalState.parsedResume;
    const tailoredBullets = finalState.tailoredBullets ?? [];
    const tailoredSkillsLine = finalState.tailoredSkillsLine;

    if (!parsed) {
      return NextResponse.json(
        { error: "Failed to parse LaTeX resume. Ensure it contains \\item blocks." },
        { status: 500 },
      );
    }

    const tailoredLatex = reconstructLatex(
      trimmedLatex,
      parsed,
      tailoredBullets,
      tailoredSkillsLine,
    );

    const includeDebug = process.env.DEBUG_TAILOR_RESPONSE === "true";
    const response: {
      tailoredLatex: string;
      debug?: {
        jobAnalysis: string;
        recruiterLens: string;
        companyResearch: string;
        critique?: string;
      };
    } = { tailoredLatex };

    if (includeDebug) {
      response.debug = {
        jobAnalysis: finalState.jobAnalysis ?? "",
        recruiterLens: finalState.recruiterLens ?? "",
        companyResearch: finalState.companyResearch ?? "",
        critique: finalState.critique,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error tailoring resume:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to tailor resume",
      },
      { status: 500 },
    );
  }
}
