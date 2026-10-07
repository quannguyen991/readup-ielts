export type BrowserBookFile = {
  name: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
};

/** Extract a readable PDF or plain-text file in the current app platform. */
export async function extractBookPages(file: BrowserBookFile): Promise<string[]> {
  throw new Error('Nhập sách PDF hiện cần dùng trên trình duyệt web.');
}
