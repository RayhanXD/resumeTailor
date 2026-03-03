export interface ParsedResume {
  bullets: string[];
  skillsLine?: string;
  structureMeta: {
    bulletRanges: Array<{ start: number; end: number; originalText: string }>;
    skillsRange?: { start: number; end: number; originalText: string };
  };
}

/**
 * Strips common LaTeX formatting from text for LLM consumption.
 * Preserves the original for reconstruction.
 */
function stripLatexForDisplay(text: string): string {
  return text
    .replace(/\\textbf\{([^}]*)\}/g, "$1")
    .replace(/\\textit\{([^}]*)\}/g, "$1")
    .replace(/\\emph\{([^}]*)\}/g, "$1")
    .replace(/\\textit\{([^}]*)\}/g, "$1")
    .replace(/\\&/g, "&")
    .replace(/\\%/g, "%")
    .replace(/\\\\/g, "\n")
    .trim();
}

/**
 * Parse LaTeX resume into bullets and optional skills line.
 * Uses regex to find \item blocks and a "Technical skills" section.
 */
export function parseLatexResume(latex: string): ParsedResume {
  const bulletRanges: ParsedResume["structureMeta"]["bulletRanges"] = [];
  const bullets: string[] = [];

  // Match \item with braced or unbraced content
  const itemRegex = /\\item\s*(?:\[[^\]]*\])?\s*(?:\{((?:[^{}]|\{[^{}]*\})*)\}|([^\n]+?))(?=\s*\n\s*\\item|\s*\n\s*\\end|\s*\n\s*\\section|\s*\n\s*\\subsection|\s*$)/gm;
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(latex)) !== null) {
    const braced = m[1];
    const unbraced = m[2];
    const content = (braced ?? unbraced ?? "").trim();
    const originalText = content;
    const contentOffset = m[0].indexOf(content);
    const start = m.index + contentOffset;
    const end = start + content.length;

    bulletRanges.push({ start, end, originalText });
    bullets.push(stripLatexForDisplay(content));
  }

  // Look for skills section: \section*{Technical Skills}, \section{Skills}, etc.
  const skillsSectionRegex = /\\section(?:\*)?\s*\{[^}]*(?:Technical\s+Skills|Skills|Technologies)[^}]*\}\s*\n([\s\S]*?)(?=\\section|\\begin\{|\n\n\n|\Z)/i;
  const skillsMatch = latex.match(skillsSectionRegex);
  let skillsLine: string | undefined;
  let skillsRange: ParsedResume["structureMeta"]["skillsRange"] | undefined;

  if (skillsMatch) {
    const rawSkills = skillsMatch[1].trim();
    // Often skills are on one line: Python, Java, React, ...
    skillsLine = stripLatexForDisplay(rawSkills);
    const skillsStart = latex.indexOf(rawSkills);
    skillsRange = {
      start: skillsStart,
      end: skillsStart + rawSkills.length,
      originalText: rawSkills,
    };
  }

  return {
    bullets,
    skillsLine,
    structureMeta: {
      bulletRanges,
      skillsRange,
    },
  };
}
