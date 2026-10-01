/**
 * Bổ sung từ điển cho các phương án của bộ câu KHÓ soạn tay (01/10/2026,
 * `seed/sat-rw/hard-*.json`) — mỗi phương án Từ nối / Từ trong ngữ cảnh đều
 * phải tra được (test ở `sat-rw-lexicon.test.ts`). Viết tay, câu ví dụ tự soạn.
 */
import { T, W, type LexEntry } from './sat-rw-lex-helpers';

export const MORE_C: Record<string, LexEntry> = {
  otherwise: T('Tương phản', 'nếu không thì', 'Signals what would happen if the condition just stated were not met.', ['or else', 'if not'], ['therefore'], 'Seal the samples tonight; otherwise, the moisture will ruin them by morning.'),
  second: T('Trình tự thời gian', 'thứ hai là', 'Introduces the next point in a numbered sequence of reasons or steps.', ['next', 'secondly'], ['finally'], 'First, the bridge is too narrow for buses. Second, its foundations were never designed for heavy trucks.'),
  resolve: W('verb', 'giải quyết, làm sáng tỏ', 'To settle a question or problem so that it is no longer in doubt.', ['settle', 'clarify'], ['complicate', 'prolong'], 'A single dated manuscript could resolve the long dispute over who wrote the poem.'),
  predate: W('verb', 'có trước (về thời gian)', 'To exist or happen earlier than something else.', ['precede', 'antedate'], ['postdate', 'follow'], 'The cave paintings predate the oldest known pottery in the region by several thousand years.'),
  outweigh: W('verb', 'lớn hơn, nặng ký hơn', 'To be greater in importance, value or effect than something else.', ['exceed', 'surpass'], ['fall short of'], 'For most patients, the benefits of the vaccine far outweigh its rare side effects.'),
  apprehended: W('verb', 'nắm bắt được; bắt giữ', 'Understood or grasped mentally; also, arrested.', ['grasped', 'perceived'], ['missed', 'overlooked'], 'The scale of the change was only apprehended by historians decades later.'),
  captivated: W('verb', 'làm say mê', 'Held someone’s attention completely by being charming or interesting.', ['enthralled', 'fascinated'], ['bored', 'repelled'], 'The puppet show captivated the children so completely that no one noticed the rain.'),
  halted: W('verb', 'dừng lại, chặn lại', 'Brought to a stop, or came to a stop.', ['stopped', 'suspended'], ['continued', 'resumed'], 'Construction was halted when workers uncovered the remains of a Roman wall.'),
  restrained: W('verb', 'kiềm chế, giữ lại', 'Held back or kept under control.', ['curbed', 'checked'], ['released', 'unleashed'], 'The committee restrained its criticism, wanting to keep the partner company on good terms.'),
  exposed: W('verb', 'phơi bày, để lộ', 'Revealed something hidden, or left it unprotected.', ['revealed', 'uncovered'], ['concealed', 'shielded'], 'The audit exposed years of missing payments that no one had noticed.'),
  curtailed: W('verb', 'cắt giảm, hạn chế', 'Reduced or limited, often before it was complete.', ['reduced', 'restricted'], ['extended', 'expanded'], 'The tour was curtailed after the lead singer lost her voice in the third city.'),
  anticipated: W('verb', 'đã lường trước', 'Expected or predicted, often preparing for it in advance.', ['foresaw', 'predicted'], ['overlooked'], 'The engineers had anticipated the flood and raised the generators onto a platform.'),
  underwrote: W('verb', 'bảo trợ, chịu chi phí', 'Agreed to pay for or financially guarantee something.', ['funded', 'financed'], ['opposed'], 'A local bank underwrote the festival, covering any losses if ticket sales fell short.'),
  certified: W('adjective', 'được chứng nhận', 'Officially confirmed as meeting a standard or having a qualification.', ['accredited', 'licensed'], ['unlicensed', 'unqualified'], 'Only certified electricians are allowed to work on the hospital’s backup system.'),
  limited: W('adjective', 'hạn chế, có giới hạn', 'Restricted in size, amount or extent.', ['restricted', 'finite'], ['unlimited', 'boundless'], 'Seating is limited, so guests must reserve a place in advance.'),
  competent: W('adjective', 'đủ năng lực', 'Having enough skill or knowledge to do something well.', ['capable', 'proficient'], ['incompetent', 'inept'], 'The new translator proved competent but slow, checking every term twice.'),
  eligible: W('adjective', 'đủ điều kiện', 'Meeting the requirements to do or receive something.', ['qualified', 'entitled'], ['ineligible', 'disqualified'], 'Students who complete the summer course are eligible for the advanced class.'),
  fortuitous: W('adjective', 'tình cờ, may mắn', 'Happening by chance, usually with a good result.', ['accidental', 'chance', 'lucky'], ['planned', 'deliberate'], 'The discovery was fortuitous: a technician left a dish uncovered over the weekend.'),
  adaptive: W('adjective', 'mang tính thích nghi', 'Helping an organism or system adjust to its conditions.', ['adjustive', 'beneficial'], ['maladaptive'], 'Thick fur is an adaptive trait for animals that live through long, freezing winters.'),
  sustained: W('adjective', 'kéo dài liên tục', 'Continuing for a long time without stopping or weakening.', ['prolonged', 'continuous'], ['brief', 'intermittent'], 'Only sustained funding over a decade allowed the team to track the birds across generations.'),
  abandons: W('verb', 'từ bỏ, bỏ rơi', 'Gives up completely, or leaves behind for good.', ['forsakes', 'relinquishes'], ['keeps', 'retains'], 'The novel’s hero abandons his plan to emigrate once his sister falls ill.'),
  deceives: W('verb', 'lừa dối', 'Makes someone believe something that is not true.', ['misleads', 'tricks'], ['informs'], 'The orchid deceives bees with a scent that mimics a female insect.'),
  undermines: W('verb', 'làm suy yếu', 'Gradually weakens something or makes it less effective.', ['weakens', 'erodes'], ['strengthens', 'reinforces'], 'A single faked result undermines trust in the entire study.'),
  reveals: W('verb', 'tiết lộ, cho thấy', 'Makes something known or visible that was hidden.', ['discloses', 'shows'], ['conceals', 'hides'], 'A closer look at the ledger reveals that the shop was losing money for years.'),
  fabricate: W('verb', 'bịa đặt; chế tạo', 'To invent something false in order to deceive, or to build something from parts.', ['invent', 'forge'], ['verify'], 'The reporter was fired after it emerged that she had begun to fabricate quotes.'),
  construe: W('verb', 'hiểu, diễn giải', 'To interpret the meaning of words or actions in a particular way.', ['interpret', 'read'], ['misconstrue'], 'Some readers construe the poem’s ending as hopeful; others see only loss.'),
  verify: W('verb', 'kiểm chứng', 'To check or prove that something is true or correct.', ['confirm', 'check'], ['fabricate'], 'Editors must verify every figure before the article goes to print.'),
  overlook: W('verb', 'bỏ sót, bỏ qua', 'To fail to notice something, or to choose to ignore it.', ['miss', 'ignore'], ['notice', 'heed'], 'It is easy to overlook small errors when a table runs to hundreds of rows.'),
  authorization: W('noun', 'sự cho phép chính thức', 'Official permission to do something.', ['permission', 'approval'], ['prohibition', 'ban'], 'No one may enter the archive without written authorization from the director.'),
  endorsement: W('noun', 'sự tán thành, ủng hộ công khai', 'Public support or approval of a person, product or idea.', ['backing', 'approval'], ['criticism', 'rejection'], 'The proposal gained momentum after an endorsement from the national teachers’ union.'),
  penalty: W('noun', 'hình phạt', 'A punishment for breaking a rule or law.', ['punishment', 'fine'], ['reward'], 'The penalty for returning a book late is a small daily fee.'),
  decree: W('noun', 'sắc lệnh', 'An official order issued by a ruler or government.', ['edict', 'order'], [], 'A royal decree in 1765 moved the market from the riverbank to the square.'),
  complementary: W('adjective', 'bổ sung cho nhau', 'Combining well so that each supplies what the other lacks.', ['supplementary', 'reciprocal'], ['conflicting', 'redundant'], 'The two researchers had complementary skills: one built the sensors, the other wrote the code.'),
  'self-sufficient': W('adjective', 'tự cung tự cấp', 'Able to supply one’s own needs without outside help.', ['independent', 'self-reliant'], ['dependent'], 'The island became self-sufficient in food only after it built its own irrigation system.'),
  restrain: W('verb', 'kiềm chế, ngăn lại', 'To hold back or keep under control.', ['check', 'curb'], ['release', 'unleash'], 'Strict budgets helped restrain spending during the first lean years.'),
  examine: W('verb', 'xem xét kỹ', 'To look at or study something carefully.', ['inspect', 'scrutinize'], ['ignore', 'overlook'], 'The panel will examine every application before choosing three finalists.'),
  confirm: W('verb', 'xác nhận', 'To show or state that something is definitely true.', ['verify', 'corroborate'], ['refute', 'deny'], 'A second laboratory was able to confirm the original measurements.'),
  tally: W('verb', 'đếm, kiểm đếm', 'To count up or record a total.', ['count', 'total'], [], 'Volunteers tally the birds they see at each station every morning.'),
};

/** Chủ đề từ vựng (theo chỉ số `VERBAL_THEMES_BASE`) chứa từng từ mới ở trên. */
export const THEME_ADDITIONS: Record<number, string[]> = {
  1: ['otherwise'],
  2: ['second', 'predate'],
  3: ['resolve', 'confirm', 'verify', 'certified'],
  4: ['fabricate', 'deceives', 'reveals', 'exposed', 'construe'],
  5: ['examine', 'overlook', 'tally', 'anticipated', 'sustained'],
  6: ['apprehended'],
  7: ['outweigh', 'undermines', 'restrain', 'restrained', 'curtailed', 'halted', 'limited', 'adaptive', 'penalty'],
  8: ['fortuitous', 'complementary'],
  9: ['captivated', 'competent', 'eligible', 'self-sufficient', 'abandons', 'authorization', 'endorsement', 'decree', 'underwrote'],
};
