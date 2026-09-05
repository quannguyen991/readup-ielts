# Two-week pilot protocol

*What ReadUp still lacks is not a feature. It is evidence that the mechanism changes
what learners can do. This document is the smallest study that would produce that
evidence honestly.*

---

## The claim being tested

> Requiring transfer to a different passage before confirming a skill produces a more
> accurate picture of what a learner can do than answer-accuracy alone.

Two things follow if the claim holds, and both are measurable in two weeks:

1. **Confirmation predicts later success better than accuracy does.** A skill marked
   `confirmed` in week 1 should hold up in week 2 more reliably than a skill the learner
   simply answered correctly.
2. **`misaligned-correct` is not rare.** If right-answer-wrong-evidence almost never
   happens, the second axis is expensive machinery measuring nothing, and the honest
   conclusion is to say so.

The second is a genuine falsification condition. It is written down first so that a
disappointing result cannot be quietly reinterpreted later.

---

## Size and shape

- **12–20 learners.** Enough for shared difficulties to appear in the teacher view;
  small enough that one person can run it without a research team.
- **Two weeks**, 4 sessions per learner, 20–30 minutes each.
- **One teacher** using the class view between sessions.
- No control group. With this sample size a control arm would produce a comparison too
  noisy to mean anything, and pretending otherwise would be worse than not having one.
  The within-learner comparison in Q1 below is what carries the weight.

## Recruitment and consent

Learners are recruited from an existing IELTS or SAT class. Participation is voluntary
and unpaid, and non-participation must carry no cost — no lost class time, no different
treatment.

Because participants may be under 18:

- Written consent from a parent or guardian, and assent from the learner.
- Consent form states plainly: what is collected, what is not, where it is stored, and
  that withdrawal is possible at any time with data deleted.
- Learners choose their own code (`HS-01`). The mapping from code to person, if the
  teacher keeps one at all, stays with the teacher and never enters any export.

## What is collected

Only the anonymous ledger export the app already produces:

- skill id, status, last observed state, observation count, transfer count, timestamp

Explicitly **not** collected: names, essay text, reading history, `lastSourceId`, device
identifiers, IP addresses. The export function strips the source id before writing, and
there is a test asserting it.

Exports are collected at the end of each session. They live on the teacher's machine.
Nothing is uploaded.

---

## The four questions, and what would answer each

### Q1 — Does confirmation predict better than accuracy?

For each learner, take skills that reached `confirmed` in week 1 and skills that were
merely answered correctly at least twice without a transfer probe. In week 2, measure how
often each group is answered correctly again on new material.

**Supports the claim:** confirmed skills hold up noticeably more often.
**Refutes it:** the two groups behave the same — the transfer requirement is costing
learners time and buying nothing.

### Q2 — How common is right-answer-wrong-evidence?

Count the share of attempts landing in `misaligned-correct`.

**Interesting if** it exceeds roughly 15%: a sixth of correct answers are resting on the
wrong grounds, and accuracy alone was hiding that.
**Report as a null result if** it is under about 5%. The second axis would then be
machinery that measures almost nothing, and that finding is worth publishing plainly
rather than burying.

### Q3 — Does self-diagnosis split the maths cases as intended?

Among wrong maths answers, compare learners who named their own error correctly against
those who did not, on whether they repeat that same error tag later.

**Supports the design:** the mis-namers repeat it more.
**Refutes it:** naming makes no difference, and the step is friction without payoff.

### Q4 — Does the teacher view change what gets taught?

Not a number. After each week the teacher writes two or three sentences: what they
planned to teach, what the class view showed, and whether they changed anything.

**Supports it:** at least one lesson is redirected by something the teacher did not
already know.
**Refutes it:** the view only confirms what they could already see, which means it is
decoration.

---

## Sessions

| Session | Learner does | Data point |
|---|---|---|
| 1 | Reading with evidence marking, ~20 min | baseline ledger |
| 2 | SAT Maths drill with self-diagnosis | Q3 data begins |
| 3 | Reading or listening on **new** material | Q1 depends on this being new |
| 4 | Mixed; whatever the ledger says needs work | Q1, Q2 close out |

Session 3 must use material the learner has not seen. If it repeats week-1 passages, Q1
measures memory instead of transfer and the whole pilot answers nothing.

---

## Threats to validity, named in advance

- **Novelty effect.** Two weeks is short; engagement may reflect newness rather than the
  mechanism. Do not report engagement as evidence for the claim.
- **Selection.** Learners from one class share a teacher and a curriculum. Findings do
  not generalise beyond that setting, and should not be written as if they do.
- **Self-report in Q4.** The teacher knows what the tool is meant to do. Record their
  planned lesson **before** they open the class view, so the comparison is against a
  commitment rather than a recollection.
- **Small numbers.** With 12–20 learners, a difference in Q1 of a few percentage points
  means nothing. Only a large gap is worth reporting, and the report must give raw counts,
  not just percentages.

---

## What gets written up

One page, containing:

1. The four questions and what was found for each, including nulls.
2. Raw counts, not only percentages. `4 of 6 learners` is honest; `67%` of six is
   technically true and rhetorically misleading.
3. Every threat above that turned out to matter.
4. What would need to change in the mechanism as a result.

If Q2 comes back under 5%, that goes at the top of the page, not the bottom.
