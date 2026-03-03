export async function researchCompany(companyName: string): Promise<string> {
  if (!companyName.trim()) return "";
  if (!process.env.SERPER_API_KEY) return "";

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

    const lines: string[] = [];
    if (data.knowledgeGraph?.description) {
      lines.push(data.knowledgeGraph.description);
    }
    for (const result of data.organic?.slice(0, 3) ?? []) {
      if (result.snippet) lines.push(result.snippet);
    }
    return lines.join("\n").trim();
  } catch {
    return "";
  }
}
