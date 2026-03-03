import type { ParsedResume } from "./parse";

/**
 * Reconstruct LaTeX by replacing original bullet texts and skills line
 * with tailored versions, preserving exact structure.
 * Process from end to start so string indices remain valid.
 */
export function reconstructLatex(
  originalLatex: string,
  parsedResume: ParsedResume,
  tailoredBullets: string[],
  tailoredSkillsLine?: string,
): string {
  let result = originalLatex;

  // Replace bullets from end to start to preserve indices
  const ranges = [...parsedResume.structureMeta.bulletRanges].reverse();
  const bullets = [...tailoredBullets].reverse();
  if (ranges.length !== bullets.length) {
    console.warn(
      `[Reconstruct] Bullet count mismatch: ${ranges.length} ranges vs ${tailoredBullets.length} tailored. Using min.`,
    );
  }
  const count = Math.min(ranges.length, bullets.length);
  for (let i = 0; i < count; i++) {
    const { start, end } = ranges[i];
    const newText = bullets[i] ?? ranges[i].originalText;
    result = result.slice(0, start) + newText + result.slice(end);
  }

  // Replace skills line if present
  if (
    parsedResume.structureMeta.skillsRange &&
    tailoredSkillsLine !== undefined &&
    tailoredSkillsLine !== ""
  ) {
    const { start, end } = parsedResume.structureMeta.skillsRange;
    result = result.slice(0, start) + tailoredSkillsLine + result.slice(end);
  }

  return result;
}
