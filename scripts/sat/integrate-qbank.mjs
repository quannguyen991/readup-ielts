import fs from 'node:fs';

// 1. Update sat-rw-repository.ts
let rwCode = fs.readFileSync('src/data/sat-rw-repository.ts', 'utf8');

if (!rwCode.includes('official-qbank-rw.json')) {
  rwCode = rwCode.replace(
    `import realTests20242025 from './seed/sat-rw/real-tests-2024-2025.json';`,
    `import realTests20242025 from './seed/sat-rw/real-tests-2024-2025.json';\r\nimport officialQbankRw from './seed/sat-rw/official-qbank-rw.json';`
  );

  rwCode = rwCode.replace(
    `export const SAT_RW_REAL_TEST_2024_2025_QUESTIONS: SatRwQuestion[] = realTests20242025 as SatRwQuestion[];`,
    `export const SAT_RW_REAL_TEST_2024_2025_QUESTIONS: SatRwQuestion[] = realTests20242025 as SatRwQuestion[];\r\nexport const SAT_RW_OFFICIAL_QBANK_QUESTIONS: SatRwQuestion[] = officialQbankRw as SatRwQuestion[];`
  );

  rwCode = rwCode.replace(
    `  ...SAT_RW_REAL_TEST_2024_2025_QUESTIONS,`,
    `  ...SAT_RW_REAL_TEST_2024_2025_QUESTIONS,\r\n  ...SAT_RW_OFFICIAL_QBANK_QUESTIONS,`
  );

  fs.writeFileSync('src/data/sat-rw-repository.ts', rwCode, 'utf8');
  console.log('Updated src/data/sat-rw-repository.ts with official Q-Bank RW!');
}

// 2. Update sat-math-real-tests.ts
let mathCode = fs.readFileSync('src/data/sat-math-real-tests.ts', 'utf8');

if (!mathCode.includes('official-qbank-math.json')) {
  mathCode = mathCode.replace(
    `import recent20242025Math from './seed/sat-math/real-tests-2024-2025.json';`,
    `import recent20242025Math from './seed/sat-math/real-tests-2024-2025.json';\r\nimport officialQbankMath from './seed/sat-math/official-qbank-math.json';`
  );

  mathCode = mathCode.replace(
    `export const SAT_MATH_REAL_TEST_QUESTIONS: SatMathQuestion[] = [...geomQuestions, ...recent20242025Math] as SatMathQuestion[];`,
    `export const SAT_MATH_REAL_TEST_QUESTIONS: SatMathQuestion[] = [...geomQuestions, ...recent20242025Math, ...officialQbankMath] as SatMathQuestion[];`
  );

  fs.writeFileSync('src/data/sat-math-real-tests.ts', mathCode, 'utf8');
  console.log('Updated src/data/sat-math-real-tests.ts with official Q-Bank Math!');
}

// 3. Update sat-rw-repository.test.ts count
let testCode = fs.readFileSync('src/data/sat-rw-repository.test.ts', 'utf8');
const qbankCount = JSON.parse(fs.readFileSync('src/data/seed/sat-rw/official-qbank-rw.json', 'utf8')).length;
const totalCount = 890 + qbankCount;

testCode = testCode.replace(
  'assert.equal(SAT_RW_QUESTIONS.length, 890);',
  `assert.equal(SAT_RW_QUESTIONS.length, ${totalCount});`
);
testCode = testCode.replace(
  "assert.equal(new Set(SAT_RW_QUESTIONS.map((q) => q.id)).size, 890, 'có id bị trùng');",
  `assert.equal(new Set(SAT_RW_QUESTIONS.map((q) => q.id)).size, ${totalCount}, 'có id bị trùng');`
);
fs.writeFileSync('src/data/sat-rw-repository.test.ts', testCode, 'utf8');
console.log(`Updated test count to ${totalCount} in sat-rw-repository.test.ts!`);
