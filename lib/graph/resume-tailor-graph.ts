import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getResumeModel } from "@/lib/models";
import { parseLatexResume, type ParsedResume } from "@/lib/latex/parse";
import { researchCompany } from "@/lib/research-company";
import { enforceOnePageHeuristic } from "@/lib/latex/reconstruct";

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
      "Extract key hard skills, responsibilities, required experience level, and must-have keywords from this job description. Be concise.",
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
      "You are a technical recruiter. Identify screening signals, red flags, and language to emphasize for interviews.",
    ),
    new HumanMessage(
      `Job description:\n${state.jobDescription}\n\nJob analysis:\n${state.jobAnalysis}`,
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
      `Tailor ONLY the provided resume bullet text and technical-skills values.\n` +
        `Do NOT write LaTeX.\n` +
        `Do NOT add or remove list items.\n` +
        `Keep facts truthful and non-exaggerated.\n` +
        `Prefer concise bullets to fit one page.\n` +
        `Use XYZ-style outcomes when supported by evidence.\n\n` +
        `Job analysis:\n${state.jobAnalysis}\n\n` +
        `Recruiter lens:\n${state.recruiterLens}\n\n` +
        `Company context:\n${state.companyResearch || "N/A"}\n\n` +
        `Original bullets (${parsed.bullets.length}):\n${bullets}\n\n` +
        `Original skill values (${parsed.skillsValues.length}):\n${skills || "none"}\n\n` +
        `Return JSON exactly:\n` +
        `{"bullets":["..."],"skillsValues":["..."]}`,
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
  const compressed = enforceOnePageHeuristic(state.tailoredBullets, 140);
  return { tailoredBullets: compressed };
}

async function criticNode(
  state: ResumeStateType,
): Promise<Partial<ResumeStateType>> {
  const model = getResumeModel();
  const resp = await model.invoke([
    new SystemMessage(
      "You are a strict quality gate. Return JSON with fields done(boolean) and critique(string). done=true only if bullets are role-aligned, concise, and truthful.",
    ),
    new HumanMessage(
      `Job analysis:\n${state.jobAnalysis}\n\n` +
        `Tailored bullets:\n${state.tailoredBullets.join("\n")}`,
    ),
  ]);

  const raw = contentToString(resp.content)
    .replace(/^```json\s*/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  try {
    const obj = JSON.parse(raw) as { done?: boolean; critique?: string };
    return {
      done: Boolean(obj.done),
      critique: obj.critique ?? "",
    };
  } catch {
    return { done: true, critique: "Accepted by fallback parser." };
  }
}

const graph = new StateGraph(ResumeState)
  .addNode("parse_inputs", parseInputsNode)
  .addNode("research_company", researchCompanyNode)
  .addNode("analyze_job", analyzeJobNode)
  .addNode("recruiter_lens", recruiterLensNode)
  .addNode("tailor_resume", tailorResumeNode)
  .addNode("one_page_guard", onePageGuardNode)
  .addNode("critic", criticNode)
  .addEdge(START, "parse_inputs")
  .addEdge("parse_inputs", "research_company")
  .addEdge("research_company", "analyze_job")
  .addEdge("analyze_job", "recruiter_lens")
  .addEdge("recruiter_lens", "tailor_resume")
  .addEdge("tailor_resume", "one_page_guard")
  .addEdge("one_page_guard", "critic")
  .addConditionalEdges("critic", (state: ResumeStateType) => {
    return state.done ? "done" : "retry";
  }, {
    done: END,
    retry: "tailor_resume",
  });

export const resumeTailorGraph = graph.compile();
