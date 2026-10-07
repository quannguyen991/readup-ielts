# SAT Reading & Writing: Khan Academy alignment

Reviewed 4 October 2026 against Khan Academy's publicly accessible SAT Reading & Writing course and its course overview. This is a curriculum map, not a reproduction of Khan Academy lessons or exercises.

## Public course structure observed

Khan Academy currently lists 12 units and 47 practice skills: About the SAT (no exercise), Foundation units for Information and Ideas; Craft and Structure; and Expression of Ideas + Standard English Conventions; the same three groups at Medium and Advanced; a Challenge unit with six combined/high-difficulty skills; and SAT grammar practice with eight focused exercises. Thus 11 core skill families appear at three levels (33), followed by six Challenge skills and eight grammar-practice skills (47).

| Khan Academy unit group | Skills | Band 9 destination | Band 9 action |
| --- | --- | --- | --- |
| Foundation / Medium / Advanced — Information and Ideas | Textual evidence; quantitative evidence; central ideas and details; inferences | Units 14–16 | Existing tiered sets; new original reading items added to central ideas, evidence, and inference |
| Foundation / Medium / Advanced — Craft and Structure | Words in context; text structure and purpose; cross-text connections | Units 11–13 | Existing tiered sets; new original passages and questions |
| Foundation / Medium / Advanced — Expression + Conventions | Transitions; rhetorical synthesis; form, structure, and sense; boundaries | Units 1–10 | Existing tiered sets; generated synthesis practice moved to Expression of Ideas (Unit 10) |
| Challenge | Six integrated practice skills | Corresponding topic sets | Links to the relevant Band 9 skill bank |
| SAT grammar practice | Agreement, pronouns, plurals/possessives, verb forms, modifiers, clause linking, supplements, punctuation | Units 1, 3–8 | Focused review links and strategies |

The 47 entries are represented individually in `src/services/sat-rw/official-course.ts`. Each entry includes a learning strategy, a common trap, and a direct destination in Band 9. The three core tiers are 33 distinct targets. The existing bank stores a subset of fine-grained grammar topics together; where a separate question pool does not exist, the link points to the closest maintained unit rather than duplicating old items under a false skill label.

## New Band 9 material

Twelve original short passages and questions were added in `src/data/seed/sat-rw/original-reading-expansion.ts`. They cover central ideas/details, textual evidence, inference, words in context, text structure/purpose, and cross-text connections. Each has one verified key, a Vietnamese explanation, and a reason for each distractor. These were written for Band 9 and are not adaptations of Khan Academy prompts.

## References and reuse

- [SAT Reading & Writing course](https://www.khanacademy.org/sat-reading-and-writing) — public unit and skill inventory.
- [About the digital SAT Reading and Writing test](https://www.khanacademy.org/about-the-digital-sat-reading-and-writing-test) — tested domains and course-use guidance.
- [Khan Academy terms of use](https://www.khanacademy.org/about/terms-of-use) — reviewed for this research. No Khan Academy text, question, answer choice, video, or media was copied into Band 9.

The lesson approaches are summarized at a high level as internal curriculum notes; all newly shipped passages, questions, explanations, and distractors are original Band 9 material. Khan Academy public pages are the research reference, not a content feed.
