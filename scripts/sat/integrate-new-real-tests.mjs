import fs from 'node:fs';
import path from 'node:path';

// 1. Update src/data/sat-rw-repository.ts
let rwCode = fs.readFileSync('src/data/sat-rw-repository.ts', 'utf8');
const crlf = rwCode.includes('\r\n') ? '\r\n' : '\n';

if (!rwCode.includes('real-tests-2024-2025.json')) {
  rwCode = rwCode.replace(
    `import realTestsCraft from './seed/sat-rw/real-tests-craft.json';`,
    `import realTestsCraft from './seed/sat-rw/real-tests-craft.json';${crlf}import realTests20242025 from './seed/sat-rw/real-tests-2024-2025.json';`
  );

  rwCode = rwCode.replace(
    `export const SAT_RW_REAL_TEST_CRAFT_QUESTIONS: SatRwQuestion[] = realTestsCraft as SatRwQuestion[];`,
    `export const SAT_RW_REAL_TEST_CRAFT_QUESTIONS: SatRwQuestion[] = realTestsCraft as SatRwQuestion[];${crlf}export const SAT_RW_REAL_TEST_2024_2025_QUESTIONS: SatRwQuestion[] = realTests20242025 as SatRwQuestion[];`
  );

  rwCode = rwCode.replace(
    `  ...SAT_RW_ORIGINAL_READING_EXPANSION,`,
    `  ...SAT_RW_ORIGINAL_READING_EXPANSION,${crlf}  ...SAT_RW_REAL_TEST_2024_2025_QUESTIONS,`
  );

  rwCode = rwCode.replace(
    `  ...SAT_READING_BOOK_QUESTIONS,`,
    `  ...SAT_READING_BOOK_QUESTIONS,${crlf}  ...SAT_RW_REAL_TEST_2024_2025_QUESTIONS,`
  );

  fs.writeFileSync('src/data/sat-rw-repository.ts', rwCode, 'utf8');
  console.log('Updated src/data/sat-rw-repository.ts');
}

// 2. Update src/data/sat-math-real-tests.ts
let mathCode = fs.readFileSync('src/data/sat-math-real-tests.ts', 'utf8');
const mCrlf = mathCode.includes('\r\n') ? '\r\n' : '\n';

if (!mathCode.includes('real-tests-2024-2025.json')) {
  mathCode = mathCode.replace(
    `import geomQuestions from './seed/sat-math/real-tests-geom.json';`,
    `import geomQuestions from './seed/sat-math/real-tests-geom.json';${mCrlf}import recent20242025Math from './seed/sat-math/real-tests-2024-2025.json';`
  );

  mathCode = mathCode.replace(
    `export const SAT_MATH_REAL_TEST_QUESTIONS: SatMathQuestion[] = geomQuestions as SatMathQuestion[];`,
    `export const SAT_MATH_REAL_TEST_QUESTIONS: SatMathQuestion[] = [...geomQuestions, ...recent20242025Math] as SatMathQuestion[];`
  );

  fs.writeFileSync('src/data/sat-math-real-tests.ts', mathCode, 'utf8');
  console.log('Updated src/data/sat-math-real-tests.ts');
}
