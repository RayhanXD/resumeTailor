import { parseWorkdayJob, isWorkdayUrl } from "@/lib/workday-parser";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!isWorkdayUrl(url)) {
      return NextResponse.json(
        { error: "Please provide a valid Workday job posting URL" },
        { status: 400 },
      );
    }

    const jobData = await parseWorkdayJob(url);

    return NextResponse.json({
      success: true,
      data: {
        companyName: jobData.companyName,
        jobDescription: jobData.jobTitle
          ? `${jobData.jobTitle}\n\n${jobData.jobDescription}`
          : jobData.jobDescription,
        jobTitle: jobData.jobTitle,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to parse job posting";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
