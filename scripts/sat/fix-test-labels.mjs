import fs from 'node:fs';

// 1. Update SAT_RW_SKILL_LABEL in sat-rw-repository.ts
let repo = fs.readFileSync('src/data/sat-rw-repository.ts', 'utf8');
if (!repo.includes("synthesis: 'Tổng hợp diễn đạt'")) {
  repo = repo.replace(
    "crosstext: 'Cross-Text Connections',",
    "crosstext: 'Cross-Text Connections',\n  synthesis: 'Tổng hợp diễn đạt',"
  );
  fs.writeFileSync('src/data/sat-rw-repository.ts', repo, 'utf8');
}

// 2. Update sat-rw-repository.test.ts count
let testCode = fs.readFileSync('src/data/sat-rw-repository.test.ts', 'utf8');
testCode = testCode.replace(
  'assert.equal(SAT_RW_QUESTIONS.length, 890);',
  'assert.equal(SAT_RW_QUESTIONS.length, 940);'
);
testCode = testCode.replace(
  "assert.equal(new Set(SAT_RW_QUESTIONS.map((q) => q.id)).size, 890, 'có id bị trùng');",
  "assert.equal(new Set(SAT_RW_QUESTIONS.map((q) => q.id)).size, 940, 'có id bị trùng');"
);
fs.writeFileSync('src/data/sat-rw-repository.test.ts', testCode, 'utf8');

console.log('Updated synthesis label and test count to 940!');
