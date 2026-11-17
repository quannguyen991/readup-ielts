/** Bìa vuông của gia sư và công cụ Speaking (public/hub/covers). Sinh bởi scripts/hub-covers/cut.py. */
const COVERS = new Set<string>([]);

export function hubCover(id: string): string | null {
  return COVERS.has(id) ? `/hub/covers/${id}.webp` : null;
}
