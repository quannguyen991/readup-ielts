import fs from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, '.local-private', 'open-vocab');
const downloads = [
  ...Array.from({ length: 6 }, (_, index) => {
    const level = index + 1;
    return {
      path: path.join(outputDir, 'hsk20', `${level}.json`),
      url: `https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/wordlists/exclusive/old/${level}.json`,
    };
  }),
  ...[1, 2, 3, 4, 5].map((level) => ({
    path: path.join(outputDir, 'jlpt', `n${level}.json`),
    url: `https://raw.githubusercontent.com/evanclan/OpenJLPT/main/data/json/vocab/n${level}.json`,
  })),
  {
    path: path.join(outputDir, 'linzi', 'tocfl-words.json'),
    url: 'https://www.linzi.app/data/files/tocfl-words.json',
  },
  {
    path: path.join(outputDir, 'linzi', 'hsk30-words.json'),
    url: 'https://www.linzi.app/data/files/hsk30-words.json',
  },
  {
    path: path.join(outputDir, 'frequency', 'words.json'),
    url: 'https://doudou-chinese.com/downloads/frequency/words.json',
  },
  {
    path: path.join(outputDir, 'frequency', 'cedict_1_0_ts_utf-8_mdbg.txt.gz'),
    url: 'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz',
  },
];

for (const item of downloads) {
  const response = await fetch(item.url);
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${item.url}`);
  const data = await response.arrayBuffer();
  await fs.mkdir(path.dirname(item.path), { recursive: true });
  await fs.writeFile(item.path, Buffer.from(data));
  console.log(`${path.relative(root, item.path)} · ${data.byteLength.toLocaleString()} bytes`);
}
