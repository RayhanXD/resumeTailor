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

  let companyInfo = "";

  //TODO Create a coverLetterAgent using the ToolLoopAgent from the ai sdk.
  // you have two tools you can provide this agent using the functions declared above earlier(resource: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)

  const result = await coverLetterAgent.generate({
    // TODO Write a prompt whcih will give the agent the relevent context (company name, resume, jobDescription and ask it to create a cover letter!)
    prompt: `Create a cover letter for ${resume.slice(0, 5000)}`,
  });

  console.log("[Agent] Complete");
  return { coverLetter: stripCodeFences(result.text), companyInfo };
}
