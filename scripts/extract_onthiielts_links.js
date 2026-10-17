const fs = require('fs');

const content = fs.readFileSync('C:/Users/admin/.gemini/antigravity-ide/brain/c3c7ef92-2055-47ce-9e80-e156c2652ae9/.system_generated/steps/1836/content.md', 'utf8');

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
    url.includes('audio') ||
    url.includes('cambridge') ||
    url.includes('tiw.vn')
  ) {
    links.add(url);
  }
}

console.log('--- FOUND LINKS (' + links.size + ') ---');
for (const link of links) {
  console.log(link);
}
