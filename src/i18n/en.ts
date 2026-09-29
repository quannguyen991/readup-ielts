import { CITY_EN } from './city';
import type { Dictionary } from './keys';

/**
 * Bản tiếng Anh.
 *
 * Dịch theo NGHĨA và theo giọng, không dịch theo từ. Bản gốc tiếng Việt cố ý nói
 * thẳng và cụ thể — "chưa đo được khác với đo rồi thấy sai" — nên bản tiếng Anh
 * phải giữ được đúng độ thẳng ấy. Làm mềm nó đi thành văn phong sản phẩm chung
 * chung là làm mất chính thứ đang cần truyền đạt.
 *
 * Giữ nguyên các thuật ngữ đã có tên chuẩn trong tài liệu học thuật (transfer,
 * evidence, probe): người đọc bản tiếng Anh phần lớn là để hiểu CƠ CHẾ, và cơ chế
 * ấy nằm trong đúng những chữ đó.
 */
export const en: Dictionary = {
  'app.tagline': 'Practise on real exam material, and find out exactly where you go wrong',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.retry': 'Try again',
  'common.showAnswer': 'Show answer',
  'common.language': 'Language',

  'nav.explore': 'Explore',
  'nav.progress': 'Progress',
  'nav.mastery': 'Evidence ledger',
  'nav.vocabulary': 'Word bank',
  'nav.settings': 'Settings',

  'mastery.eyebrow': 'Evidence ledger',
  'mastery.title': 'Evidence ledger',
  'mastery.intro':
    'This app does not score you with a percentage. It records what can actually be observed — whether your answer was right, and which part of the text you relied on — and it only confirms a skill once you can do it on a different passage.',
  'mastery.whyStrictTitle': 'Why the bar is set here',
  'mastery.whyStrictBody':
    'Getting one question right can mean you understood it, but it can equally mean you remembered the answer or guessed well. Only an unseen passage separates those. That is why confirmation here is not a badge: meet the skill again and fail, and it is withdrawn.',
  'mastery.emptyTitle': 'Nothing recorded yet',
  'mastery.emptyBody':
    'Work through a reading passage or a maths set, and mark the part you relied on. Without that mark the app only knows whether you were right — it has nothing to compare against, so it records “not yet observed” rather than guessing on your behalf.',
  'mastery.whyThink': 'Why the app concluded this',
  'mastery.nextStep': 'What happens next',
  'mastery.observations': '{n} observation|{n} observations',
  'mastery.transfers': 'succeeded once on a different passage|succeeded on a different passage {n} times',

  'status.confirmed': 'Done on a different passage',
  'status.probing': 'Not enough evidence yet',
  'status.needsProbe': 'Something to resolve',
  'status.unobserved': 'Not yet observed',

  'state.unobserved':
    'You did not mark what you relied on, so there is nothing to compare against. Not measured is not the same as measured and wrong — the app does not fill that gap with a guess.',
  'state.alignedCorrect': 'You answered correctly, and the part you marked is the part that supports the answer.',
  'state.misalignedCorrect':
    'You answered correctly, but the part you marked is not what supports the answer. A right answer resting on the wrong evidence settles nothing.',
  'state.alignedWrong':
    'You found the right part but answered incorrectly. So the difficulty is in the inference step, not in locating the evidence.',
  'state.misalignedWrong': 'Your answer was wrong and the part you marked does not support the answer either.',

  'probe.transfer':
    'A comparable question on A DIFFERENT PASSAGE. This is the only probe that produces confirmation, because it is the only one that separates “understood it” from “remembered this passage”.',
  'probe.evidenceReselect':
    'You mark the evidence again, and deliberately WITHOUT an explanation first — explaining first hands you the answer, and after that there is nothing left to measure.',
  'probe.entailment':
    'The locating step is removed entirely; the question is only whether the text supports this claim. That isolates the inference step.',
  'probe.locate':
    'The reasoning step is removed entirely; the question is only which part of the text. That isolates locating.',

  'explain.domain': 'Skill area',
  'explain.observed': 'Observed across {n} attempt|Observed across {n} attempts',
  'explain.probeChosen': 'Probe selected',
  'explain.condition': 'What confirmation requires',
  'explain.conditionBody':
    'Succeeding on the same skill in A DIFFERENT PASSAGE. Repeated success on the same passage does not count, and confirmation is withdrawn if you later fail.',
  'explain.transfersDone': 'Transfer achieved',
  'explain.nextConfirmed':
    'Nothing to do here for now. The app keeps watching: meet this skill again and fail, and the confirmation is withdrawn.',
  'explain.nextNoMark':
    'Next time you work on this skill, mark the part you relied on — without that mark there is nothing for the app to compare against.',
  'explain.nextTransfer':
    'The app will give you the same skill on a different passage. Pass it and this skill is confirmed.',
  'explain.nextNarrow':
    'The app will give you a narrower probe to pin down where the difficulty is, before moving to the transfer step.',

  'verify.title': 'What the AI claimed, and what the app could check',
  'verify.summary': '{checked} claims checked · {rejected} rejected as untrue',
  'verify.summaryClean': '{checked} claims checked · none rejected',
  'verify.howToCheckTitle': 'How to check it yourself',
  'verify.howToCheckBody':
    'For any comment the AI makes, ask one question: which part of my own work is this based on? A comment that points at a specific stretch of text can be checked; a general one cannot — and what cannot be checked is what deserves a sceptical read.',
  'verify.modelNote':
    'This was graded by the model {model}. The app does not hide which model spoke: you cannot trace a bad result back to its source if the source is anonymous.',
  'method.quoteMatch': 'Matched against your text',
  'method.computed': 'Computed in code',
  'method.crossCheck': 'Cross-checked with the task data',
  'method.unverifiable': 'Not machine-checkable',

  'diagnose.title': 'Where do you think you went wrong?',
  'diagnose.hint':
    'Make a guess before you see the worked solution. A wrong guess costs you nothing — the app only needs to know whether you can see the mistake yourself.',
  'diagnose.rightTag':
    'You named your own mistake correctly. The difficulty is in carrying out the steps, not in spotting the problem — a few more questions of the same kind will do.',
  'diagnose.wrongTag':
    'The real mistake is the line highlighted in green. Naming it wrongly means you cannot yet see where it breaks, so reading the solution will not stop it happening again — the app will give you another question of the same kind to check.',

  ...CITY_EN,
};
