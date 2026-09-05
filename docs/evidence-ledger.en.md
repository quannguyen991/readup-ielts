# The Evidence Ledger

*How ReadUp decides that a learner has understood something — and why it refuses to
decide on weaker grounds.*

---

## The problem this exists to solve

Almost every learning app answers the question *"how is this learner doing?"* with a
percentage. A percentage is cheap to compute and impossible to act on. It cannot tell a
teacher what to teach tomorrow, and it cannot tell a learner what they actually cannot
do yet.

Worse, it hides a confusion at the centre of automated assessment: **a correct answer is
not evidence of understanding.** A learner can be right because they understood, because
they remembered the answer, because they matched a keyword, or because they guessed. A
score treats all four identically.

ReadUp separates them.

---

## Two axes, four states

Every attempt produces two observations, not one:

1. **Was the answer correct?**
2. **Did the learner point at the evidence that actually supports the answer?**

The second question is what makes the first interpretable. Together they give four
states, and each isolates a different problem:

| | Marked the right evidence | Marked the wrong evidence |
|---|---|---|
| **Answer correct** | `aligned-correct` | `misaligned-correct` |
| **Answer wrong** | `aligned-wrong` | `misaligned-wrong` |

`misaligned-correct` is the state that a percentage cannot see: right answer, wrong
grounds. Something produced the correct output, but it was not the reasoning the task
was testing.

There is a fifth state, and keeping it separate matters:

- `unobserved` — the learner marked nothing, or the item has no ground-truth evidence.

**Not measured is not the same as measured and found wanting.** Folding the two together
is the fastest way for a progress dashboard to start lying. ReadUp never guesses into
that gap.

### What the state names deliberately are not

The state names describe **observations**, not mental states. There is no
`did-not-understand` and no `guessed`. The system cannot see inside a learner's head, so
it does not name what it cannot see. This constraint is enforced by a test that fails if
judgement words appear in any learner-facing string, in either language.

---

## The probe table

Each state selects exactly one follow-up probe. The table is fixed, published, and **not
chosen by a model**:

| State | Probe | What it isolates |
|---|---|---|
| `aligned-correct` | `transfer` | content — a comparable item on different source material |
| `misaligned-correct` | `evidence-reselect` | locating — mark it again, with no explanation first |
| `aligned-wrong` | `entailment` | inference — remove the search step entirely |
| `misaligned-wrong` | `locate` | locating — remove the reasoning step entirely |
| `unobserved` | none | nothing observed means nothing to resolve |

Each probe isolates **one** variable. A probe that tests locating and inference at once
leaves you no wiser after the learner answers it. This is what makes "experiment design"
an accurate description rather than a flattering one.

`evidence-reselect` deliberately withholds the explanation before asking again. Explaining
first hands over the answer, and after that there is nothing left to measure.

---

## What confirmation requires

A skill is marked **confirmed** under two conditions, both necessary:

1. The probe was a `transfer` probe, and
2. it ran on a **different source** from the one where the difficulty appeared.

Passing a narrower probe means a specific unknown was resolved. It does not mean the
skill has formed. And repeating success on the same passage cannot separate *understood*
from *remembered this passage* — separating those two is the entire reason transfer
probes exist.

**Confirmation is withdrawn on a later failure.** It is a statement about the present,
not a badge that has been awarded. Learners regress; a ledger that cannot represent that
is not usable for deciding what to teach.

All of this lives in a pure function with no network access and no model call
(`src/services/mastery/ledger.ts`), covered by 20 tests that assert each of these
constraints directly.

---

## Why the model is kept out of the decision

Language models are used in ReadUp to **author** probe content: to write a comparable
question on a new passage, to compose a sentence carrying a specific error type, to
explain why a distractor is wrong.

They are never allowed to conclude that a learner has understood something.

The reason is specific rather than ideological. If a model can declare understanding,
then a fluent explanation becomes self-certifying — the system's output still looks
correct while the mechanism underneath it has stopped meaning anything, and nothing in
the interface reveals the change. Keeping classification in a deterministic function
makes that failure impossible rather than merely unlikely.

---

## How each skill area supplies the second axis

The 2×2 needs an evidence pointer. Each area supplies one in the form natural to it:

| Area | Evidence pointer |
|---|---|
| **Reading** | the paragraph the learner highlighted |
| **Listening** | the transcript section where they heard the answer |
| **SAT Maths** | which named error they believe they made |
| **Writing** | whether they can fix the same error class in an unseen sentence |

The maths case is worth spelling out. Every distractor in the SAT Maths generator is
produced by breaking exactly one named rule — `sign_flip`, `used_diameter_not_radius`,
`forgot_flip_inequality`. So the chosen distractor already reveals the misconception. But
telling the learner directly produces a nod and nothing else. Instead, after a wrong
answer and **before** the worked solution, ReadUp asks *"where do you think you went
wrong?"* That splits two cases needing opposite interventions:

- **wrong, names the error correctly** → the difficulty is in execution; more practice works
- **wrong, names it incorrectly** → they cannot see the break yet; the worked solution will not stop it recurring

This step is **not scored**. Attaching marks to it would push learners toward safe
answers instead of honest ones, destroying the signal it exists to collect.

---

## The teacher view

Teachers receive an anonymous export from each learner's device and paste it in. No
accounts, no server, nothing leaves anyone's machine. This is a requirement for
classrooms without reliable infrastructure, and it is also the cheapest way to avoid
holding children's learning data on a server at all.

The view answers one question: **which difficulties are shared?** Eighteen learners stuck
on the same inference skill is a lesson. Eighteen learners stuck on eighteen different
things is eighteen conversations. A class average gives both the same number.

Skills are ranked by **absolute count of learners stuck**, not by proportion — two out of
two is 100% and still not worth stopping a class for.

Exports carry a learner-chosen code, never a name, and the source id of each attempt is
stripped before export.

---

## What the app tells learners about its own AI

Wherever ReadUp uses a model, it also shows what it was able to check. A grading result
carries a receipt distinguishing four methods:

- **Matched against your text** — quotes are verified verbatim; fabricated ones are removed
- **Computed in code** — word count, and every SAT Maths answer
- **Cross-checked with the task data**
- **Not machine-checkable** — band estimates and prose feedback

The last row is always present and always displayed differently from the others, with a
test guarding it. Without it the receipt reads as a certificate — the exact
misunderstanding it exists to prevent.

This is AI literacy taught through the product's own behaviour. A line reading *"the AI
offered 5 quotations; 1 did not exist in your essay and was removed"* teaches more about
model fabrication than any lesson about it, because it happens on the learner's own work,
in front of them.

---

## Current limits, stated plainly

- **The ledger is local.** It does not sync across devices.
- **Evidence marking is optional.** A learner who never marks evidence produces only
  `unobserved` states, and the ledger will say so rather than infer.
- **Coverage is uneven.** Reading has the deepest implementation; SAT Verbal currently
  records attempts without a second axis.
- **No efficacy data yet.** The mechanism is implemented and tested; it has not been
  measured against learning outcomes with a real cohort. The pilot protocol in
  `docs/pilot-protocol.en.md` is designed to produce that evidence.
