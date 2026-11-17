/** Bìa vuông của gia sư và công cụ Speaking (public/hub/covers). Sinh bởi scripts/hub-covers/cut.py. */
const COVERS = new Set<string>(["band-upgrade", "conflict", "daily-english", "dating", "diary", "fluency", "grammar", "idioms", "ielts-examiner", "ielts-part1", "ielts-part2", "ielts-part3", "interview", "leader-comms", "leadership", "meeting", "negotiation", "phone", "presentation", "profile", "pronounce", "public-speaking", "sales", "small-talk", "speech-analysis", "storytelling", "talk", "tool-analyze", "tool-meeting", "tool-pitch", "tool-scenarios", "tool-shadow", "tool-short", "tool-topics", "travel", "vocab"]);

export function hubCover(id: string): string | null {
  return COVERS.has(id) ? `/hub/covers/${id}.webp` : null;
}
