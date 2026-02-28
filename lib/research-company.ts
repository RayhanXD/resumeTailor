/**
 * Researches a company using Serper API (Google Search)
 * Returns summarized info about mission, values, culture, and recent news
 */
export async function researchCompany(companyName: string): Promise<string> {
  if (!process.env.SERPER_API_KEY) {
    console.warn('SERPER_API_KEY not set, skipping company research');
    return '';
  }

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `${companyName} company mission values culture about us`,
        num: 5,
      }),
    });

    if (!response.ok) {
      console.error('Serper API error:', response.status);
      return '';
    }

    const data = await response.json();

    // Extract relevant info from search results
    let companyInfo = `Company Research for ${companyName}:\n\n`;

    // Add knowledge graph info if available
    if (data.knowledgeGraph) {
      const kg = data.knowledgeGraph;
      if (kg.description) {
        companyInfo += `Overview: ${kg.description}\n\n`;
      }
      if (kg.attributes) {
        companyInfo += `Key Facts:\n`;
        for (const [key, value] of Object.entries(kg.attributes)) {
          companyInfo += `- ${key}: ${value}\n`;
        }
        companyInfo += '\n';
      }
    }

    // Add organic search results
    if (data.organic && data.organic.length > 0) {
      companyInfo += `From web search:\n`;
      for (const result of data.organic.slice(0, 3)) {
        if (result.snippet) {
          companyInfo += `- ${result.snippet}\n`;
        }
      }
    }

    return companyInfo;
  } catch (error) {
    console.error('Error researching company:', error);
    return '';
  }
}
