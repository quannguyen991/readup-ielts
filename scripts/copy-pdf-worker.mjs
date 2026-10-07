import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const license = path.join(root, 'node_modules', 'pdfjs-dist', 'LICENSE');
const destinationDir = path.join(root, 'public', 'vendor');
await mkdir(destinationDir, { recursive: true });
await copyFile(source, path.join(destinationDir, 'pdf.worker.min.mjs'));
await copyFile(license, path.join(destinationDir, 'PDFJS-LICENSE.txt'));
