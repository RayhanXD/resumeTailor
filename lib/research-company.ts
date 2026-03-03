/**
 * Serper-based company research. Reused by the LangGraph research_company node.
 */
export async function researchCompany(companyName: string): Promise<string> {
  console.log(`[Research] Company: ${companyName}`);

  if (!companyName?.trim()) return "";

  if (!process.env.SERPER_API_KEY) {
    console.warn("[Research] SERPER_API_KEY not set, skipping company research");
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

    const data = (await response.json()) as {
      knowledgeGraph?: { description?: string };
      organic?: Array<{ snippet?: string }>;
    };
    let info = "";

    if (data.knowledgeGraph?.description) {
      info += data.knowledgeGraph.description + "\n";
    }

    if (data.organic) {
      for (const result of data.organic.slice(0, 3)) {
        if (result.snippet) info += result.snippet + "\n";
      }
    }

    return info.trim();
  } catch {
    return "";
  }
}
