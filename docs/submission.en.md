# ReadUp — AI for SDGs 2026

**Track:** AI for Education
**Theme fit:** AI Transforming the Educational Paradigm and Enhancing AI Literacy
**Live:** https://readup-ielts.vercel.app · measurement page at `/observatory`
**Languages:** Vietnamese (learners), English (mechanism, verifier, measurement)

---

## One paragraph

Every AI tutoring product now generates practice questions with a language model, and
none of them ship the question's provenance. ReadUp makes each generated question
survive an adversarial gate — **a second model must fail to answer it without being
shown the passage** — then records that verdict, signs it, and publishes what the
verdicts add up to. The same signature chain runs all the way to the learner's own
credential, so a claim about what someone can do can be audited by that person, and by
anyone they show it to, without trusting us.

---

## The problem

**A question that can be answered without reading the passage does not measure
reading.** It measures background knowledge, or the shape of four options. Learners
drilled on such questions learn to guess, and their measured progress is partly
fictional.

No formal rule catches this. *"According to the passage, is water wet?"* is correctly
formatted, quotes the source verbatim, has four well-formed options — and is useless.

**Nobody has published how often it happens.** That is the gap this entry closes.

Vietnam sharpens the stakes: test preparation is high-stakes and expensive, a private
IELTS tutor costs more per month than many families can spend, and the alternative is a
class too large for individual diagnosis. The tools filling that gap are exactly the
ones generating unaudited questions.

---

## What we built

Four artefacts on one cryptographic spine. Each is checkable by someone who does not
trust us and does not run our software.

```
model writes an item → signed provenance label → learner answers → signed credential → anyone verifies
```

### 1. A signed provenance label on every generated item

Which model wrote it (with version), which gates ran, what each returned, how many
drafts were rejected and why.

**Its most important field is the one saying a gate did *not* run.** `not-run` is never
merged into `passed`, and a test fails if it ever is. When a provider call fails the
item is still served — blocking a learner because our own gate broke punishes the wrong
person — but the label records that nothing was checked. Lying about having checked
turns the whole receipt into decoration.

### 2. A credential the learner holds

The evidence ledger signed into a W3C Verifiable Credential with a `did:key`
identifier. The private key never leaves the device. No blockchain, no server, no
network.

The payload is not a score. It says: *skill X was confirmed by a transfer probe on a
**different source**, on items whose provenance labels are these.* A credential that
carries its own evidence chain.

### 3. A verifier that runs when ReadUp is gone

`scripts/verify-credential.ts` imports nothing from the application and calls no
network. It reads a JSON file and does arithmetic on a signature.

```
✓ signature valid          did:key:z6MkvrEz7KFP9QeRhm8xvaqrFdk7Wc9aH1T3qrZ35VKamzP5
✓ 4 skills recorded, 2 confirmed by transfer to a different source

This does NOT establish:
  ⚠ that the holder did not cheat while answering — a signature covers the record, not the exam room
  ⚠ that any institution recognises this credential — it is self-issued by the learner
  ⚠ that the cited item labels exist, until the public label corpus is published
```

Those three lines always print; no flag turns them off. A receipt made only of ticks
reads as a certificate, which is the misunderstanding this mechanism exists to prevent.

That output was produced by feeding the verifier a credential **issued in the browser**
— two entirely separate runtimes, one chain.

### 4. The measurement the product produces by running

Every blind check is a datum about model behaviour. Accumulating them makes ReadUp an
observatory for the quality of AI-generated assessment, one that pays for itself by
also being a decent place to study. Published at `/observatory`, in English.

**The question is sharper than it looks.** The generation prompt *already contains six
explicit rules* forbidding exactly this failure — no copying sentences from the
passage, no building FALSE by inserting "not", no self-revealing distractors. So the
measurement is not *"does AI get this wrong"*; it is **how often it still does after
being told not to.**

---

## Pre-registration

The falsification threshold is a constant in `src/services/provenance/ledger.ts`,
committed **before the measurement first ran.** Git history is the evidence for that
order — which is why it lives in code, not in a document that can be edited at any time.

- **Threshold 8%.** Below it, the pre-written conclusion is that the gate catches less
  than it costs and is not worth the money at this scale.
- **Minimum sample 200 blind runs.** Below it the function refuses to conclude
  anything, so we cannot later point at a rate computed over three items.

Three conclusions are written out in full, one per outcome. Choosing between them is an
arithmetic comparison, not a judgement.

**Status as of 7 September 2026: the run is in progress and has not yet reached the
200-run minimum, so no headline figure is claimed.** The observatory page currently
displays `NO CONCLUSION YET` and says how far short it is. A page that admits it lacks
data is worth more than a page with a number.

## The human anchor

Without people this is a machine adjudicating a machine. Three to eight learners answer
~100 of the same items with the passages withheld, asked the same two questions the
model was asked: *what is your answer*, and *were you sure or guessing*.

The worksheet mixes half items the model rejected with half it passed. Random sampling
would produce almost entirely passed items, measuring the false-alarm rate and barely
measuring the miss rate — and misses are worse, because a miss sends a useless item
straight to a learner.

Three to eight people cannot support a learning-outcomes study; one of that shape was
**cut** for exactly this reason. They comfortably support an agreement rate. Protocol,
consent form, and the sentences the facilitator must not say:
`docs/doi-chung-nguoi-that.md`.

---

## What exists today

Deployed and publicly reachable, not a prototype.

| | |
|---|---|
| Reading passages | 1,408 |
| SAT Maths | infinite generation from 38 templates across 19 skills; answers computed in code, never generated |
| SAT Verbal | 384 questions, 16 skill units |
| Writing prompts | 60, with per-criterion AI grading and inline error annotation |
| Vocabulary | 50 topics, 2,500 words with FSRS scheduling |
| Listening — audio | 251 public-domain pieces shipped **with their transcripts** (178,280 words) plus 1,112 editor-written glossary entries; nothing to prepare |
| Listening — video | 220 curated videos at native speed; transcript pasted once per video |
| Automated tests | 1,556 passing, of which 103 cover the chain described here |
| Model providers | 3 independent, different labs, automatic failover |

Runs on web, iOS and Android from one Expo codebase.

---

## SDG mapping

**SDG 4 — Quality education.** Learners stop being drilled on items that do not test
what they claim to, and the rate of such items becomes a published number.

**SDG 10 — Reduced inequalities.** `did:key` needs no ledger, no server and no
connectivity, so a learner with none of those still *owns* a portable, checkable record
of their own ability. The teacher view needs no accounts and no server either.

**SDG 9 — Industry, innovation and infrastructure.** The gate, the label format and the
verifier are documented and reusable. Any vendor generating assessment items can run
the same check against their own pipeline.

**SDG 16 — Institutions.** A claim about a person is auditable by that person, without
trusting the party that made it.

---

## Technology readiness

**TRL 6.** Deployed, publicly reachable, running end-to-end with real content and a
live AI backend, with the full signature chain demonstrated across two runtimes.

**Not TRL 7, for a specific reason:** there is no efficacy data from a real cohort. The
mechanism is implemented and tested; it has not been measured against learning outcomes
with learners who are not us. We would rather say that than call a demonstration a
validation.

## Limits, stated plainly

- **No efficacy data yet.** See above.
- **The measurement has not reached its own pre-registered minimum.** No headline figure
  is claimed until it does.
- **The credential is self-issued.** No institution recognises it, and none will by
  November. Its value is that the record and its evidence are portable and checkable,
  in a format an institution *could* accept.
- **Losing the key loses the credential.** No recovery. That is the price of having no
  server, and the interface says so rather than hiding it.
- **The blind judge is itself a model.** Anchored against people; the agreement rate
  will be published even if it is poor.
- **The passage corpus is Wikipedia, Gutenberg and PLOS** — not real exam passages.
- **The listening audio is read slowly on purpose.** VOA Learning English is written for
  learners and read below natural speed, so it trains comprehension but not the pace of
  real speech. The video library covers that, and it costs the learner one paste per
  video: YouTube now requires a parameter signed by its own player, so neither a server
  nor a browser can fetch captions (measured 5 Sept 2026 on both routes). We chose to
  change source rather than work around a platform's stated boundary — which is also why
  the audio library exists at all.
- **Audio evidence timestamps are estimated**, not published. VOA gives the full text but
  no per-sentence timing, so clicking a piece of evidence seeks to within a few seconds
  rather than exactly. That is good enough to re-hear a passage and not good enough for
  sentence dictation, so dictation is not offered on audio.
- **The gate does not yet stand on the main generation route.** It runs in the measurement
  harness and on transfer probes. Moving it onto every served item is the next step, and
  the label format already carries the `not-run` state needed to be honest about the gap.

## Further reading

- `docs/provenance-chain.en.md` — the mechanism in full
- `docs/evidence-ledger.en.md` — states, probe table, confirmation rule
- `docs/doi-chung-nguoi-that.md` — the human-anchor protocol (Vietnamese; it is for
  Vietnamese teenagers and their parents)
