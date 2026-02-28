import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { researchCompany } from './research-company';

const model = google('gemini-2.0-flash');

/**
 * Tailors a resume to match a job description
 */
async function tailorResume(resume: string, companyName: string, jobDescription: string): Promise<string> {
  const result = await generateText({
    model,
    prompt: `You are an expert resume writer. Given the following resume and job description for ${companyName}, create a tailored version of the resume that:

1. Highlights relevant skills and experience that match the job requirements
2. Uses keywords from the job description naturally
3. Maintains the original resume's truthfulness (don't add fake experience)
4. Keeps the same general structure but reorders/emphasizes relevant parts
5. Uses action verbs and quantifiable achievements

Original Resume:
${resume}

Company: ${companyName}

Job Description:
${jobDescription}

Return ONLY the tailored resume text, formatted professionally.`,
  });

  return result.text;
}

/**
 * Writes a cover letter based on resume, job description, and company research
 */
async function writeCoverLetter(
  resume: string,
  companyName: string,
  jobDescription: string,
  companyInfo: string
): Promise<string> {
  const result = await generateText({
    model,
    prompt: `You are an expert cover letter writer. Given the following resume, job description, and company research for ${companyName}, write a compelling cover letter that:

1. Is written in first person
2. Shows genuine enthusiasm for the role and specifically for ${companyName}
3. References specific things about the company (mission, values, culture, recent news) from the research provided
4. Highlights 2-3 key experiences from the resume that directly relate to the job
5. Explains why the candidate is a great fit for ${companyName}'s culture and mission
6. Is professional but personable
7. Is 3-4 paragraphs (not too long)
8. Includes a strong opening that mentions something specific about the company

Resume:
${resume}

Company: ${companyName}

${companyInfo ? `Company Research:\n${companyInfo}\n` : ''}

Job Description:
${jobDescription}

Return ONLY the cover letter text, ready to use. Do not include [Your Name], [Date], or address headers - just the letter body.`,
  });

  return result.text;
}

/**
 * Main agent function that generates both tailored resume and cover letter
 */
export async function generateResumeAndCoverLetter(
  resume: string,
  companyName: string,
  jobDescription: string
): Promise<{ tailoredResume: string; coverLetter: string; companyInfo: string }> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set');
  }

  // Step 1: Research the company first
  console.log(`Researching ${companyName}...`);
  const companyInfo = await researchCompany(companyName);
  console.log('Company research complete:', companyInfo ? 'Found info' : 'No info found');

  // Step 2: Generate both outputs in parallel (cover letter now uses company info)
  const [tailoredResume, coverLetter] = await Promise.all([
    tailorResume(resume, companyName, jobDescription),
    writeCoverLetter(resume, companyName, jobDescription, companyInfo),
  ]);

  return {
    tailoredResume,
    coverLetter,
    companyInfo,
  };
}
