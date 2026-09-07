# Application form — text to paste

*For the UNU Macau "AI for SDGs — Global Youth AI Future Innovation Competition 2026"
form at ff.lingxi360.com. Deadline 15 September 2026.*

Fill the personal fields yourself — name, university, email, phone, address. Everything
below is ready to paste.

**The measurement completed on 7 September 2026: 30.3% of AI-generated reading questions
(111 of 366 blind checks) could be answered without the passage.** That figure is safe to
use. Regenerate it with `npx tsx scripts/export-provenance-summary.ts` if the corpus grows,
and update this file rather than typing a different number anywhere else.

---

## Focus Area

**AI for Education**

## Company or Project Name

ReadUp

## Year of Formation

2026

## Website

https://readup-ielts.vercel.app — open measurement at
https://readup-ielts.vercel.app/observatory

## Looking for

R&D Partner *(a university or exam board willing to run the same check against real
exam items is worth more to this project than money right now.)*

---

## Introduction

*(~120 words — who we are and why this exists)*

> ReadUp is an English exam-preparation platform built for Vietnamese learners, where
> private tutoring costs more per month than most families can spend and the alternative
> is a class too large for anyone to be diagnosed individually. It runs on web, iOS and
> Android from one codebase, with 1,400+ reading passages, a SAT Maths engine whose
> answers are computed in code rather than generated, and a vocabulary system on
> spaced repetition.
>
> What makes it a research project as well as a product is a refusal: it will not tell a
> learner they have understood something on the strength of a correct answer alone. It
> records what can be observed, requires success on unseen material before confirming a
> skill, and publishes every place where its own machinery could not check something.

---

## Key product or solution Introduction

*(~200 words — what the innovation actually is)*

> Almost every AI tutoring product now generates practice questions with a language
> model, and none of them ship the question's provenance. A learner has no way to know
> which model wrote the question, what was checked before it arrived, or how many drafts
> were discarded first.
>
> ReadUp puts every generated question through an adversarial gate: **a second model is
> asked to answer it without being shown the passage.** If it succeeds and reports that
> the answer was determinable, the question does not test reading comprehension and is
> discarded. No formal rule catches this failure — "According to the passage, is water
> wet?" is correctly formatted, quotes the source verbatim, and is useless.
>
> Run at scale, that gate produced a number nobody had published: **30.3% of generated
> reading questions — 111 of 366 — could be answered blind.** Two models, verified
> distinct by behavioural probe, landed within 0.3 percentage points of each other, which
> points at a property of the task rather than one model's defect. The generation prompt
> already forbade the failure in six explicit rules; the measurement is of what happens
> anyway.
>
> Each verdict becomes a signed provenance label. Those labels feed two things: a public
> measurement of how often AI-generated reading questions fail this test, broken down by
> model; and a W3C Verifiable Credential the learner holds on their own device, signed
> with a `did:key` identifier that needs no server, no blockchain and no connectivity.
>
> A standalone verifier reads that credential and reports what it establishes — and,
> always, the three things it does not. Nobody is asked to trust us.

---

## Business Plan / Pitch Deck

See `docs/submission.en.md` and `docs/provenance-chain.en.md`; the deck is built from
those. Export to PDF before uploading — the form accepts up to 30 MB.

---

## What NOT to claim on this form

Written down so a late-night edit does not quietly overstate things:

- **Not "the average AI tutor produces 30% bad questions."** The figure is two models,
  one prompt, one public-domain corpus, one judge. Say what was measured, not what it
  implies about products we did not test.
- **Never quote the figure without the 35 unchecked runs.** They are excluded from the
  fraction, not counted as passes, and leaving them out makes the denominator look
  cleaner than it is.
- **Not "verified by humans."** The human anchor has not been run yet. Until it has, this
  is a model adjudicating a model, and the observatory page says so.
- **Never name the vendors.** The models came through a gateway whose labels proved
  unreliable. We verified the endpoints are *distinct* models; we did not verify who built
  them. Say "two distinct models", never "DeepSeek and Gemini".
- **Not "verified by an institution."** The credential is self-issued. Say "portable and
  independently checkable", never "recognised".
- **Not "proven to improve learning."** There is no efficacy data. TRL 6, not 7.
- **Not "the gate runs on every question."** It runs in the measurement harness and on
  transfer probes today. Moving it onto every served item is the next step.
