const https = require('https');
const fs = require('fs');

async function getLinks(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const regex = /href=["']([^"']+)["']/g;
        let m;
        const links = [];
        while ((m = regex.exec(data)) !== null) {
          const l = m[1];
          if (l.includes('sharepoint.com') || l.includes('drive.google.com') || l.includes('onedrive') || l.includes('1drv.ms') || l.includes('mediafire')) {
            links.push(l);
          }
        }
        resolve(Array.from(new Set(links)));
      });
    });
  });
}

async function run() {
  const l19 = await getLinks('https://onthiielts.com.vn/cambridge-19/');
  const l20 = await getLinks('https://onthiielts.com.vn/sach-cambridge-ielts-20-pdf/');
  console.log('Cam 19 links:', l19);
  console.log('Cam 20 links:', l20);

  const prev = JSON.parse(fs.readFileSync('scripts/cam_audio_links.json', 'utf8'));
  prev['cambridge-ielts-19'] = l19;
  prev['cambridge-ielts-20'] = l20;
  fs.writeFileSync('scripts/cam_audio_links.json', JSON.stringify(prev, null, 2), 'utf8');
  console.log('Updated scripts/cam_audio_links.json');
}

run();
