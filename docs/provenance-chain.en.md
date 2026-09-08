# A chain of custody for a learning claim

*From "a model wrote this question" to "this learner can do this" — with every link
signed, and no link asking you to trust the vendor.*

Written 7 September 2026. Measurement figures are marked and dated where they appear;
where a figure is not yet in, this document says so rather than leaving a gap.

---

## The problem, in one paragraph

Almost every AI tutoring product now generates practice questions with a language
model. None of them ship the question's provenance. A learner answering an
AI-generated reading question does not know which model wrote it, what was checked
before it arrived, or how many drafts were thrown away first. If some fraction of
those questions do not test what they claim to test, learners are being drilled on
guessing — and their measured progress is partly fictional. Nobody has published
that fraction.

## What is different here

Four artefacts, one cryptographic spine. Each one is checkable by someone who does
not trust us and does not run our software.

```
 model writes an item → signed provenance label → learner answers → signed credential → anyone verifies
        │                       │                                          │                    │
        └── measured ───────────┘                                          │                    │
                (1) label                                            (2) credential      (3) verifier
```

### 1. A signed provenance label on every generated item

Each item carries a record: which model wrote it (with version), which gates ran,
what each gate returned, how many drafts were rejected and why.

The gate that matters is adversarial and is the reason this project exists:

> **The blind check.** A second model is asked to answer the question *without being
> shown the passage.* If it answers correctly and reports that the answer was
> determinable, the item does not test reading comprehension, and it is thrown away.

No formal rule catches this failure. *"According to the passage, is water wet?"* is
correctly formatted, quotes the source verbatim, has four well-formed options — and
is answerable without opening the text.

**The label's most important field is the one that says a gate did *not* run.**
`not-run` is never merged into `passed`, and a test fails if it ever is. When a
provider call fails the item is still served — blocking a learner because our own
gate broke punishes the wrong person — but the label records that nothing was
checked. Lying about having checked would turn the whole receipt into decoration.

### 2. A credential the learner holds, issued by the learner

The evidence ledger is signed into a W3C Verifiable Credential using a `did:key`
identifier. The private key never leaves the device. No blockchain, no server, no
network.

The payload is not a score. It says: *skill X was confirmed by a transfer probe on a
**different source**, on items whose provenance labels are these.*

**This credential is self-issued, and we say so in the code and in the verifier
output.** The signature proves exactly one thing: the record has not been altered
since signing, by the holder of this key. It does **not** prove that an independent
authority attests to it, and it does **not** prove the learner did not cheat while
answering.

So where does the weight come from? From what the credential *cites*, not from who
signed it. A university checking it can walk back to the provenance labels of the
items the claim rests on. Anyone who wants to trust it can check each link; nobody
is asked to trust ReadUp. That is the same move as the blind check, one layer up.

**Why self-issued rather than server-issued.** A server-issued credential attests
more strongly, but it turns a learner's record of their own ability into a service
that can die, and someone in a place without infrastructure holds nothing. Trading
that for ownership is the right trade for this problem — provided we are honest
about where it is weak.

### 3. A verifier that runs when ReadUp is gone

`scripts/verify-credential.ts` imports nothing from the application, calls no
network, and needs no key or account. It reads a JSON file and does arithmetic on a
signature.

```
$ npx tsx scripts/verify-credential.ts credential.json
✓ signature valid          did:key:z6Mko8DY33154peonDUuhgVGykK9nPxFt1g4PCZvsK3hxM8G
✓ 4 skills recorded, 2 confirmed by transfer to a different source
· 3 provenance labels cited

This does NOT establish:
  ⚠ that the holder did not cheat while answering — a signature covers the record, not the exam room
  ⚠ that any institution recognises this credential — it is self-issued by the learner
  ⚠ that the cited item labels exist, until the public label corpus is published
```

Those three lines always print. There is no flag that turns them off. A receipt made
only of ticks reads as a certificate, which is precisely the misunderstanding this
mechanism exists to prevent.

Tampering is caught. Editing one skill from `probing` to `confirmed` in the JSON
produces:

```
✗ INVALID — SIGNATURE DOES NOT MATCH — the content was altered after signing, or a different key signed it
```

### 4. The measurement the product produces by running

Every blind check is a datum about model behaviour. Until now that datum lived in one
HTTP response and vanished. Accumulating it makes ReadUp an observatory for the
quality of AI-generated assessment — one that pays for itself by also being a decent
place to study.

**The question is sharper than it first appears.** The generation prompt in
`src/services/ai/questions.ts` *already contains six explicit rules* (8–13) forbidding
exactly this failure: no copying sentences from the passage, no building FALSE by
inserting "not", no distractors that give themselves away. So what is being measured
is not *"does AI get this wrong"* — it is **how often it still gets it wrong after
being told not to.** A high rate after an explicit prohibition says something a high
rate with no instruction does not.

---

## Pre-registration

The falsification threshold is a constant in `src/services/provenance/ledger.ts`,
committed **before the measurement first ran.** Git history is the evidence for that
order; that is why it lives in code rather than in a document that can be edited at
any time.

- **Threshold: 8%.** Below that, the pre-written conclusion is that the gate catches
  less than it costs — double the model calls to remove fewer than one item in
  twelve — and that the mechanism is right in principle but not worth the money at
  this scale.
- **Minimum sample: 200 blind runs.** Below that the function refuses to conclude
  anything at all, so that we cannot later point at a rate computed over three items.

Three conclusions are written out in full, one per outcome. Choosing between them is
an arithmetic comparison, not a judgement. That is what makes pre-registering mean
something.

## Caveats that ship with every figure

1. **"A model could answer it blind" is a lower bound on leakage, not a verdict on
   pedagogical worth.** Real exams also contain items partly answerable from general
   knowledge.
2. **The corpus is Wikipedia, Project Gutenberg and PLOS — not real exam passages.**
3. **Models are versioned.** Names and measurement dates are pinned in every label.
4. **The judge is itself a model.** Anchored against people — see below — and the
   agreement rate is reported even when it is bad.
5. **One fixed judge for all generators.** Rotating judges would put judge strictness
   inside the comparison. The cost is that absolute numbers carry that judge's
   fingerprint, and comparisons across judges are not valid.

## The human anchor

Without people, the measurement is a machine adjudicating a machine. Three to eight
learners answer ~100 of the same items with the passages withheld, and are asked the
same two questions the model was asked: *what is your answer*, and *were you sure or
guessing*.

The worksheet deliberately mixes half items the model rejected with half it passed.
Sampling at random would produce a sheet of almost entirely passed items, which
measures the false-alarm rate and barely measures the miss rate — and misses are the
worse failure, because a miss sends a useless item straight to a learner.

Three to eight people cannot support a learning-outcomes study; a study of that shape
was cut for exactly this reason. They can comfortably support an agreement rate. The
protocol, including the sentences the facilitator must not say, is in
`docs/doi-chung-nguoi-that.md`.

## The figures

Measured 7 September 2026. 656 generated items, 599 completed blind checks.

| | |
|---|---|
| Answerable without the passage | **171 / 599 — 28.5%** |
| `deepseek-3.2` | 30.5% (60 / 197) |
| `gemini-3.8-flash` | 30.2% (51 / 169) |
| `gemini-3.1-pro` | 28.4% (54 / 190) |
| Could not be checked | 57, counted separately |
| Pre-registered verdict | `above-threshold` |

**A stronger model does not fix it.** The Pro-tier model came in at 28.4% against the
Flash model's 30.2% — a gap well inside the noise at these sample sizes.

Three distinct models land within 2.1 points of each other, given the prompt that already
forbids this in six explicit rules. That closeness is the finding: it is a property of the
task, not a defect in one particular model.

Two further endpoints appear in the published table with 28 and 15 checks. They are shown
rather than hidden, but marked *too few runs to compare* and sorted last — a rate over 15
observations cannot sit beside one over 197.

**On model identity — what we verified and what we did not.** The models were served
through a local OpenAI-compatible gateway that routes many upstreams, and its labels are
not trustworthy on their own. Three separate failures, all observed directly: an endpoint
labelled `gpt-5.6-sol` answered *"Gemini 3.5 Flash is no longer available"*; an endpoint
named after a Chinese lab self-reported as Claude; and a listed model returned *"Requested
entity was not found"* because it no longer exists upstream.

So distinctness was tested rather than assumed, with open-ended probes at temperature 0.
**Every pair differed.** That establishes what the finding needs: the generators are
different models, and the judge is another, so it is not grading its own output.

One probe in the set discriminated nothing, and the reason is instructive. Asked for an
invented Icelandic cartographer surname, four unrelated endpoints produced *Kortsson* or
*Landakortsson* — `kort` means map and the patronymic suffix is fixed, so the task has an
obvious answer. Agreement there measures the question, not the models. The probes that did
discriminate separated every pair.

It does **not** establish which labs made these models, and we do not claim it.

**A bug we found by measuring, recorded here because it cuts the right way.** A type error
in our own reply reader marked 18% of checks "not run" when the judge had in fact answered
— it accepted a string answer but not a numeric one, and the judge returns option indices
as numbers. Because `not-run` is excluded from the fraction rather than counted as a pass,
the bug *understated* our own result instead of inflating it. The honest-by-default design
made its own error visible and harmless.

## SDG mapping

**SDG 4 — Quality education.** Learners stop being drilled on items that do not test
what they claim to. The rate of such items, previously unmeasured, becomes a number.

**SDG 10 — Reduced inequalities.** `did:key` needs no ledger, no server and no
connectivity, so a learner in a place with none of those still *owns* a portable,
checkable record of their own ability.

**SDG 9 — Industry, innovation and infrastructure.** The gate, the label format and
the verifier are documented and reusable. Any vendor generating assessment items can
run the same check against their own pipeline.

**SDG 16 — Institutions.** A claim about a person is auditable by that person, and by
anyone they show it to, without trusting the party that made the claim.
