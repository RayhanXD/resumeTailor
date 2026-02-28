import { generateText } from "ai";
import { google } from "@ai-sdk/google";

// ============================================================
// MODEL
// ============================================================

const model = google("gemini-2.0-flash");

// ============================================================
// TOOLS
// ============================================================

async function researchCompany(companyName: string): Promise<string> {
  console.log(`[Tool] Researching: ${companyName}`);

  if (!process.env.SERPER_API_KEY) {
    return "";
  }

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: `${companyName} company mission values culture`,
        num: 5,
      }),
    });

    if (!response.ok) return "";

    const data = await response.json();
    let info = "";

    if (data.knowledgeGraph?.description) {
      info += data.knowledgeGraph.description + "\n";
    }

    if (data.organic) {
      for (const result of data.organic.slice(0, 3)) {
        if (result.snippet) info += result.snippet + "\n";
      }
    }

    return info;
  } catch {
    return "";
  }
}

async function analyzeJob(jobDescription: string): Promise<string> {
  console.log("[Tool] Analyzing job...");

  const result = await generateText({
    model,
    prompt: `Extract key skills, responsibilities, and qualifications from this job description:\n\n${jobDescription}`,
  });

  return result.text;
}

async function writeCoverLetter(
  resume: string,
  companyName: string,
  companyInfo: string,
  jobAnalysis: string
): Promise<string> {
  console.log("[Tool] Writing cover letter...");

  const result = await generateText({
    model,
    prompt: `Write a 3-4 paragraph cover letter for ${companyName}.

RESUME:
${resume}

COMPANY INFO:
${companyInfo || "Not available"}

JOB REQUIREMENTS:
${jobAnalysis}

Write in first person. Be professional but personable. Return only the letter body.`,
  });

  return result.text;
}

// ============================================================
// AGENT
// ============================================================

export async function generateCoverLetter(
  resume: string,
  companyName: string,
  jobDescription: string
): Promise<{ coverLetter: string; companyInfo: string }> {
  console.log(`[Agent] Starting for ${companyName}`);

  // Step 1: Research company
  const companyInfo = await researchCompany(companyName);

  // Step 2: Analyze job
  const jobAnalysis = await analyzeJob(jobDescription.slice(0, 4000));

  // Step 3: Write cover letter
  const coverLetter = await writeCoverLetter(
    resume.slice(0, 4000),
    companyName,
    companyInfo,
    jobAnalysis
  );

  console.log("[Agent] Complete");
  return { coverLetter, companyInfo };
}
