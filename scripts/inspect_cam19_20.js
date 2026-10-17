const https = require('https');
const fs = require('fs');

async function inspect(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const matches = data.match(/href="([^"]+)"/g) || [];
        console.log(`=== ${url} (Total hrefs: ${matches.length}) ===`);
        matches.forEach(m => {
          const l = m.replace('href="', '').replace('"', '');
          if (!l.includes('wp-') && !l.includes('css') && !l.includes('javascript') && !l.includes('#') && !l.includes('facebook') && !l.includes('twitter')) {
            console.log(' -', l);
          }
        });
        resolve();
      });
    });
  });
}

async function main() {
  await inspect('https://onthiielts.com.vn/ielts-cambridge-19/');
  await inspect('https://onthiielts.com.vn/cambridge-ielts-20/');
}

main();
