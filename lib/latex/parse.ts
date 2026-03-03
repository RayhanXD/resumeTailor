export type TextRange = {
  start: number;
  end: number;
  original: string;
};

export type ParsedResume = {
  bulletRanges: TextRange[];
  skillsRanges: TextRange[];
  bullets: string[];
  skillsValues: string[];
  bodyStart: number;
  bodyEnd: number;
};

function findBodyBounds(latex: string): { start: number; end: number } {
  const startToken = "\\begin{document}";
  const endToken = "\\end{document}";
  const start = latex.indexOf(startToken);
  const end = latex.lastIndexOf(endToken);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Invalid LaTeX: missing document boundaries");
  }
  return { start: start + startToken.length, end };
}

function extractCommandArgRanges(
  source: string,
  command: string,
): TextRange[] {
  const ranges: TextRange[] = [];
  let i = 0;
  while (i < source.length) {
    const idx = source.indexOf(command, i);
    if (idx === -1) break;

    let j = idx + command.length;
    while (j < source.length && /\s/.test(source[j])) j++;

    if (source[j] !== "{") {
      i = idx + command.length;
      continue;
    }

    const argStartBrace = j;
    let depth = 0;
    let k = j;
    let escaped = false;
    while (k < source.length) {
      const ch = source[k];
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "{") {
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0) break;
      }
      k++;
    }

    if (k >= source.length) break;

    const contentStart = argStartBrace + 1;
    const contentEnd = k;
    ranges.push({
      start: contentStart,
      end: contentEnd,
      original: source.slice(contentStart, contentEnd),
    });
    i = k + 1;
  }
  return ranges;
}

function extractSkillsValueRanges(body: string): TextRange[] {
  const ranges: TextRange[] = [];
  const skillsSection = /\\section\{Technical Skills\}([\s\S]*?)(?=\\section\{|\\end\{document\})/m;
  const sectionMatch = body.match(skillsSection);
  if (!sectionMatch || sectionMatch.index === undefined) return ranges;

  const sectionStart = sectionMatch.index;
  const sectionText = sectionMatch[1];
  const sectionAbsoluteStart = sectionStart + sectionMatch[0].indexOf(sectionText);

  const valueRegex =
    /\\textbf\{(?:[^{}]|\\.)+\}\{:\s*((?:[^{}]|\\.)*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = valueRegex.exec(sectionText)) !== null) {
    const value = m[1];
    const start =
      sectionAbsoluteStart + m.index + m[0].indexOf(value);
    ranges.push({
      start,
      end: start + value.length,
      original: value,
    });
  }

  return ranges;
}

export function parseLatexResume(latex: string): ParsedResume {
  const { start: bodyStart, end: bodyEnd } = findBodyBounds(latex);
  const body = latex.slice(bodyStart, bodyEnd);

  const bulletRangesLocal = extractCommandArgRanges(body, "\\resumeItem");
  const skillsRangesLocal = extractSkillsValueRanges(body);

  const bulletRanges = bulletRangesLocal.map((r) => ({
    ...r,
    start: r.start + bodyStart,
    end: r.end + bodyStart,
  }));
  const skillsRanges = skillsRangesLocal.map((r) => ({
    ...r,
    start: r.start + bodyStart,
    end: r.end + bodyStart,
  }));

  return {
    bulletRanges,
    skillsRanges,
    bullets: bulletRanges.map((r) => r.original.trim()),
    skillsValues: skillsRanges.map((r) => r.original.trim()),
    bodyStart,
    bodyEnd,
  };
}
