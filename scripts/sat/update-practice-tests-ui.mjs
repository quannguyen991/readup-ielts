import fs from 'node:fs';

let content = fs.readFileSync('app/sat/practice-tests.tsx', 'utf8');

content = content.replace(
  `: 'Tất cả 50 đề';`,
  `: 'Tất cả 85 đề';`
);

content = content.replace(
  `badge="DIGITAL SAT · KHO 65 BỘ ĐỀ"`,
  `badge="DIGITAL SAT · KHO 85 BỘ ĐỀ"`
);

content = content.replace(
  `<HeroStat value="65" label={L('bộ luyện', 'practice sets')} />`,
  `<HeroStat value="85" label={L('bộ luyện', 'practice sets')} />`
);

content = content.replace(
  `<HeroStat value="6" label={L('đề Bluebook chính thức', 'official Bluebook tests')} />`,
  `<HeroStat value="8" label={L('đề Bluebook chính thức', 'official Bluebook tests')} />\n              <HeroStat value="30" label={L('đề thi thật 2024–2025', '2024–2025 real tests')} />`
);

content = content.replace(
  `            { id: 'real2025', label: 'Thi Thật 2025' },\n            { id: 'bluebook', label: 'Official Bluebook' },`,
  `            { id: 'real2025', label: 'Thi Thật 2025 (15)' },\n            { id: 'real2024', label: 'Thi Thật 2024 (15)' },\n            { id: 'bluebook', label: 'Official Bluebook (8)' },`
);

content = content.replace(
  `            { id: 'real2025', label: 'Thi Thật 2025' },\r\n            { id: 'bluebook', label: 'Official Bluebook' },`,
  `            { id: 'real2025', label: 'Thi Thật 2025 (15)' },\r\n            { id: 'real2024', label: 'Thi Thật 2024 (15)' },\r\n            { id: 'bluebook', label: 'Official Bluebook (8)' },`
);

// Add handling for real2024 in onPress
content = content.replace(
  `                  } else if (sec.id === 'real2025') {\n                    setCollectionFilter('real_test_2025');`,
  `                  } else if (sec.id === 'real2025') {\n                    setCollectionFilter('real_test_2025');\n                  } else if (sec.id === 'real2024') {\n                    setCollectionFilter('real_test_2024');`
);

content = content.replace(
  `                  } else if (sec.id === 'real2025') {\r\n                    setCollectionFilter('real_test_2025');`,
  `                  } else if (sec.id === 'real2025') {\r\n                    setCollectionFilter('real_test_2025');\r\n                  } else if (sec.id === 'real2024') {\r\n                    setCollectionFilter('real_test_2024');`
);

fs.writeFileSync('app/sat/practice-tests.tsx', content, 'utf8');
console.log('Successfully updated app/sat/practice-tests.tsx!');
