import { parseWorkdayJob, isWorkdayUrl } from '@/lib/workday-parser';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!isWorkdayUrl(url)) {
      return NextResponse.json(
        { error: 'Please provide a valid Workday job posting URL' },
        { status: 400 }
      );
    }

    console.log(`Parsing Workday URL: ${url}`);
    const jobData = await parseWorkdayJob(url);

    return NextResponse.json({
      success: true,
      data: {
        companyName: jobData.companyName,
        jobDescription: jobData.jobTitle
          ? `${jobData.jobTitle}\n\n${jobData.jobDescription}`
          : jobData.jobDescription,
        jobTitle: jobData.jobTitle,
        location: jobData.location,
      }
    });

  } catch (error) {
    console.error('Error parsing Workday URL:', error);

    const message = error instanceof Error ? error.message : 'Failed to parse job posting';

    // Provide helpful error messages
    let userMessage = message;
    if (message.includes('timeout') || message.includes('Timeout')) {
      userMessage = 'The job posting page took too long to load. Please try again or paste the job description manually.';
    } else if (message.includes('Could not extract')) {
      userMessage = 'Could not extract job details from this page. The job posting format may have changed.';
    }

    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    );
  }
}
