const fs = require('fs');

const content = fs.readFileSync('scripts/onthiielts_full.html', 'utf8');

const regex = /href=["']([^"']+)["']/g;
let match;
const links = new Set();
while ((match = regex.exec(content)) !== null) {
  const url = match[1];
  if (
    url.includes('drive.google.com') ||
    url.includes('sharepoint.com') ||
    url.includes('onedrive') ||
    url.includes('1drv.ms') ||
    url.includes('bit.ly') ||
    url.includes('mediafire') ||
    url.includes('mega.nz') ||
    url.includes('tiw.vn') ||
    url.includes('gdbaoan') ||
    url.includes('cambridge') ||
    url.includes('.mp3') ||
    url.includes('audio')
  ) {
    links.add(url);
  }
}

console.log('--- FOUND LINKS (' + links.size + ') ---');
for (const link of links) {
  console.log(link);
}
