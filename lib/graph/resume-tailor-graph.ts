import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getResumeModel } from "@/lib/models";
import { parseLatexResume, type ParsedResume } from "@/lib/latex/parse";
import { researchCompany } from "@/lib/research-company";
import { enforceOnePageHeuristic } from "@/lib/latex/reconstruct";

const TAILOR_MAX_RETRIES = 3;
const GLOBAL_SCORE_THRESHOLD = 80;
const GLOBAL_MAX_RETRIES = 2;

function contentToString(content: unknown): string {
  if (typeof content === "string") return content;
  return JSON.stringify(content);
}

const ResumeState = Annotation.Root({
  latex: Annotation<string>(),
  companyName: Annotation<string>(),
  jobDescription: Annotation<string>(),
  companyResearch: Annotation<string>(),
  parsedResume: Annotation<ParsedResume>(),
  jobAnalysis: Annotation<string>(),
  recruiterLens: Annotation<string>(),
  tailoredBullets: Annotation<string[]>(),
  tailoredSkillsValues: Annotation<string[]>(),
  critique: Annotation<string>(),
  done: Annotation<boolean>(),
  tailorRetryCount: Annotation<number>(),
  score: Annotation<number>(),
  scoreFeedback: Annotation<string>(),
  globalRetryCount: Annotation<number>(),
});

export type ResumeStateType = typeof ResumeState.State;

async function parseInputsNode(
  state: ResumeStateType,
): Promise<Partial<ResumeStateType>> {
  const parsed = parseLatexResume(state.latex);
  if (parsed.bulletRanges.length === 0) {
    throw new Error(
      "No \\resumeItem{...} entries found. This formatter only edits \\resumeItem entries.",
    );
  }
  return { parsedResume: parsed };
}

async function researchCompanyNode(
  state: ResumeStateType,
): Promise<Partial<ResumeStateType>> {
  if (!state.companyName?.trim()) return { companyResearch: "" };
  return { companyResearch: await researchCompany(state.companyName) };
}

async function analyzeJobNode(
  state: ResumeStateType,
): Promise<Partial<ResumeStateType>> {
  const model = getResumeModel();
  const resp = await model.invoke([
    new SystemMessage(
      [
        "You are analyzing a job description for resume tailoring.",
        "Return JSON ONLY (no markdown, no explanation) with the fields:",
        "",
        "{",
        '  "mustHaveKeywords": string[],        // exact phrases/tech the job requires',
        '  "coreResponsibilities": string[],    // 5-10 bullet-style responsibilities',
        '  "niceToHaveKeywords": string[],      // optional but useful',
        '  "senioritySignals": string[],       // e.g. ownership, leadership',
        '  "domainContext": string,             // 1-3 sentences on domain',
        '  "roleArchetype": string,            // ONE of: "systems_backend_infrastructure" | "fullstack_product" | "frontend" | "ml_data" | "general_swe"',
        '  "skillsToPrioritize": string[],     // tech/skills to list FIRST on resume',
        '  "skillsToDeEmphasize": string[],   // tech that is less relevant for this role (list later)',
        '  "languageToUse": string[]          // e.g. "automation", "reliability", "observability", "pipelines" OR "user experience", "dashboards", "APIs"',
        "}",
        "",
        "roleArchetype: Pick the best match. systems_backend_infrastructure = storage, Linux, C/C++, Bash, monitoring, reliability, hardware/testing.",
        "fullstack_product = web apps, APIs, product features. frontend = UI, React, dashboards. ml_data = ML, data pipelines, models.",
        "languageToUse: Words/phrases the ideal candidate would use (e.g. for backend: automation, reliability, observability, performance, support, pipelines, testing).",
        "Focus on concrete skills, technologies, and responsibilities.",
      ].join("\n"),
    ),
    new HumanMessage(state.jobDescription),
  ]);
  return { jobAnalysis: contentToString(resp.content) };
}

async function recruiterLensNode(
  state: ResumeStateType,
): Promise<Partial<ResumeStateType>> {
  const model = getResumeModel();
  const resp = await model.invoke([
    new SystemMessage(
      [
        "You are a technical recruiter. Your output helps tailor the resume.",
        "Identify:",
        "1) Screening signals and language to emphasize in the resume.",
        "2) Role-type alignment: Does this job favor systems/backend/infrastructure (e.g. Linux, C/C++, Bash, storage, monitoring, reliability) or more full-stack/product/frontend (e.g. web apps, dashboards, APIs, React)?",
        "3) Mismatch risks: If the candidate's resume might read as 'product/frontend' but the job wants 'backend/systems', say so and suggest how to reframe (e.g. emphasize automation, reliability, pipelines, testing, not dashboards and UI).",
        "4) Keywords that must appear in skills or bullets for this role.",
        "Be concise but specific.",
      ].join("\n"),
    ),
    new HumanMessage(
      `Job description:\n${state.jobDescription}\n\nJob analysis (JSON):\n${state.jobAnalysis}`,
    ),
  ]);
  return { recruiterLens: contentToString(resp.content) };
}

async function tailorResumeNode(
  state: ResumeStateType,
): Promise<Partial<ResumeStateType>> {
  const parsed = state.parsedResume;
  const model = getResumeModel();

  const bullets = parsed.bullets.map((b, i) => `${i + 1}. ${b}`).join("\n");
  const skills = parsed.skillsValues
    .map((s, i) => `${i + 1}. ${s}`)
    .join("\n");

  const resp = await model.invoke([
    new SystemMessage(
      "Return valid JSON only. Do not include markdown fences.",
    ),
    new HumanMessage(
      [
        "You are tailoring a resume to a specific job description so it reads as a strong match (e.g. 8/10 or higher), not generic.",
        "",
        "Inputs:",
        `- job_description: ${state.jobDescription}`,
        `- job_analysis_json: ${state.jobAnalysis}`,
        `- recruiter_lens: ${state.recruiterLens}`,
        `- company_research: ${state.companyResearch || "N/A"}`,
        `- previous_critic_feedback: ${state.critique || "None yet"}`,
        `- previous_score_feedback: ${state.scoreFeedback || "None yet"}`,
        "",
        "ROLE-TYPE ALIGNMENT (critical):",
        "- The job_analysis_json includes roleArchetype (e.g. systems_backend_infrastructure, fullstack_product, frontend) and languageToUse.",
        "- Rewrite bullets so the resume reads as the RIGHT archetype. For systems/backend/infrastructure roles: use language like automation, reliability, observability, performance, support, pipelines, testing, monitoring — NOT product/dashboard/frontend framing unless the job asks for it.",
        "- For full-stack/product roles, keep relevant product/API language. For backend roles, reframe: e.g. 'Scaled Python APIs and async services with logs, retries, and monitoring-oriented workflows' instead of 'Enabled 23 SMBs by scaling React/Next.js...' when the latter is less relevant.",
        "- Even bullets from product-oriented roles should be reframed to highlight any technical/systems/automation/reliability angle that is truthful.",
        "",
        "1) BULLETS",
        "- For each original bullet, rewrite so that:",
        "  - It is truthful, grammatically correct, and a complete single sentence (at most 90 characters including spaces).",
        "  - It explicitly supports at least one core responsibility or mustHaveKeyword from job_analysis_json where honest.",
        "  - It uses the job's own language and the languageToUse vocabulary appropriate to roleArchetype.",
        "  - Prefer outcome-focused phrasing (XYZ style) when evidence is present.",
        "  - Fix any grammar or wording errors (e.g. 'to changes in data' → correct phrasing; 'by performance' → correct phrasing; 'MVPs presentations' → 'MVP presentations').",
        "- Do NOT add fake achievements, technologies, or numbers. Do NOT add or remove bullets.",
        "",
        "When previous_critic_feedback or previous_score_feedback are provided, implement all applicable improvements while respecting all constraints.",
        "",
        "2) TECHNICAL SKILLS",
        "- REORDER and optionally REWRITE the existing technical skills values.",
        "- You MUST:",
        "  - List skills that appear in skillsToPrioritize or mustHaveKeywords FIRST (in an order that matches the job).",
        "  - List skills from skillsToDeEmphasize or that are less relevant for this role (e.g. React/Next.js for a backend role) LATER.",
        "  - Use the job's exact technology names (e.g. Bash, C, C++, Kubernetes, JSON, YAML) where they truthfully apply based on the resume.",
        "  - If the candidate clearly has adjacent experience (e.g. Linux + scripting → Bash; Python + systems work), reword existing skill entries to include those terms where strongly supported by bullets; keep the same number of skill entries.",
        "- You may NOT remove important skills from the original; move less-relevant ones later. Do NOT invent skills with no support in the resume.",
        "",
        "Formatting: Do NOT write LaTeX. Same number of bullets and skill items. Each bullet: one sentence, ≤90 characters, grammatically correct.",
        "",
        "Original bullets (in order):",
        bullets,
        "",
        "Original skill values (in order):",
        skills || "none",
        "",
        'Return JSON exactly as:\n{"bullets":["..."],"skillsValues":["..."]}',
      ].join("\n"),
    ),
  ]);

  const raw = contentToString(resp.content)
    .replace(/^```json\s*/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  let tailoredBullets = [...parsed.bullets];
  let tailoredSkillsValues = [...parsed.skillsValues];

  try {
    const parsedJson = JSON.parse(raw) as {
      bullets?: unknown;
      skillsValues?: unknown;
    };
    if (Array.isArray(parsedJson.bullets)) {
      const list = parsedJson.bullets.map((x) => String(x).trim());
      if (list.length === tailoredBullets.length) tailoredBullets = list;
    }
    if (Array.isArray(parsedJson.skillsValues)) {
      const list = parsedJson.skillsValues.map((x) => String(x).trim());
      if (list.length === tailoredSkillsValues.length) tailoredSkillsValues = list;
    }
  } catch {
    // Keep originals if parsing fails.
  }

  return { tailoredBullets, tailoredSkillsValues };
}

async function onePageGuardNode(
  state: ResumeStateType,
): Promise<Partial<ResumeStateType>> {
  const compressed = enforceOnePageHeuristic(state.tailoredBullets, 100);
  return { tailoredBullets: compressed };
}

async function criticNode(
  state: ResumeStateType,
): Promise<Partial<ResumeStateType>> {
  const model = getResumeModel();
  const resp = await model.invoke([
    new SystemMessage(
      [
        "You are a strict quality gate. Return JSON with fields done(boolean) and critique(string).",
        "done=true ONLY if ALL of: bullets are role-aligned (match the job's archetype: systems/backend vs product/frontend), concise, truthful, each bullet is at most 90 characters and a single line, no bullet is truncated, and every bullet is grammatically correct.",
        "In critique: list any grammar/wording errors, role-type mismatches, or missing keyword emphasis.",
      ].join(" "),
    ),
    new HumanMessage(
      [
        `Job analysis (includes roleArchetype and languageToUse):\n${state.jobAnalysis}`,
        "",
        "Tailored bullets:",
        state.tailoredBullets.join("\n"),
      ].join("\n"),
    ),
  ]);

  const raw = contentToString(resp.content)
    .replace(/^```json\s*/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  try {
    const obj = JSON.parse(raw) as { done?: boolean; critique?: string };
    const done = Boolean(obj.done);
    const critique = obj.critique ?? "";
    const retries = state.tailorRetryCount ?? 0;
    return {
      done,
      critique,
      tailorRetryCount: done ? retries : retries + 1,
    };
  } catch {
    return {
      done: true,
      critique: "Accepted by fallback parser.",
      tailorRetryCount: state.tailorRetryCount ?? 0,
    };
  }
}

async function globalScorerNode(
  state: ResumeStateType,
): Promise<Partial<ResumeStateType>> {
  const model = getResumeModel();
  const resp = await model.invoke([
    new SystemMessage(
      [
        "You are evaluating how well a tailored resume matches a specific job description.",
        "Return JSON ONLY (no markdown) with the fields:",
        "",
        "{",
        '  "score": number,    // integer 0-100, higher is better tailoring',
        '  "feedback": string  // concise, actionable suggestions to improve alignment',
        "}",
        "",
        "Scoring guidelines (0-100):",
        "- 90-100: Excellent match; resume reads as the right role type (e.g. systems/backend for a storage role); must-have keywords and core responsibilities clearly covered; skills ordered with job-relevant tech first; no grammar issues.",
        "- 80-89: Strong; minor improvements possible but good to submit.",
        "- 60-79: Mixed; role-type mismatch (e.g. reads product/frontend for a backend job), or several must-haves missing, or skills order does not prioritize job stack.",
        "- 0-59: Poor; wrong archetype, many must-haves missing, or skills section not tailored.",
        "",
        "Consider and penalize if missing:",
        "- Role-type alignment: For systems/backend/infrastructure roles, the resume should emphasize automation, reliability, observability, pipelines, testing — not frontend/product/dashboard framing.",
        "- Coverage of mustHaveKeywords and coreResponsibilities in bullets and skills.",
        "- Technical skills order: job-relevant tech (from skillsToPrioritize / mustHaveKeywords) must appear first; less relevant (e.g. React for a backend role) last.",
        "- Grammar and clarity; no obvious wording errors.",
        "- Truthfulness; no buzzword stuffing.",
      ].join("\n"),
    ),
    new HumanMessage(
      [
        `Job description:\n${state.jobDescription}`,
        "",
        `Job analysis JSON:\n${state.jobAnalysis}`,
        "",
        `Recruiter lens:\n${state.recruiterLens}`,
        "",
        `Company research:\n${state.companyResearch || "N/A"}`,
        "",
        "Tailored bullets:",
        state.tailoredBullets.join("\n"),
        "",
        "Tailored technical skills values:",
        state.tailoredSkillsValues.join("\n") || "none",
      ].join("\n"),
    ),
  ]);

  const raw = contentToString(resp.content)
    .replace(/^```json\s*/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  let score = state.score ?? 0;
  let scoreFeedback = state.scoreFeedback ?? "";
  let globalRetryCount = state.globalRetryCount ?? 0;

  try {
    const obj = JSON.parse(raw) as { score?: unknown; feedback?: unknown };
    if (typeof obj.score === "number" && Number.isFinite(obj.score)) {
      score = obj.score;
    }
    if (typeof obj.feedback === "string") {
      scoreFeedback = obj.feedback;
    }
  } catch {
    // Keep previous score and feedback if parsing fails.
  }

  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const shouldIncrementRetry =
    clampedScore < GLOBAL_SCORE_THRESHOLD &&
    (state.globalRetryCount ?? 0) < GLOBAL_MAX_RETRIES;

  if (shouldIncrementRetry) {
    globalRetryCount += 1;
  }

  return {
    score: clampedScore,
    scoreFeedback,
    globalRetryCount,
  };
}

const graph = new StateGraph(ResumeState)
  .addNode("parse_inputs", parseInputsNode)
  .addNode("research_company", researchCompanyNode)
  .addNode("analyze_job", analyzeJobNode)
  .addNode("recruiter_lens", recruiterLensNode)
  .addNode("tailor_resume", tailorResumeNode)
  .addNode("one_page_guard", onePageGuardNode)
  .addNode("critic", criticNode)
  .addNode("global_scorer", globalScorerNode)
  .addEdge(START, "parse_inputs")
  .addEdge("parse_inputs", "research_company")
  .addEdge("research_company", "analyze_job")
  .addEdge("analyze_job", "recruiter_lens")
  .addEdge("recruiter_lens", "tailor_resume")
  .addEdge("tailor_resume", "one_page_guard")
  .addEdge("one_page_guard", "critic")
  .addConditionalEdges("critic", (state: ResumeStateType) => {
    const retries = state.tailorRetryCount ?? 0;
    if (state.done || retries >= TAILOR_MAX_RETRIES) return "done";
    return "retry";
  }, {
    done: "global_scorer",
    retry: "tailor_resume",
  })
  .addConditionalEdges("global_scorer", (state: ResumeStateType) => {
    const score = state.score ?? 0;
    const globalRetries = state.globalRetryCount ?? 0;
    if (score >= GLOBAL_SCORE_THRESHOLD || globalRetries >= GLOBAL_MAX_RETRIES) {
      return "accept";
    }
    return "improve";
  }, {
    accept: END,
    improve: "tailor_resume",
  });

export const resumeTailorGraph = graph.compile();
