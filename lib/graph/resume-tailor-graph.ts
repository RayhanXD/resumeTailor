import {
  Annotation,
  StateGraph,
  START,
  END,
} from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getResumeModel } from "@/lib/models";
import { researchCompany } from "@/lib/research-company";
import { parseLatexResume, type ParsedResume } from "@/lib/latex/parse";

// ============================================================
// STATE
// ============================================================

const ResumeTailorState = Annotation.Root({
  latex: Annotation<string>(),
  jobDescription: Annotation<string>(),
  companyName: Annotation<string>(),
  companyResearch: Annotation<string>(),
  jobAnalysis: Annotation<string>(),
  recruiterLens: Annotation<string>(),
  parsedResume: Annotation<ParsedResume | undefined>(),
  tailoredBullets: Annotation<string[]>(),
  tailoredSkillsLine: Annotation<string | undefined>(),
  critique: Annotation<string | undefined>(),
  done: Annotation<boolean>(),
});

export type ResumeTailorStateType = typeof ResumeTailorState.State;

// ============================================================
// NODES
// ============================================================

function parseInputsNode(
  state: ResumeTailorStateType,
): Partial<ResumeTailorStateType> {
  const parsed = parseLatexResume(state.latex);
  return { parsedResume: parsed };
}

async function researchCompanyNode(
  state: ResumeTailorStateType,
): Promise<Partial<ResumeTailorStateType>> {
  if (!state.companyName?.trim()) {
    return { companyResearch: "" };
  }
  const info = await researchCompany(state.companyName);
  return { companyResearch: info };
}

async function analyzeJobNode(
  state: ResumeTailorStateType,
): Promise<Partial<ResumeTailorStateType>> {
  const model = getResumeModel();
  const { content } = await model.invoke([
    new SystemMessage(
      "Extract key skills, responsibilities, qualifications, and must-haves from the job description. Be concise and structured.",
    ),
    new HumanMessage(state.jobDescription.slice(0, 8000)),
  ]);
  const text = typeof content === "string" ? content : String(content);
  return { jobAnalysis: text };
}

async function recruiterLensNode(
  state: ResumeTailorStateType,
): Promise<Partial<ResumeTailorStateType>> {
  const model = getResumeModel();
  const { content } = await model.invoke([
    new SystemMessage(
      "What would a recruiter or hiring manager screen for in this role? List keywords, experience signals, and potential red flags. Be concise.",
    ),
    new HumanMessage(
      `Job description:\n${state.jobDescription.slice(0, 4000)}\n\nJob analysis:\n${state.jobAnalysis?.slice(0, 2000) ?? ""}`,
    ),
  ]);
  const text = typeof content === "string" ? content : String(content);
  return { recruiterLens: text };
}

async function tailorResumeNode(
  state: ResumeTailorStateType,
): Promise<Partial<ResumeTailorStateType>> {
  const parsed = state.parsedResume;
  if (!parsed || parsed.bullets.length === 0) {
    return { tailoredBullets: [], tailoredSkillsLine: undefined };
  }

  const model = getResumeModel();
  const bulletsText = parsed.bullets
    .map((b, i) => `[${i + 1}] ${b}`)
    .join("\n");
  const skillsText = parsed.skillsLine ?? "(none)";

  const prompt = `You are an expert resume writer. Rewrite the resume bullet points and technical skills to match this job. 

RULES:
- Use XYZ format: Accomplished [X] as measured by [Y] by doing [Z]
- No buzzwords (synergy, leverage, drive, spearhead, etc.)
- Don't overclaim or exaggerate; stay truthful but impactful
- Prefer lines within 76-80 characters when possible
- Keep technical skills line relevant to the job; reorder or add job-relevant skills if needed
- Return ONLY the rewritten content, no explanation

Job analysis:
${state.jobAnalysis?.slice(0, 2000) ?? ""}

Recruiter lens (what they look for):
${state.recruiterLens?.slice(0, 1000) ?? ""}

Company context:
${state.companyResearch?.slice(0, 500) ?? "Not available"}

ORIGINAL BULLETS:
${bulletsText}

ORIGINAL TECHNICAL SKILLS:
${skillsText}

Return your response in this exact JSON format (no markdown, no code fences):
{"bullets": ["bullet1", "bullet2", ...], "skillsLine": "Skill1, Skill2, ..."}

If skillsLine was "(none)", return the skillsLine as empty string "".`;

  const { content } = await model.invoke([
    new SystemMessage("You output valid JSON only. No other text."),
    new HumanMessage(prompt),
  ]);
  const text = typeof content === "string" ? content : String(content);
  const cleaned = text.replace(/^```\w*\n?/, "").replace(/\n?```$/, "").trim();

  let bullets: string[];
  let skillsLine: string | undefined;
  try {
    const parsed = JSON.parse(cleaned) as { bullets?: string[]; skillsLine?: string };
    bullets = Array.isArray(parsed.bullets) ? parsed.bullets : [];
    skillsLine = typeof parsed.skillsLine === "string" ? parsed.skillsLine : undefined;
  } catch {
    // Fallback: treat as raw bullets, one per line
    bullets = cleaned
      .split(/\n+/)
      .map((s) => s.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
    skillsLine = parsed.skillsLine;
  }

  // Ensure we have same count as original
  const originalCount = state.parsedResume!.bullets.length;
  if (bullets.length !== originalCount) {
    const padding = bullets.length < originalCount
      ? Array(originalCount - bullets.length).fill("")
      : [];
    bullets = [...bullets.slice(0, originalCount), ...padding].slice(0, originalCount);
  }

  return { tailoredBullets: bullets, tailoredSkillsLine: skillsLine ?? undefined };
}

async function criticNode(
  state: ResumeTailorStateType,
): Promise<Partial<ResumeTailorStateType>> {
  const model = getResumeModel();
  const { content } = await model.invoke([
    new SystemMessage(
      "You evaluate resume tailoring quality. Return a JSON object with: critique (short feedback), done (boolean). Set done=true only if the tailored bullets align well with the job, use XYZ format, avoid buzzwords, and sound professional. Set done=false if significant improvements are needed.",
    ),
    new HumanMessage(
      `Job analysis:\n${state.jobAnalysis?.slice(0, 1500)}\n\nRecruiter lens:\n${state.recruiterLens?.slice(0, 800)}\n\nOriginal bullets:\n${state.parsedResume?.bullets?.join("\n") ?? ""}\n\nTailored bullets:\n${state.tailoredBullets?.join("\n") ?? ""}`,
    ),
  ]);
  const text = typeof content === "string" ? content : String(content);
  const cleaned = text.replace(/^```\w*\n?/, "").replace(/\n?```$/, "").trim();

  let done = true;
  let critique = "Accepted.";
  try {
    const parsed = JSON.parse(cleaned) as { done?: boolean; critique?: string };
    done = parsed.done !== false;
    critique = typeof parsed.critique === "string" ? parsed.critique : critique;
  } catch {
    // Default to done to avoid infinite loop
  }

  return { critique, done };
}

// ============================================================
// GRAPH
// ============================================================

const graphBuilder = new StateGraph(ResumeTailorState)
  .addNode("parse_inputs", parseInputsNode)
  .addNode("research_company", researchCompanyNode)
  .addNode("analyze_job", analyzeJobNode)
  .addNode("recruiter_lens", recruiterLensNode)
  .addNode("tailor_resume", tailorResumeNode)
  .addNode("critic", criticNode)
  .addEdge(START, "parse_inputs")
  .addEdge("parse_inputs", "research_company")
  .addEdge("research_company", "analyze_job")
  .addEdge("analyze_job", "recruiter_lens")
  .addEdge("recruiter_lens", "tailor_resume")
  .addEdge("tailor_resume", "critic")
  .addConditionalEdges(
    "critic",
    (state: ResumeTailorStateType) => (state.done ? "end" : "retailor"),
    { end: END, retailor: "tailor_resume" },
  );

export const resumeTailorGraph = graphBuilder.compile();
