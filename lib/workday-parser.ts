export interface WorkdayJobData {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
}

const WORKDAY_URL_PATTERN = /^https?:\/\/([a-zA-Z0-9-]+)\.wd\d+\.myworkdayjobs\.com\/.+/;

export function isWorkdayUrl(url: string): boolean {
  return WORKDAY_URL_PATTERN.test(url);
}

export function extractCompanyFromUrl(url: string): string | null {
  const match = url.match(/^https?:\/\/([a-zA-Z0-9-]+)\.wd\d+/);
  if (match) {
    const slug = match[1];
    return slug.charAt(0).toUpperCase() + slug.slice(1);
  }
  return null;
}

export async function parseWorkdayJob(url: string): Promise<WorkdayJobData> {
  if (!isWorkdayUrl(url)) {
    throw new Error('Invalid Workday URL format');
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch job posting: ${response.status}`);
  }

  const html = await response.text();

  // Extract job title from meta tags or page content
  const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)
    || html.match(/<title>([^<]+)<\/title>/i);
  const jobTitle = titleMatch ? titleMatch[1].trim() : '';

  // Extract description from meta tags
  const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i)
    || html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);

  // Try to get full job description from JSON-LD structured data
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/i);
  let jobDescription = '';

  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      if (jsonLd.description) {
        jobDescription = jsonLd.description;
      }
    } catch {
      // JSON parsing failed, use meta description
    }
  }

  if (!jobDescription && descMatch) {
    jobDescription = descMatch[1];
  }

  // Extract company name from URL subdomain as primary source
  const companyName = extractCompanyFromUrl(url) || 'Unknown Company';

  if (!jobDescription) {
    throw new Error('Could not extract job description. Workday may require JavaScript rendering - please paste the job description manually.');
  }

  return {
    companyName,
    jobTitle,
    jobDescription,
  };
}
