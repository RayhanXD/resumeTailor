import type { ParsedResume } from "./parse";

function replaceRanges(
  source: string,
  pairs: Array<{ start: number; end: number; value: string }>,
): string {
  const sorted = [...pairs].sort((a, b) => b.start - a.start);
  let out = source;
  for (const p of sorted) {
    out = out.slice(0, p.start) + p.value + out.slice(p.end);
  }
  return out;
}

function normalizeOneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Escapes LaTeX-special characters so inserted content compiles (e.g. in Overleaf). */
function escapeLatexForContent(text: string): string {
  const BACKSLASH_PLACEHOLDER = "\uE000";
  return text
    .replace(/\\/g, BACKSLASH_PLACEHOLDER)
    .replace(/%/g, "\\%")
    .replace(/}/g, "\\}")
    .replace(/{/g, "\\{")
    .replace(/&/g, "\\&")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\$/g, "\\$")
    .replace(/\u2026/g, "\\ldots")
    .replace(new RegExp(BACKSLASH_PLACEHOLDER, "g"), "\\textbackslash{}");
}

export function enforceOnePageHeuristic(
  bullets: string[],
  maxCharsPerBullet = 100,
): string[] {
  return bullets.map((b) => {
    const clean = normalizeOneLine(b);
    if (clean.length <= maxCharsPerBullet) return clean;
    return clean.slice(0, maxCharsPerBullet).trimEnd();
  });
}

export function reconstructLatex(
  originalLatex: string,
  parsed: ParsedResume,
  tailoredBullets: string[],
  tailoredSkillsValues: string[],
): string {
  if (tailoredBullets.length !== parsed.bulletRanges.length) {
    throw new Error(
      `Bullet count mismatch: expected ${parsed.bulletRanges.length}, got ${tailoredBullets.length}`,
    );
  }
  if (tailoredSkillsValues.length !== parsed.skillsRanges.length) {
    throw new Error(
      `Skills count mismatch: expected ${parsed.skillsRanges.length}, got ${tailoredSkillsValues.length}`,
    );
  }

  const guardedBullets = enforceOnePageHeuristic(tailoredBullets);

  const bulletPairs = parsed.bulletRanges.map((r, i) => ({
    start: r.start,
    end: r.end,
    value: escapeLatexForContent(guardedBullets[i]),
  }));
  const skillsPairs = parsed.skillsRanges.map((r, i) => ({
    start: r.start,
    end: r.end,
    value: escapeLatexForContent(normalizeOneLine(tailoredSkillsValues[i])),
  }));

  return replaceRanges(originalLatex, [...bulletPairs, ...skillsPairs]);
}
