const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('.local-private/ielts-ocr/source-tests.json', 'utf8'));

// Audio OneDrive / SharePoint links map for each Cambridge volume
const camAudioLinks = {
  7: 'https://gdbaoan-my.sharepoint.com/:u:/g/personal/ieltsbooks_tiw_vn/IQCVJiyO2LCBVLhV1B6DIrUQARVs33sG7xaydtUmNcsh6aM?e=U8mVUC',
  8: 'https://gdbaoan-my.sharepoint.com/:u:/g/personal/ieltsbooks_tiw_vn/IQCVJiyO2LCBVLhV1B6DIrUQARVs33sG7xaydtUmNcsh6aM?e=U8mVUC',
  9: 'https://gdbaoan-my.sharepoint.com/:u:/g/personal/ieltsbooks_tiw_vn/IQCVJiyO2LCBVLhV1B6DIrUQARVs33sG7xaydtUmNcsh6aM?e=U8mVUC',
  10: 'https://gdbaoan-my.sharepoint.com/:u:/g/personal/ieltsbooks_tiw_vn/IQBJGucGHO8rXWKH2Cm5d2RTAXKDJ4r1qyiJCs_75VPRcB8?e=Ewq95R',
  11: 'https://gdbaoan-my.sharepoint.com/:u:/g/personal/ieltsbooks_tiw_vn/IQCAp7l5AhNUXCFgQ9pVmnwfAbsjb1ufKKDII-iXxzmgzck?e=2RTbqh',
  12: 'https://gdbaoan-my.sharepoint.com/:u:/g/personal/ieltsbooks_tiw_vn/IQDO2uOF--ndWMuyLt0xEaMsAXENHceJcRFtfDSBURV02fE?e=79MJvK',
  13: 'https://gdbaoan-my.sharepoint.com/:u:/g/personal/ieltsbooks_tiw_vn/IQDQRdxTTIE_UCV-ndj78lgRAXVi_QDBTVKyWcNHb3tbKLc?e=0ny20F',
  14: 'https://gdbaoan-my.sharepoint.com/:u:/g/personal/ieltsbooks_tiw_vn/IQDG6FUNJnCUVy0zNHkvFnYEAaIKaqfsLGc7XuS6PPyMKds?e=ttwOw2',
  15: 'https://gdbaoan-my.sharepoint.com/:f:/g/personal/ieltsbooks_tiw_vn/IgBZE8EKHYDXQbHxnTFS4yttAfrgqBDgzNM9K_QFzOTSxxU?e=Sc42jS',
  16: 'https://gdbaoan-my.sharepoint.com/:f:/g/personal/ieltsbooks_tiw_vn/IgC5Gy57WWjdSLDnCLWkUtvoAej8xqEOcEUdYvWyLMfFuo8?e=esaUIq',
  17: 'https://drive.google.com/drive/folders/1iAHgSfDYGWn-0QBjmj8bKoIoG4Ri8JH9',
  18: 'https://gdbaoan-my.sharepoint.com/:u:/g/personal/ieltsbooks_tiw_vn/EaugpUeiGk9Mj-DLvPR9X1QBymkwOihq36P8U6wv7pqakw?e=N9aArQ',
  19: 'https://gdbaoan-my.sharepoint.com/:f:/g/personal/ieltsbooks_tiw_vn/EscWdgiiuqNLs4XGqqwOi2oBhdOmNHaz1L7-BeBz69b8JA',
  20: 'https://gdbaoan-my.sharepoint.com/:f:/g/personal/ieltsbooks_tiw_vn/EsTPBKk99ZVOgerBPnbc9XIBlgzVz_Uye8tkFJivxtmXJw?e=tvWFXQ',
  21: 'https://gdbaoan-my.sharepoint.com/:f:/g/personal/ieltsbooks_tiw_vn/IgDaPTFxO1MUSI_wdoQAsZUXASW4GD0AYGZIbVNmezOF6xM?e=IbHaQw'
};

let linkedCount = 0;

raw.tests.forEach(t => {
  // If test is Cambridge (Listening or Reading)
  const m = t.id.match(/cambridge-?(\d+)/i) || (t.source && t.source.match(/cambridge.*?(\d+)/i));
  if (m) {
    const vol = parseInt(m[1], 10);
    if (camAudioLinks[vol]) {
      t.audioCloudUrl = camAudioLinks[vol];
      linkedCount++;
    }
  }
});

fs.writeFileSync('.local-private/ielts-ocr/source-tests.json', JSON.stringify(raw, null, 2), 'utf8');
console.log(`Successfully linked ${linkedCount} Cambridge tests to online OneDrive/SharePoint audio!`);
