# ReadUp — AI for SDGs 2026

**Track:** AI for Education
**Theme fit:** AI Transforming the Educational Paradigm and Enhancing AI Literacy
**Live:** https://readup-ielts.vercel.app
**Languages:** Vietnamese (primary), English (mechanism and teacher-facing surfaces)

---

## One paragraph

ReadUp is an IELTS and SAT practice platform for Vietnamese learners that refuses to
report a percentage. Instead of scoring answers, it records what can be *observed* —
whether the answer was right, **and whether the learner could point at the evidence that
supports it** — and it confirms a skill only when the learner succeeds on material they
have not seen before. Every AI claim the system makes is shown to the learner alongside
what the system was able to verify, and what it could not.

---

## The problem

Two failures sit at the centre of automated learning tools, and they compound.

**A correct answer is not evidence of understanding.** A learner can be right because
they understood, because they remembered, because they matched a keyword, or because they
guessed. A percentage treats all four identically, so a learner can carry an inflated
score for months and only discover the gap in the exam hall.

**Learners are being handed AI feedback they have no way to evaluate.** Language models
write fluent, confident, well-formed prose whether or not the content is true. A
generation of students is receiving assessment from systems whose failure mode is
invisible to them — and the tools themselves rarely acknowledge that anything was
checked, let alone what.

Vietnam sharpens both. Test preparation is high-stakes and expensive; a private IELTS
tutor costs more per month than many families can spend, and the alternative is a large
class where individual diagnosis is impossible.

---

## What ReadUp does differently

### 1. Two axes, not one

Every attempt produces two observations: *was the answer right*, and *did the learner
point at the supporting evidence*. That gives four states, each isolating a different
difficulty — plus a fifth, `unobserved`, kept deliberately separate because **not
measured is not the same as measured and found wanting**.

The state that matters most is `misaligned-correct`: right answer, wrong grounds. This is
invisible to answer-accuracy, and it is where pattern-matching hides.

Each area supplies the second axis in its own natural form:

| Area | Second axis |
|---|---|
| Reading | the paragraph the learner highlighted |
| Listening | the transcript section where they heard the answer |
| SAT Maths | which named error they believe they made |
| SAT Verbal | which rule they believe the question is testing |
| Writing | whether they can fix the same error class in an unseen sentence |

### 2. Confirmation requires transfer

A skill is confirmed only when the learner succeeds on a **different source**. Repeated
success on the same passage cannot separate *understood* from *remembered this passage*.
Confirmation is withdrawn on a later failure — it describes the present, not an award.

The classifier and probe table are **pure functions with no model call**. If a model could
declare understanding, a fluent explanation would become self-certifying while the
mechanism silently stopped meaning anything.

### 3. The system explains its own reasoning

Every skill opens into a chain: what was observed → what follows → which probe was
selected and why → what confirmation still requires. The wording is constrained by a test
that fails if judgement language ("did not understand", "guessed") appears in either
language — the system describes observations, not mental states it cannot see.

### 4. AI literacy taught through the product's own behaviour

Grading results carry a verification receipt separating four methods: *matched against
your text*, *computed in code*, *cross-checked with task data*, and **not
machine-checkable**. The last row is always present and always displayed differently,
guarded by a test — without it the receipt reads as a certificate, the exact
misunderstanding it exists to prevent.

A line reading *"the AI offered 5 quotations; 1 did not exist in your essay and was
removed"* teaches model fabrication more effectively than a lesson about it, because it
happens on the learner's own work, in front of them.

### 5. Answers computed in code wherever possible

Every SAT Maths answer is computed, never generated. Distractors are produced by breaking
exactly one named rule, so a wrong choice reveals a specific misconception rather than
just being wrong.

---

## What exists today

Deployed and publicly reachable, not a prototype:

| | |
|---|---|
| Reading passages | 1,408 |
| SAT Maths | infinite generation from 38 seeded templates across 19 skills; answers computed in code |
| SAT Verbal | 384 questions, 16 skill units, 50 reproducible mixed sets |
| Writing prompts | 60, with per-criterion AI grading and inline error annotation |
| Vocabulary | 50 topics, 2,500 words with FSRS scheduling |
| Sentence practice | 100 sets, ~1,100 sentences |
| Listening | 220 curated videos; comprehension questions generated from any transcript |
| Bilingual reading | 34 articles |
| Automated tests | 1,301 passing |
| Source files | 379 TypeScript/TSX |

Runs on web, iOS and Android from one Expo codebase. The AI layer routes across three
independent providers with a total time budget, so a single provider outage degrades
speed rather than removing the feature.

---

## SDG mapping

**SDG 4 — Quality education.** The core contribution. Diagnosis at the level of
individual sub-skills, with an evidential standard for claiming understanding, in a
context where one-to-one tutoring is priced out of reach for most families.

**SDG 10 — Reduced inequalities.** Vietnamese-first, mobile-first, free at the base tier.
The teacher view needs no accounts and no server: learners export an anonymous string from
their own device and the teacher pastes it in. That is a requirement for classrooms
without reliable infrastructure, not a simplification.

**SDG 9 — Industry, innovation and infrastructure.** The mechanism is documented rather
than hidden, in both languages, including its limits. The distinction between what a model
authors and what a deterministic function decides is a reusable design constraint, not a
product feature.

**SDG 16 (partial) — Institutions.** Verification receipts and named models make AI
assessment auditable by the person being assessed.

---

## Technology readiness

**TRL 6.** The system is deployed, publicly reachable, and running end-to-end with real
content and a live AI backend. The mechanism has been demonstrated in its operational
form.

**It is not TRL 7, and the reason is specific:** there is no efficacy data from a real
cohort. The mechanism is implemented and tested; it has not yet been measured against
learning outcomes with learners who are not us. A two-week pilot protocol designed to
produce that evidence — including its falsification conditions, written before running —
is in `docs/pilot-protocol.en.md`.

We would rather state this plainly than describe a demonstration as a validation.

---

## Limits, stated plainly

- **No efficacy data yet.** See above.
- **The ledger is device-local** and does not sync across devices.
- **Evidence marking is optional.** A learner who never marks evidence produces only
  `unobserved` states — the ledger says so rather than inferring.
- **Coverage is uneven.** Reading has the deepest implementation; Writing transfer probes
  were added most recently and have the least real-world exposure.
- **YouTube transcripts cannot be fetched automatically.** Measured on 5 Sept 2026: both
  server-side and browser-side routes are blocked. The video library asks the learner to
  paste a transcript once per video and remembers it, rather than promising automation
  that does not work.

---

## Further reading

- `docs/evidence-ledger.en.md` — the mechanism in full: states, probe table, confirmation
  rule, and why models are kept out of the decision
- `docs/pilot-protocol.en.md` — the two-week study, with falsification conditions stated
  in advance
