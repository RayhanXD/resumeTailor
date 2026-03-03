import { NextRequest, NextResponse } from "next/server";
import { resumeTailorGraph } from "@/lib/graph/resume-tailor-graph";
import { reconstructLatex } from "@/lib/latex/reconstruct";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const latex = String(body?.latex ?? "");
    const jobDescription = String(body?.jobDescription ?? "");
    const companyName = String(body?.companyName ?? "");

    if (!latex.trim() || !jobDescription.trim()) {
      return NextResponse.json(
        { error: "latex and jobDescription are required" },
        { status: 400 },
      );
    }

    const finalState = await resumeTailorGraph.invoke({
      latex,
      jobDescription,
      companyName,
      companyResearch: "",
      parsedResume: undefined as never,
      jobAnalysis: "",
      recruiterLens: "",
      tailoredBullets: [],
      tailoredSkillsValues: [],
      critique: "",
      done: false,
    });

    const parsed = finalState.parsedResume;
    if (!parsed) {
      throw new Error("Unable to parse resume structure.");
    }

    const tailoredLatex = reconstructLatex(
      latex,
      parsed,
      finalState.tailoredBullets,
      finalState.tailoredSkillsValues,
    );

    const preambleEnd =
      latex.indexOf("\\begin{document}") + "\\begin{document}".length;
    const postambleStart = latex.lastIndexOf("\\end{document}");
    const inputPreamble = latex.slice(0, preambleEnd);
    const outputPreamble = tailoredLatex.slice(0, preambleEnd);
    const inputPostamble = latex.slice(postambleStart);
    const outputPostamble = tailoredLatex.slice(
      tailoredLatex.lastIndexOf("\\end{document}"),
    );
    if (
      inputPreamble !== outputPreamble ||
      inputPostamble !== outputPostamble
    ) {
      return NextResponse.json(
        {
          error:
            "Format verification failed: preamble or postamble was modified. Returning original.",
          tailoredLatex: latex,
        },
        { status: 200 },
      );
    }

    const includeDebug = process.env.DEBUG_TAILOR_RESPONSE === "true";
    return NextResponse.json({
      tailoredLatex,
      ...(includeDebug
        ? {
            debug: {
              critique: finalState.critique,
              jobAnalysis: finalState.jobAnalysis,
              recruiterLens: finalState.recruiterLens,
            },
          }
        : {}),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to tailor resume",
      },
      { status: 500 },
    );
  }
}
