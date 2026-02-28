import { generateCoverLetter } from "@/lib/ai-agent";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resume, companyName, jobDescription } = body;

    if (!resume || !companyName || !jobDescription) {
      return NextResponse.json(
        { error: "Resume, company name, and job description are required" },
        { status: 400 },
      );
    }
    //TODO: HMMM.... Myabe this function is important... Try cntrl + clicking it?
    const result = await generateCoverLetter(
      resume,
      companyName,
      jobDescription,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate content",
      },
      { status: 500 },
    );
  }
}
