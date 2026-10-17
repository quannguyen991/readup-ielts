import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const PUBLIC_OUT = path.resolve('public/books/covers');
const ASSETS_OUT = path.resolve('assets/books/covers');

[PUBLIC_OUT, ASSETS_OUT].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Official Cambridge IELTS color schemes (Vols 7 - 20)
const CAM_SERIES = [
  { vol: 7, bg: '#0D2137', spine: '#081422', numGrad1: '#FBBF24', numGrad2: '#B45309', accent: '#FDE68A' },
  { vol: 8, bg: '#0A1E33', spine: '#06121F', numGrad1: '#A3E635', numGrad2: '#4D7C0F', accent: '#BEF264' },
  { vol: 9, bg: '#0B2238', spine: '#061524', numGrad1: '#38BDF8', numGrad2: '#0284C7', accent: '#7DD3FC' },
  { vol: 10, bg: '#0C1E36', spine: '#071324', numGrad1: '#F59E0B', numGrad2: '#B45309', accent: '#FCD34D' },
  { vol: 11, bg: '#091C30', spine: '#05111F', numGrad1: '#FB923C', numGrad2: '#C2410C', accent: '#FDBA74' },
  { vol: 12, bg: '#0D253E', spine: '#071627', numGrad1: '#FBBF24', numGrad2: '#D97706', accent: '#FDE68A' },
  { vol: 13, bg: '#092138', spine: '#051424', numGrad1: '#38BDF8', numGrad2: '#0369A1', accent: '#7DD3FC' },
  { vol: 14, bg: '#0A1E36', spine: '#061324', numGrad1: '#FB923C', numGrad2: '#EA580C', accent: '#FDBA74' },
  { vol: 15, bg: '#082333', spine: '#041621', numGrad1: '#34D399', numGrad2: '#059669', accent: '#6EE7B7' },
  { vol: 16, bg: '#071F36', spine: '#041322', numGrad1: '#2DD4BF', numGrad2: '#0D9488', accent: '#5EEAD4' },
  { vol: 17, bg: '#09223D', spine: '#051527', numGrad1: '#FBBF24', numGrad2: '#D97706', accent: '#FDE68A' },
  { vol: 18, bg: '#091F38', spine: '#051324', numGrad1: '#60A5FA', numGrad2: '#2563EB', accent: '#93C5FD' },
  { vol: 19, bg: '#081728', spine: '#040E1B', numGrad1: '#A3E635', numGrad2: '#65A30D', accent: '#BEF264' },
  { vol: 20, bg: '#052222', spine: '#031414', numGrad1: '#38BDF8', numGrad2: '#0D9488', accent: '#5EEAD4' },
];

// Actual Volumes Series (1 - 10)
const VOL_SERIES = [
  { vol: 1, title: 'VOL 1', bg: '#43091B', spine: '#23030D' },
  { vol: 2, title: 'VOL 2', bg: '#4A0B20', spine: '#270410' },
  { vol: 3, title: 'VOL 3', bg: '#500D24', spine: '#2C0513' },
  { vol: 4, title: 'VOL 4', bg: '#450A20', spine: '#240410' },
  { vol: 5, title: 'VOL 5', bg: '#520E28', spine: '#2C0615' },
  { vol: 6, title: 'VOL 6', bg: '#42082E', spine: '#240319' },
  { vol: 7, title: 'VOL 7', bg: '#4A082C', spine: '#270317' },
  { vol: 8, title: 'VOL 8', bg: '#3F0828', spine: '#210314' },
  { vol: 9, title: 'VOL 9', bg: '#4B0A26', spine: '#260412' },
  { vol: 10, title: 'VOL 10 KEY', bg: '#48061C', spine: '#24020D' },
];

function createCamSvg(c: typeof CAM_SERIES[0]) {
  return `
  <svg width="360" height="400" viewBox="0 0 360 400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad-${c.vol}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c.bg}" />
        <stop offset="60%" stop-color="${c.spine}" />
        <stop offset="100%" stop-color="#020810" />
      </linearGradient>
      
      <linearGradient id="numGrad-${c.vol}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c.numGrad1}" />
        <stop offset="100%" stop-color="${c.numGrad2}" />
      </linearGradient>

      <linearGradient id="spineHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="rgba(0,0,0,0.5)" />
        <stop offset="70%" stop-color="rgba(0,0,0,0.15)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0.18)" />
      </linearGradient>

      <linearGradient id="sheen" x1="0%" y1="0%" x2="100%" y2="70%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.08)" />
        <stop offset="40%" stop-color="rgba(255,255,255,0.02)" />
        <stop offset="100%" stop-color="rgba(0,0,0,0.2)" />
      </linearGradient>

      <filter id="shadow-${c.vol}" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#000" flood-opacity="0.6" />
      </filter>
    </defs>

    <!-- Main Book Cover Surface with Rounded Corners -->
    <rect width="360" height="400" rx="14" fill="url(#bgGrad-${c.vol})" />
    <rect width="360" height="400" rx="14" fill="url(#sheen)" />

    <!-- Left Spine Effect -->
    <rect x="0" y="0" width="22" height="400" rx="14" fill="url(#spineHighlight)" />
    <line x1="22" y1="0" x2="22" y2="400" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
    <line x1="23" y1="0" x2="23" y2="400" stroke="rgba(0,0,0,0.4)" stroke-width="1" />

    <!-- Top Right Corner Badge Accent -->
    <path d="M 315 0 L 360 0 L 360 45 Z" fill="${c.numGrad1}" fill-opacity="0.35" />

    <!-- Cambridge University Crest & Wordmark -->
    <g transform="translate(180, 48)" text-anchor="middle">
      <!-- Shield Icon -->
      <path d="M -16 -18 L 0 -28 L 16 -18 L 11 6 C 8 16 0 22 0 22 C 0 22 -8 16 -11 6 Z" 
            fill="none" stroke="${c.accent}" stroke-width="2.2" />
      <path d="M -9 -8 L 9 -8 M 0 -17 L 0 5" stroke="${c.accent}" stroke-width="1.6" stroke-linecap="round" />
      <circle cx="0" cy="-6" r="3" fill="${c.numGrad1}" />

      <!-- Cambridge Text -->
      <text y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
            font-size="13" font-weight="900" letter-spacing="4" fill="#F8FAFC">CAMBRIDGE</text>
      <text y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
            font-size="7.5" font-weight="700" letter-spacing="2" fill="#94A3B8">UNIVERSITY PRESS</text>
    </g>

    <!-- Main IELTS Title -->
    <text x="180" y="152" text-anchor="middle" 
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
          font-size="52" font-weight="900" letter-spacing="2" fill="#FFFFFF">IELTS</text>

    <!-- ACADEMIC Subtitle in Accent -->
    <text x="180" y="184" text-anchor="middle" 
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
          font-size="17" font-weight="800" letter-spacing="5" fill="${c.accent}">ACADEMIC</text>

    <!-- Elegant Hairline Divider -->
    <line x1="60" y1="202" x2="300" y2="202" stroke="rgba(255,255,255,0.2)" stroke-width="1.2" />

    <!-- WITH ANSWERS -->
    <text x="180" y="226" text-anchor="middle" 
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
          font-size="12" font-weight="800" letter-spacing="3" fill="#E2E8F0">WITH ANSWERS</text>

    <!-- Grand Volume Number (Balanced in the lower-right) -->
    <text x="270" y="348" text-anchor="middle" 
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
          font-size="118" font-weight="900" fill="url(#numGrad-${c.vol})" filter="url(#shadow-${c.vol})">${c.vol}</text>

    <!-- Bottom Left Authentic Practice Badge -->
    <g transform="translate(38, 332)">
      <rect width="112" height="20" rx="4" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="0.8" />
      <text x="56" y="13.5" text-anchor="middle" 
            font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
            font-size="8" font-weight="800" letter-spacing="1" fill="#E2E8F0">AUTHENTIC PRACTICE</text>
      <text x="0" y="38" 
            font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
            font-size="8" font-weight="700" letter-spacing="0.5" fill="#94A3B8">EXAMINATION PAPERS</text>
    </g>

    <!-- Subtle Inner Border for High-End Polish -->
    <rect x="1" y="1" width="358" height="398" rx="13" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
  </svg>
  `;
}

function createVolSvg(v: typeof VOL_SERIES[0]) {
  return `
  <svg width="360" height="400" viewBox="0 0 360 400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="volGrad-${v.vol}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${v.bg}" />
        <stop offset="70%" stop-color="${v.spine}" />
        <stop offset="100%" stop-color="#140108" />
      </linearGradient>

      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FDE68A" />
        <stop offset="50%" stop-color="#F59E0B" />
        <stop offset="100%" stop-color="#D97706" />
      </linearGradient>

      <linearGradient id="spineHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="rgba(0,0,0,0.5)" />
        <stop offset="70%" stop-color="rgba(0,0,0,0.15)" />
        <stop offset="100%" stop-color="rgba(253,230,138,0.2)" />
      </linearGradient>

      <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#F59E0B" flood-opacity="0.4" />
      </filter>
    </defs>

    <!-- Main Book Cover Surface -->
    <rect width="360" height="400" rx="14" fill="url(#volGrad-${v.vol})" />

    <!-- Left Spine Effect -->
    <rect x="0" y="0" width="22" height="400" rx="14" fill="url(#spineHighlight)" />
    <line x1="22" y1="0" x2="22" y2="400" stroke="rgba(253,230,138,0.25)" stroke-width="1.5" />

    <!-- Top Crown & Header -->
    <g transform="translate(180, 52)" text-anchor="middle">
      <text font-size="24" filter="url(#goldGlow)">👑</text>
      <text y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
            font-size="12" font-weight="900" letter-spacing="3.5" fill="#FDE68A">ACTUAL TESTS</text>
      <text y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
            font-size="7.5" font-weight="700" letter-spacing="1.5" fill="#FDA4AF">AUTHENTIC EXAM COLLECTION</text>
    </g>

    <!-- Main IELTS Wordmark -->
    <text x="180" y="152" text-anchor="middle" 
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
          font-size="48" font-weight="900" letter-spacing="2" fill="#FFFFFF">IELTS</text>

    <!-- Subtitle PRACTICE TESTS -->
    <text x="180" y="182" text-anchor="middle" 
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
          font-size="14" font-weight="800" letter-spacing="4" fill="#FDA4AF">PRACTICE TESTS</text>

    <!-- Center Gold Plaque for Volume Title -->
    <g transform="translate(180, 252)">
      <rect x="-140" y="-45" width="280" height="90" rx="12" 
            fill="rgba(0,0,0,0.4)" stroke="url(#goldGrad)" stroke-width="2" filter="url(#goldGlow)" />
      
      <text y="4" text-anchor="middle" 
            font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
            font-size="${v.vol === 10 ? '28' : '38'}" font-weight="900" letter-spacing="2" fill="url(#goldGrad)">
        ${v.title}
      </text>
      <text y="28" text-anchor="middle" 
            font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
            font-size="10" font-weight="800" letter-spacing="2" fill="#FEE2E2">
        REAL EXAM SIMULATION
      </text>
    </g>

    <!-- Bottom Footer Tag -->
    <text x="180" y="362" text-anchor="middle" 
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
          font-size="9" font-weight="800" letter-spacing="2" fill="#FDE68A">
      COMPUTER-DELIVERED FORMAT
    </text>

    <!-- Inner Polish Border -->
    <rect x="1" y="1" width="358" height="398" rx="13" fill="none" stroke="rgba(253,230,138,0.2)" stroke-width="1.5" />
  </svg>
  `;
}

async function run() {
  console.log('Generating high-resolution book covers (Cambridge 7-20 & Actual Vols 1-10)...');

  for (const c of CAM_SERIES) {
    const svg = createCamSvg(c);
    const buf = Buffer.from(svg);
    const pubDest = path.join(PUBLIC_OUT, `cam-${c.vol}.png`);
    const assDest = path.join(ASSETS_OUT, `cam-${c.vol}.png`);
    await sharp(buf).png({ quality: 100 }).toFile(pubDest);
    await sharp(buf).png({ quality: 100 }).toFile(assDest);
    console.log(`Generated Cambridge ${c.vol}: ${pubDest}`);
  }

  for (const v of VOL_SERIES) {
    const svg = createVolSvg(v);
    const buf = Buffer.from(svg);
    const pubDest = path.join(PUBLIC_OUT, `vol-${v.vol}.png`);
    const assDest = path.join(ASSETS_OUT, `vol-${v.vol}.png`);
    await sharp(buf).png({ quality: 100 }).toFile(pubDest);
    await sharp(buf).png({ quality: 100 }).toFile(assDest);
    console.log(`Generated Volume ${v.vol}: ${pubDest}`);
  }

  console.log('Successfully generated all enhanced book covers!');
}

run().catch(console.error);
