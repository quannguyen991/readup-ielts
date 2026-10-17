const https = require('https');
const fs = require('fs');

const camUrls = [
  'https://onthiielts.com.vn/cambridge-ielts-7/',
  'https://onthiielts.com.vn/cambridge-ielts-8/',
  'https://onthiielts.com.vn/cambridge-ielts-9/',
  'https://onthiielts.com.vn/cambridge-ielts-10/',
  'https://onthiielts.com.vn/cambridge-ielts-11/',
  'https://onthiielts.com.vn/cambridge-ielts-12/',
  'https://onthiielts.com.vn/cambridge-ielts-13/',
  'https://onthiielts.com.vn/cambridge-ielts-14/',
  'https://onthiielts.com.vn/cambridge-ielts-15/',
  'https://onthiielts.com.vn/cambridge-practice-tests-for-ielts-16-with-answers/',
  'https://onthiielts.com.vn/cambridge-ielts-17/',
  'https://onthiielts.com.vn/ielts-cambridge-18/',
  'https://onthiielts.com.vn/ielts-cambridge-19/',
  'https://onthiielts.com.vn/cambridge-ielts-20/',
  'https://onthiielts.com.vn/cambridge-ielts-21/'
];

function getHtml(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ url, data }));
    }).on('error', () => resolve({ url, data: '' }));
  });
}

async function run() {
  const results = {};
  for (const pageUrl of camUrls) {
    const { url, data } = await getHtml(pageUrl);
    // Extract hrefs
    const regex = /href=["']([^"']+)["']/g;
    let m;
    const links = [];
    while ((m = regex.exec(data)) !== null) {
      const link = m[1];
      if (
        link.includes('sharepoint.com') ||
        link.includes('drive.google.com') ||
        link.includes('onedrive') ||
        link.includes('1drv.ms') ||
        link.includes('mediafire') ||
        link.includes('mega.nz') ||
        link.includes('dropbox') ||
        link.includes('audio') ||
        link.includes('.mp3')
      ) {
        links.push(link);
      }
    }
    const cleanLinks = Array.from(new Set(links));
    const camName = url.split('/').filter(Boolean).pop();
    results[camName] = cleanLinks;
    console.log(`[${camName}] Found ${cleanLinks.length} links:`, cleanLinks);
  }

  fs.writeFileSync('scripts/cam_audio_links.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('Saved results to scripts/cam_audio_links.json');
}

run();
