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

//TODO: Write this function so that it will return, using the generateText function, key insigts from jobDescription. use: https://ai-sdk.dev/docs/ai-sdk-core/generating-text 

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

  // Create a coverLetterAgent using the ToolLoopAgent from the ai sdk.

  const coverLetterAgent = new ToolLoopAgent({
    model,
    // Edit these as you see fit !!!
    instructions: `You are an expert cover letter writer.
Use available tools whenever they help you produce a stronger, better-grounded cover letter.
In normal cases, gather company context and job requirement analysis before writing.
Write a 3-4 paragraph cover letter in first person.
Be professional but personable.
Return only the letter body.`,
  });

  // Write the following tools (resource: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
    tools: {
      // shoudl include a description, inputSchema, and and execute attribute that takes in company name, calls researchCompany(companyName), saves that into companyInfo variable defined earlier and returns companyInfo
      researchCompany: tool({

         execute: async ({ companyName }) => {

          return { companyInfo: info || "Not available" };
         },
      }),
      //TODO write the tool for analyzeJob: 
      analyzeJob: tool({
        
        execute: async ({ jobDescription }) => {
          // Missing a line here!
          return { jobAnalysis: analysis };
         },
      }),
    };

    
  const result = await coverLetterAgent.generate({
    // TODO Write a prompt whcih will give the agent the relevent context (company name, resume, jobDescription and ask it to create a cover letter!)
    prompt: `Create a cover letter for ${resume.slice(0,5000)}`

  });

  console.log("[Agent] Complete");
  return { coverLetter: stripCodeFences(result.text), companyInfo };
}
