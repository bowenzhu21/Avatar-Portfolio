const sentenceSegmenter = new Intl.Segmenter("en", { granularity: "sentence" });

/** Keep complete sentences when trimming; otherwise end at a whole word. */
export function boundReply(text: string, maxWords: number, maxChars: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized || maxWords < 1 || maxChars < 1) return "";

  const fits = (candidate: string) =>
    candidate.length <= maxChars && candidate.split(" ").length <= maxWords;

  if (fits(normalized)) return normalized;

  let completeSentences = "";
  for (const sentence of sentenceSegmenter.segment(normalized)) {
    const candidate = normalized
      .slice(0, sentence.index + sentence.segment.length)
      .trimEnd();
    if (!fits(candidate)) break;
    if (/[.!?]["'’”\)\]]*$/.test(candidate)) completeSentences = candidate;
  }
  if (completeSentences) return completeSentences;

  const words: string[] = [];
  for (const word of normalized.split(" ").slice(0, maxWords)) {
    const candidate = [...words, word].join(" ");
    if (candidate.length + 1 > maxChars) break;
    words.push(word);
  }
  return `${words.join(" ")}…`;
}
