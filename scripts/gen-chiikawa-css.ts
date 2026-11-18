/**
 * Sinh khối CSS "theme-chiikawa" cho class màu của Tailwind (text-paper-ink, bg-brand/10,
 * text-[#6A4BD9]…): màu tím/chàm → hồng bằng đúng luật ở src/theme/chiikawa-recolor.ts.
 * Chạy: npx tsx scripts/gen-chiikawa-css.ts   (ghi giữa hai dấu mốc trong global.css)
 */
import fs from 'fs';
import path from 'path';
import { setPaletteId } from '../src/theme/palette-state';
import { chiikawaRecolor } from '../src/theme/chiikawa-recolor';

setPaletteId('chiikawa');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cfg = require('../tailwind.config.js');
const colors = cfg.theme.extend.colors as Record<string, string | Record<string, string>>;

const flat: Record<string, string> = {};
for (const [k, v] of Object.entries(colors)) {
  if (typeof v === 'string') flat[k] = v;
  else for (const [s, c] of Object.entries(v)) flat[s === 'DEFAULT' ? k : `${k}-${s}`] = c;
}

const PROPS: Record<string, string[]> = {
  text: ['color'],
  bg: ['background-color'],
  border: ['border-color'],
  'border-t': ['border-top-color'],
  'border-b': ['border-bottom-color'],
  'border-l': ['border-left-color'],
  'border-r': ['border-right-color'],
  ring: ['--tw-ring-color'],
  fill: ['fill'],
  stroke: ['stroke'],
  outline: ['outline-color'],
};

const BS = String.fromCharCode(92);
const esc = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, (c) => BS + c);
const rgbOf = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const recolorHex = (hex: string) => chiikawaRecolor(hex.toUpperCase());

function rule(cls: string, prop: string, value: string, alpha?: string): string {
  let v = value;
  if (alpha !== undefined) {
    const [r, g, b] = rgbOf(value);
    v = `rgb(${r} ${g} ${b} / ${alpha})`;
  }
  return `.theme-chiikawa .${esc(cls)} { ${prop}: ${v}; }`;
}

const root = path.join(__dirname, '..');
const chunks: string[] = [];
function walk(d: string) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?)$/.test(f.name)) chunks.push(fs.readFileSync(p, 'utf8'));
  }
}
walk(path.join(root, 'src'));
walk(path.join(root, 'app'));
const text = chunks.join('\n');

const out = new Set<string>();
const propKeys = Object.keys(PROPS).sort((a, b) => b.length - a.length).join('|');

// 1) Token thường: text-paper-ink …
for (const [name, hex] of Object.entries(flat)) {
  const to = recolorHex(hex);
  if (to === hex.toUpperCase()) continue;
  for (const [pre, props] of Object.entries(PROPS)) for (const p of props) out.add(rule(`${pre}-${name}`, p, to));
}
// 2) Token + độ mờ: bg-brand/10
const opRe = new RegExp(`(?<![A-Za-z0-9_-])(${propKeys})-([a-zA-Z][A-Za-z0-9_-]*?)/(\\d{1,3})(?![A-Za-z0-9_])`, 'g');
for (const m of text.matchAll(opRe)) {
  const pre = m[1]!;
  const name = m[2]!;
  const n = m[3]!;
  const hex = flat[name];
  if (!hex) continue;
  const to = recolorHex(hex);
  if (to === hex.toUpperCase()) continue;
  for (const p of PROPS[pre]!) out.add(rule(`${pre}-${name}/${n}`, p, to, String(+n / 100)));
}
// 3) Giá trị tuỳ ý: text-[#6A4BD9], bg-[#F3F0FB]/60
const arbRe = new RegExp(`(?<![A-Za-z0-9_-])(${propKeys})-\\[(#[0-9a-fA-F]{6})\\](?:/(\\d{1,3}))?`, 'g');
for (const m of text.matchAll(arbRe)) {
  const full = m[0];
  const pre = m[1]!;
  const hex = m[2]!;
  const n = m[3];
  const to = recolorHex(hex);
  if (to === hex.toUpperCase()) continue;
  for (const p of PROPS[pre]!) out.add(rule(full, p, to, n ? String(+n / 100) : undefined));
}
// 4) Gradient: from-/via-/to- (theo token và giá trị tuỳ ý)
const gradRe = new RegExp(`(?<![A-Za-z0-9_-])(from|via|to)-(?:\\[(#[0-9a-fA-F]{6})\\]|([a-zA-Z][A-Za-z0-9_-]*))(?![A-Za-z0-9_/\\[])`, 'g');
for (const m of text.matchAll(gradRe)) {
  const full = m[0];
  const pre = m[1]!;
  const arb = m[2];
  const name = m[3];
  const hex = arb ?? (name ? flat[name] : undefined);
  if (!hex) continue;
  const to = recolorHex(hex);
  if (to === hex.toUpperCase()) continue;
  const [r, g, b] = rgbOf(to);
  const stops =
    pre === 'from'
      ? `--tw-gradient-from: ${to} var(--tw-gradient-from-position); --tw-gradient-to: rgb(${r} ${g} ${b} / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);`
      : pre === 'via'
        ? `--tw-gradient-to: rgb(${r} ${g} ${b} / 0) var(--tw-gradient-to-position); --tw-gradient-stops: var(--tw-gradient-from), ${to} var(--tw-gradient-via-position), var(--tw-gradient-to);`
        : `--tw-gradient-to: ${to} var(--tw-gradient-to-position);`;
  out.add(`.theme-chiikawa .${esc(full)} { ${stops} }`);
}

const START = '/* >>> GENERATED:chiikawa-tailwind (scripts/gen-chiikawa-css.ts) */';
const END = '/* <<< GENERATED:chiikawa-tailwind */';
const file = path.join(root, 'global.css');
let css = fs.readFileSync(file, 'utf8');
const block = `${START}\n${[...out].sort().join('\n')}\n${END}`;
const a = css.indexOf(START);
if (a >= 0) {
  const b = css.indexOf(END, a);
  css = css.slice(0, a) + block + css.slice(b + END.length);
} else {
  const i = css.lastIndexOf('/*', css.indexOf(' * Con trỏ hình tim hồng'));
  if (i < 0) throw new Error('không thấy mốc chèn');
  css = css.slice(0, i) + block + '\n\n' + css.slice(i);
}
fs.writeFileSync(file, css);
console.log(`đã ghi ${out.size} luật`);
