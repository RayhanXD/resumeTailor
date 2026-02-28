import { generateText, ToolLoopAgent, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

// ============================================================
// MODEL
// ============================================================

const model = google("gemini-2.0-flash");

function stripCodeFences(text: string): string {
  // Remove fenced markdown wrappers if the model returns ```text ... ```
  return text
    .replace(/^```[a-zA-Z0-9_-]*\s*\n?/, "")
    .replace(/\n?```$/, "")
    .trim();
}

// ============================================================
// TOOLS
// ============================================================

// function to get information from a company (avoid changing this)
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

//TODO: Write this function so that it will return, using the generateText function, key insigts from jobDescription

async function analyzeJob(jobDescription: string): Promise<string> {
  console.log("[Tool] Analyzing job...");

  const result = await generateText({
    model,
    prompt: `Extract key skills, responsibilities, and qualifications from this job description:\n\n${jobDescription}`,
  });

  return result.text;
}

// ============================================================
// AGENT
// ============================================================

export async function generateCoverLetter(
  resume: string,
  companyName: string,
  jobDescription: string,
): Promise<{ coverLetter: string; companyInfo: string }> {
  console.log(`[Agent] Starting for ${companyName}`);

  // Keep per-request tool results local so concurrent requests do not share state.
  let companyInfo = "";

  const coverLetterAgent = new ToolLoopAgent({
    model,
    instructions: `You are an expert cover letter writer.
Use available tools whenever they help you produce a stronger, better-grounded cover letter.
In normal cases, gather company context and job requirement analysis before writing.
Write a 3-4 paragraph cover letter in first person.
Be professional but personable.
Return only the letter body.`,
    tools: {
      researchCompany: tool({
        description:
          "Research a company's mission, culture, values, and public positioning.",
        inputSchema: z.object({
          companyName: z.string().describe("The company to research"),
        }),
        execute: async ({ companyName }) => {
          const info = await researchCompany(companyName);
          companyInfo = info;
          return { companyInfo: info || "Not available" };
        },
      }),
      analyzeJob: tool({
        description:
          "Extract key skills, responsibilities, and qualifications from a job description.",
        inputSchema: z.object({
          jobDescription: z
            .string()
            .describe("Raw job description text to analyze"),
        }),
        execute: async ({ jobDescription }) => {
          const analysis = await analyzeJob(jobDescription);
          return { jobAnalysis: analysis };
        },
      }),
    },
  });

  const result = await coverLetterAgent.generate({
    prompt: `Create a cover letter for ${companyName}.

RESUME:
${resume.slice(0, 4000)}

COMPANY NAME:
${companyName}

JOB DESCRIPTION:
${jobDescription.slice(0, 4000)}

Produce the best possible cover letter.`,
  });

  console.log("[Agent] Complete");
  return { coverLetter: stripCodeFences(result.text), companyInfo };
}
