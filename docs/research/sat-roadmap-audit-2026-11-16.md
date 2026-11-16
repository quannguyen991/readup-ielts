# Digital SAT Verbal + Math roadmap audit

Checked 16 November 2026 against the current College Board blueprint, current Khan Academy Digital SAT courses, the SAT materials supplied in this workspace, and the existing Band 9 curriculum. This is a curriculum crosswalk; the PDFs remain the user's study copies and are not copied into the app.

## Recommendation

Use **College Board as the test-format and content authority**, **Khan Academy as the skills-and-difficulty spine**, and the supplied books as focused supplements. Keep the existing 16 Reading & Writing units and 27 College Panda-based Math chapters, but label them accurately and route learners by official domain and diagnostic needs. The 27-chapter Math route contains 25 core topics plus two enrichment topics.

The Khan Academy course structure should remain the main progression: Reading & Writing has 12 units / 47 practice targets; Math has 13 units / 111 levelled skills. Band 9's R&W course maps the 47 targets into 16 teachable units. Band 9's `/math` course mirrors the 4 domains × Foundation / Medium / Advanced layout, but currently groups the 111 Khan targets into 19 broad Band 9 skills. This is a useful course scaffold, not full one-to-one coverage of every Khan lesson yet.

Khan's older **Official SAT Prep** experience has been deprecated. The live prep courses are now separate Digital SAT Math and Reading & Writing courses, while full-length practice tests are taken in Bluebook. Existing app text and study plans should use those current names and workflows.

## Current test frame

| Section | Format | Domain emphasis |
| --- | --- | --- |
| Reading & Writing | 54 questions, 64 minutes, 2 adaptive modules | Information and Ideas ~26%; Craft and Structure ~28%; Expression of Ideas ~20%; Standard English Conventions ~26% |
| Math | 44 questions, 70 minutes, 2 adaptive modules | Algebra ~35% (13–15); Advanced Math ~35% (13–15); Problem-Solving and Data Analysis ~15% (5–7); Geometry and Trigonometry ~15% (5–7) |

Every domain can appear in either module. A learner should not finish a domain and then stop seeing it: keep short mixed retrieval practice active throughout the course. The second module adapts to first-module performance, so practice should build accuracy before timed mixed sets rather than train a fixed “easy module / hard module” guessing routine.

## Recommended study path

This is a default sequence, not a promise that every learner needs exactly 16 or 20 weeks. Start with the diagnostic, then spend more sessions on the weakest domains. A practical weekly rhythm is three Verbal blocks and three Math blocks, each with a short lesson/review, focused practice, and an error-log correction; add one timed mixed block when foundational accuracy is stable.

| Stage | Reading & Writing | Math | Checkpoint |
| --- | --- | --- | --- |
| 0. Diagnose | Take a current Bluebook full-length test; classify missed/guessed items by the four official domains and question skill. | Same test; classify by the four official domains and skill. | Record score, accuracy, confidence, and timing. Do not infer mastery from a single score. |
| 1. Rebuild foundations | Work through Band 9 Units 1–8: sentence boundaries, form/structure/sense, agreement, modifiers, pronouns, verb forms, plurals/possessives. Add short Words in Context and transition retrieval. | Use Khan Foundation in each domain. Start with Algebra and PSDA prerequisites, then Advanced Math and Geometry/Trig; use the College Panda chapters as a topic-level companion. | Move a skill up when the Khan/Band 9 checkpoint is consistently accurate; keep missed skills in the weekly review set. |
| 2. Complete core skills | Units 9–10: transitions and rhetorical synthesis; 11–13: words in context, text structure/purpose, cross-text; 14–16: central ideas, evidence, and inference. Cycle all four domains. | Complete the 25 core topics in the crosswalk below, using Khan Medium and targeted lessons for gaps. Keep the two enrichment topics optional. | Use untimed sets first; explain why each distractor is wrong and tag the error cause. |
| 3. Raise difficulty | Use Khan Medium/Advanced and original Band 9 sets; mix domains because each test module mixes domains. | Use Khan Medium/Advanced, then mixed sets weighted approximately by official domain share. | Add timed mini-modules only after accuracy is steady; review the error log before another set. |
| 4. Simulate | Take Bluebook full tests, review by skill, and retest the weakest domains. | Same. Practice calculator/Desmos decisions and question skipping/returning. | Use official Bluebook tests for full-length simulation; use the Student Question Bank for targeted official items. |

Use the current College Board skill breakdown for placement and retargeting after each full-length test. Band 9's existing 80% chapter pass and 75% `/math` unit-test threshold are app progress rules, not College Board score guarantees.

### Timing habits

- R&W averages about 71 seconds per question; Math averages about 95 seconds. These are section averages, not hard per-question limits.
- Practice a first pass that secures questions the learner can solve confidently, then return to flagged items within the module.
- Track both time and accuracy. Faster guessing is not progress if error rates rise.
- Use Bluebook for realistic module timing and adaptive test conditions; Khan lessons are for skill learning and targeted practice.

## Reading & Writing crosswalk

The existing 16 units are a sensible teaching breakdown, but they are **16 skill units, not a verified 16-week course**. Keep the 47-target Khan map (`src/services/sat-rw/official-course.ts`) as the fine-grained checklist.

| Band 9 units | Official domain | Khan skill families / supplied-book support |
| --- | --- | --- |
| 1–8 | Standard English Conventions | Boundaries; form, structure, and sense; agreement; pronouns; verb forms; modifiers; plurals/possessives. Use Erica Meltzer's grammar/reading explanations as a concept reference where the licensed edition covers the rule; retain short digital-SAT item practice. |
| 9–10 | Expression of Ideas | Transitions and rhetorical synthesis. Princeton Review's vocabulary/word-analysis techniques may support language awareness, but do not substitute for goal-based synthesis practice. |
| 11–13 | Craft and Structure | Words in context, text structure/purpose, cross-text connections. Erica's *The Critical Reader* supplies useful reading concepts; its 2015 edition predates the Digital SAT and its long-passage format must not be copied as the current task format. |
| 14–16 | Information and Ideas | Central ideas/details, textual and quantitative evidence, inference. The same Erica book is a strategy reference; practice with current short-passage/one-question Digital SAT tasks. |

Vocabulary books should feed a spaced, contextual review list, not a memorization-only “SAT word list.” Words in Context is tested through meaning in a specific short passage. Prioritize repeated, useful academic words, collocations, roots, and the ability to infer meaning from contrast/restatement/cause-and-effect cues.

## Math crosswalk

The `/math` Khan-shaped course should be the primary progress route. The older 27-topic route remains useful as a detailed companion, but its phase order follows the supplied College Panda book, not the College Board weighting. The app now marks each chapter by official domain and calls out the two optional extensions.

| Official domain | Share | College Panda-based chapters in the app |
| --- | ---: | --- |
| Algebra | ~35% | Solving equations; equation strategies; systems; inequalities; word problems; lines; linear models |
| Advanced Math | ~35% | Exponents/radicals; expressions; functions; quadratics; absolute value |
| Problem-Solving and Data Analysis | ~15% | Percent; exponential vs. linear; proportion; rates; reading data; probability; statistics I–II |
| Geometry and Trigonometry | ~15% | Angles; triangles; circles; trigonometry; volume |
| Optional enrichment | Not part of the 25-topic core | Synthetic division and complex numbers. These are in the supplied prep-book sequence but are not named as tested skills in the current College Board content-domain outline. Keep accessible for enrichment; do not make them prerequisites for the SAT core path. |

The current `/math` skill layer has 19 broad skill IDs, while Khan lists 37 distinct lesson families repeated at Foundation / Medium / Advanced (111 levelled targets). Focused coverage to add next is:

- **Algebra:** separately tag linear-equation word problems, graphing linear inequalities/systems, and interpretation of linear relationships.
- **Problem-Solving and Data Analysis:** split unit conversion, distributions, scatterplots, linear/exponential growth, data inferences, and statistical claims into distinct checkpoints.
- **Advanced Math:** add direct skill links for radicals/rational exponents, polynomial operations/factoring, rational expressions, isolating quantities, quadratic/exponential models, and nonlinear graph families.
- **Geometry and Trigonometry:** separate similarity/congruence, circle theorems, unit-circle trigonometry, and equations of circles instead of burying them in broad lessons.

These are real coverage gaps in Band 9's current mapping, even though the underlying course route already has the correct four domains and three difficulty levels.

## Supplied books and what to use them for

| Source | Fit for today's Digital SAT | How it should supplement the course |
| --- | --- | --- |
| College Board content domains, Student Question Bank, and Bluebook | Current authority | Blueprint, official skill labels, official targeted questions, and full-length adaptive practice. |
| Khan Academy Digital SAT Reading & Writing | Current skills course | 12-unit/47-target checklist, tiered explanations, and targeted practice. |
| Khan Academy Digital SAT Math | Current skills course | 13-unit/111-target checklist; Foundation → Medium → Advanced within each domain. |
| Erica Meltzer, *The Critical Reader*, 2nd ed. (2015) | Older pre-Digital-SAT format | High-level reading skills: evidence, inference, vocabulary in context, purpose, tone, and structure. Adapt to 25–150-word passages and one question per passage; do not treat its old long-passage layout as today's format. |
| Nielson Phu, *The College Panda SAT Math Advanced Guide and Workbook* (2015) | Older “New SAT” topic sequence | Explanations and topic practice for algebra, ratios, functions, quadratics, geometry, and data; preserve the useful 27-topic index while separating the two enrichment chapters. |
| Erica's *Vocabulary: A New Approach* | Supplemental vocabulary | Semantic groups and contextual examples as review material; prioritize words that recur in current official/contextual practice. |
| *SAT Power Vocab*, The Princeton Review (2017) | Supplemental vocabulary strategies | Roots, mnemonics, and math terminology; treat its lists and format as older supplementary practice, not an official frequency list. |
| *1100 Words You Need to Know*, 6th ed. | General vocabulary, not a DSAT syllabus | Select high-utility academic words and use spaced recall/context sentences; do not require all 1,100 words for SAT readiness. |
| Vocabook by @satashkent; 500 C1–C2 Words from WIC questions | Supplemental vocabulary collections | Use selected terms and original example sentences for retrieval practice. Verify any “frequency” claim against current official question evidence. |

The user's statement that they have permission is treated as authorization to consult these supplied books. Band 9 should still write its own explanations, passages, question wording, answer choices, and rationales; it should not present generated practice as verbatim licensed-book questions or as College Board official items.

## Source and provenance fixes

- Replace claims that the app has digitized 27 classic books: the current `SAT_BOOK_CATALOG` has 13 generic rows, and the available SAT sources are a smaller, identified set. The app now names only sources actually used in this roadmap.
- Label a question as College Board official only when it is verified as coming from an official College Board source. The combined R&W repository also includes original/generated and third-party material.
- Do not call the current 16 R&W units “16 weeks” unless a week-by-week workload is actually attached to them.
- Keep official domain labels/weights visible and tell learners the 27 Math chapters follow a book sequence. Use `/math` for the Khan-shaped core progression.

## References

- [College Board: content domains](https://satsuite.collegeboard.org/practice/content-domains)
- [College Board: Reading and Writing section](https://satsuite.collegeboard.org/sat/whats-on-the-test/reading-writing)
- [College Board: SAT structure](https://satsuite.collegeboard.org/sat/whats-on-the-test/structure)
- [College Board: SAT Math overview](https://satsuite.collegeboard.org/sat/whats-on-the-test/math/overview)
- [College Board: Student Question Bank — Reading and Writing](https://satsuite.collegeboard.org/practice/student-question-bank/reading-writing)
- [College Board: Student Question Bank — Math](https://satsuite.collegeboard.org/practice/student-question-bank/math)
- [Khan Academy: current Digital SAT guidance](https://support.khanacademy.org/hc/en-us/articles/23298985511821-Helping-your-students-prepare-for-the-Digital-SAT-on-Khan-Academy)
- [Khan Academy: Digital SAT Reading and Writing](https://www.khanacademy.org/sat-reading-and-writing)
- [Khan Academy: Digital SAT Math](https://www.khanacademy.org/test-prep/v2-sat-math?lang=en)
