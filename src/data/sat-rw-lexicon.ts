/**
 * Từ điển nhỏ cho các phương án của SAT Verbal — hiện dưới lời giải sau khi
 * người học chọn đáp án: định nghĩa, nghĩa tiếng Việt, từ đồng nghĩa, từ trái
 * nghĩa và một câu ví dụ.
 *
 * VIẾT TAY, KHÔNG SINH BẰNG AI: mỗi mục là dữ liệu cố định trong mã, soát được
 * bằng mắt và bằng test (`sat-rw-lexicon.test.ts` kiểm mọi phương án của hai
 * dạng "Từ nối" và "Từ trong ngữ cảnh" đều có mục ở đây). Câu ví dụ tự soạn,
 * không chép từ đề thi hay từ điển nào.
 *
 * Với từ nối, "trái nghĩa" là từ nối mang QUAN HỆ LOGIC NGƯỢC LẠI (kết quả ↔
 * tương phản…) — đúng thứ người học cần phân biệt khi làm dạng Transitions.
 */

import { T, W, type LexEntry } from './sat-rw-lex-helpers';
import { MORE as MORE_A } from './sat-rw-lexicon-more-a';
import { MORE as MORE_B } from './sat-rw-lexicon-more-b';
import { MORE_C } from './sat-rw-lexicon-more-c';

export type { LexEntry };

/** Bộ gốc (trước 30/09/2026). */
export const SAT_RW_LEXICON_BASE: Record<string, LexEntry> = {
  // ------------------------------------------------------------ từ nối
  'by contrast': T('Tương phản', 'ngược lại, trái lại', 'Used to show that the next idea is very different from the one before.', ['in contrast', 'on the other hand', 'conversely'], ['similarly', 'likewise'], 'City rents rose sharply last year. By contrast, rural rents barely changed.'),
  consequently: T('Kết quả', 'do đó, vì vậy', 'As a result of what has just been said.', ['as a result', 'therefore', 'thus'], ['however', 'nevertheless'], 'The bridge was closed for repairs; consequently, traffic moved to the old road.'),
  'for example': T('Ví dụ', 'ví dụ như', 'Used to introduce a specific case that illustrates a general point.', ['for instance', 'to illustrate'], ['in general', 'overall'], 'Some birds travel huge distances. For example, the Arctic tern flies from pole to pole.'),
  'that is': T('Diễn giải lại', 'tức là, nghĩa là', 'Used to explain or restate the previous idea more exactly.', ['in other words', 'namely', 'i.e.'], [], 'The plant is deciduous; that is, it loses its leaves every autumn.'),
  subsequently: T('Trình tự thời gian', 'sau đó, về sau', 'At a later time; afterwards.', ['later', 'afterward', 'then'], ['previously', 'earlier'], 'She trained as a nurse and subsequently became a hospital director.'),
  nevertheless: T('Nhượng bộ', 'tuy vậy, dù vậy', 'Despite what has just been said; still.', ['even so', 'nonetheless', 'however', 'on the other hand'], ['therefore', 'consequently'], 'The test was difficult. Nevertheless, most students passed.'),
  'as a result': T('Kết quả', 'kết quả là', 'Because of the situation or action just described.', ['consequently', 'therefore', 'thus'], ['nevertheless', 'even so'], 'The river flooded for weeks. As a result, the harvest was delayed.'),
  'even so': T('Nhượng bộ', 'dù vậy, mặc dù thế', 'Although that is true; despite that.', ['nevertheless', 'nonetheless', 'still', 'however', 'on the other hand'], ['therefore', 'as a result'], 'The data were incomplete. Even so, the pattern was hard to ignore.'),
  previously: T('Trình tự thời gian', 'trước đó, trước đây', 'At an earlier time; before the time being discussed.', ['earlier', 'formerly', 'before'], ['subsequently', 'afterward'], 'The museum now opens on Mondays; previously, it was closed that day.'),
  meanwhile: T('Đồng thời / đối chiếu', 'trong khi đó', 'At the same time, or used to compare two situations happening together.', ['at the same time', 'simultaneously'], ['afterward', 'previously'], 'All morning, one team collected new samples in the field. Meanwhile, during those same hours, the other team analyzed yesterday’s samples in the lab.'),
  'in addition': T('Bổ sung', 'ngoài ra, thêm vào đó', 'Used to add another point that supports the previous one.', ['moreover', 'furthermore', 'also'], ['however', 'by contrast'], 'The new bus line is cheaper. In addition, it runs later at night.'),
  'in other words': T('Diễn giải lại', 'nói cách khác', 'Used to express the same idea in a simpler or clearer way.', ['that is', 'put differently', 'namely'], [], 'The species is nocturnal; in other words, it is active at night.'),
  however: T('Tương phản', 'tuy nhiên', 'Used to introduce a statement that contrasts with the previous one.', ['but', 'nevertheless', 'by contrast', 'even so'], ['therefore', 'moreover'], 'The plan looked simple on paper. However, it proved costly to carry out.'),
  'for instance': T('Ví dụ', 'chẳng hạn', 'Used to give a particular example of a general statement.', ['for example', 'such as', 'to illustrate'], ['in general', 'overall'], 'Many fruits are rich in vitamin C. For instance, one orange provides a full day’s need.'),
  therefore: T('Kết quả', 'vì thế, do đó', 'For that reason; as a logical consequence.', ['thus', 'consequently', 'hence'], ['however', 'nevertheless'], 'All the samples tested negative; therefore, the water was declared safe.'),
  thus: T('Kết quả', 'như vậy, do đó', 'As a result of this; in this way.', ['therefore', 'hence', 'consequently'], ['however', 'even so'], 'The glacier is melting faster, thus raising the level of the lake below.'),
  moreover: T('Bổ sung', 'hơn nữa', 'Used to add information that strengthens the previous point.', ['furthermore', 'in addition', 'besides'], ['however', 'by contrast'], 'The design is elegant. Moreover, it uses less material than the old one.'),
  furthermore: T('Bổ sung', 'hơn thế nữa', 'In addition to what has been said; used to add a stronger point.', ['moreover', 'in addition', 'additionally'], ['however', 'nevertheless'], 'The report was late. Furthermore, several key figures were missing.'),

  // ------------------------------------------------------------ từ trong ngữ cảnh
  irrelevant: W('adjective', 'không liên quan', 'Not connected with or important to the matter being discussed.', ['unrelated', 'immaterial', 'beside the point'], ['relevant', 'pertinent'], 'The judge ruled that the witness’s hobbies were irrelevant to the case.'),
  permanent: W('adjective', 'lâu dài, vĩnh viễn', 'Lasting or intended to last forever, without change.', ['lasting', 'enduring', 'fixed'], ['temporary', 'provisional'], 'After years of short contracts, she finally found a permanent job.'),
  obvious: W('adjective', 'rõ ràng, hiển nhiên', 'Easy to see or understand.', ['evident', 'clear', 'apparent'], ['obscure', 'subtle', 'hidden'], 'The solution seemed obvious once someone pointed it out.'),
  provisional: W('adjective', 'tạm thời, chưa chính thức', 'Arranged for now and likely to be changed later.', ['temporary', 'tentative', 'interim'], ['permanent', 'final', 'settled'], 'The committee released a provisional schedule until the venue was confirmed.'),
  recent: W('adjective', 'gần đây', 'Having happened or begun a short time ago.', ['new', 'latest', 'current'], ['old', 'past', 'ancient'], 'A recent survey found that more teenagers now read on their phones.'),
  ubiquitous: W('adjective', 'có mặt khắp nơi', 'Found everywhere; extremely common.', ['omnipresent', 'pervasive', 'widespread'], ['rare', 'scarce'], 'Smartphones have become ubiquitous in classrooms.'),
  seasonal: W('adjective', 'theo mùa', 'Happening or needed only during a particular time of year.', ['periodic', 'cyclical'], ['year-round', 'constant'], 'The resort hires seasonal workers every summer.'),
  harmless: W('adjective', 'vô hại', 'Not able or likely to cause damage or injury.', ['innocuous', 'safe', 'benign'], ['harmful', 'dangerous'], 'The snake looks frightening but is completely harmless.'),
  experimental: W('adjective', 'thử nghiệm', 'Based on new ideas and still being tested.', ['trial', 'pilot', 'exploratory'], ['established', 'proven'], 'The hospital is testing an experimental treatment for the disease.'),
  meticulous: W('adjective', 'tỉ mỉ, cẩn thận từng chi tiết', 'Showing great attention to detail; very careful.', ['thorough', 'careful', 'painstaking'], ['careless', 'cursory', 'sloppy'], 'Her meticulous notes allowed others to repeat the experiment exactly.'),
  expensive: W('adjective', 'đắt tiền', 'Costing a lot of money.', ['costly', 'pricey', 'high-priced'], ['cheap', 'inexpensive'], 'Repairing the old engine turned out to be more expensive than buying a new one.'),
  controversial: W('adjective', 'gây tranh cãi', 'Causing a lot of public disagreement.', ['contentious', 'disputed', 'divisive'], ['undisputed', 'uncontroversial'], 'The new tax was controversial, and protests followed.'),
  fabricated: W('adjective', 'bịa đặt, ngụy tạo', 'Invented in order to deceive; made up.', ['invented', 'fake', 'falsified'], ['genuine', 'authentic', 'accurate'], 'The journalist was fired for publishing fabricated quotes.'),
  tenuous: W('adjective', 'mong manh, lỏng lẻo', 'Very weak or slight; not firmly supported.', ['weak', 'flimsy', 'shaky'], ['strong', 'solid', 'firm'], 'With only one blurry photo as proof, the link between the two events is tenuous at best.'),
  undisputed: W('adjective', 'không thể bàn cãi', 'Accepted by everyone as true or valid.', ['unquestioned', 'accepted', 'indisputable'], ['controversial', 'contested', 'disputed'], 'She is the undisputed expert on the region’s history.'),
  uneven: W('adjective', 'không đều', 'Not level, smooth, or equal in quality or amount.', ['irregular', 'inconsistent', 'unequal'], ['even', 'uniform', 'consistent'], 'Progress across the schools was uneven: some improved, others fell behind.'),
  brief: W('adjective', 'ngắn gọn, ngắn ngủi', 'Lasting only a short time or using few words.', ['short', 'concise', 'fleeting'], ['long', 'lengthy', 'extended'], 'After a brief pause, the speaker continued.'),
  obscure: W('adjective', 'ít người biết, khó hiểu', 'Not well known, or not clearly expressed.', ['unknown', 'little-known', 'unclear'], ['famous', 'well-known', 'obvious'], 'The poem was written by an obscure author from the 1800s.'),
  prolific: W('adjective', 'sáng tác/sản xuất nhiều', 'Producing a large amount of work or results.', ['productive', 'fruitful', 'fertile'], ['unproductive', 'sparse'], 'He was a prolific writer, publishing more than sixty novels.'),
  unanimous: W('adjective', 'nhất trí hoàn toàn', 'Agreed on by everyone involved.', ['united', 'undivided', 'in agreement'], ['divided', 'split'], 'All nine members voted yes, so the board reached a unanimous decision to approve the budget.'),
  illegal: W('adjective', 'bất hợp pháp', 'Not allowed by law.', ['unlawful', 'illicit', 'prohibited'], ['legal', 'lawful', 'permitted'], 'Fishing in the protected bay is illegal.'),
  arbitrary: W('adjective', 'tùy tiện, không có lý do', 'Based on chance or personal choice rather than reason.', ['random', 'unreasoned', 'capricious'], ['reasoned', 'systematic', 'principled'], 'The cutoff date seemed arbitrary, since no one could explain it.'),
  fraudulent: W('adjective', 'gian lận, lừa đảo', 'Intended to deceive people, often for money.', ['deceitful', 'dishonest', 'fake'], ['honest', 'legitimate', 'genuine'], 'The bank blocked several fraudulent transactions on her card.'),
  thorough: W('adjective', 'kỹ lưỡng, triệt để', 'Complete and careful, covering every detail.', ['meticulous', 'exhaustive', 'comprehensive'], ['cursory', 'superficial', 'careless'], 'The inspector spent two full days on a thorough check of the building, testing every pipe and wire.'),
  cursory: W('adjective', 'qua loa, sơ sài', 'Done quickly and without attention to detail.', ['hasty', 'superficial', 'perfunctory'], ['thorough', 'meticulous', 'careful'], 'A cursory glance at the report missed the key error.'),
  illegible: W('adjective', 'không đọc được (chữ viết)', 'Impossible or very hard to read because it is unclear.', ['unreadable', 'indecipherable'], ['legible', 'readable', 'clear'], 'The doctor’s handwriting was nearly illegible.'),
  innocuous: W('adjective', 'vô hại, không gây phản cảm', 'Not harmful or offensive.', ['harmless', 'inoffensive', 'benign'], ['harmful', 'offensive', 'dangerous'], 'What seemed an innocuous question upset the whole room.'),
  urgent: W('adjective', 'khẩn cấp', 'Needing immediate attention or action.', ['pressing', 'critical', 'immediate'], ['unimportant', 'minor', 'deferrable'], 'The patient needed urgent surgery.'),
  contentious: W('adjective', 'dễ gây bất đồng, gay gắt', 'Likely to cause disagreement or argument.', ['controversial', 'disputed', 'divisive'], ['undisputed', 'settled', 'agreed'], 'Families still argued bitterly at every meeting; land ownership remained a contentious issue in the village.'),
  settled: W('adjective', 'đã được giải quyết, đã chốt', 'Decided or resolved; no longer in doubt.', ['decided', 'resolved', 'established'], ['unsettled', 'contentious', 'open'], 'Once the matter was settled, the two sides signed the agreement.'),
  technical: W('adjective', 'thuộc chuyên môn, kỹ thuật', 'Relating to specialized knowledge of a subject or machine.', ['specialized', 'expert', 'scientific'], ['general', 'everyday', 'nontechnical'], 'The manual was too technical for most beginners.'),
  unfinished: W('adjective', 'chưa hoàn thành', 'Not yet completed.', ['incomplete', 'partial', 'in progress'], ['finished', 'complete'], 'The painter died leaving several unfinished canvases.'),
  inaudible: W('adjective', 'không nghe được', 'Too quiet to be heard.', ['silent', 'faint', 'muted'], ['audible', 'loud'], 'His reply was inaudible over the noise of the crowd.'),
  derivative: W('adjective', 'bắt chước, thiếu sáng tạo', 'Copied from or based on other work; not original.', ['imitative', 'unoriginal', 'borrowed'], ['original', 'innovative'], 'Critics called the film derivative of earlier horror classics.'),
  original: W('adjective', 'độc đáo, nguyên bản', 'New and different; not copied.', ['novel', 'innovative', 'fresh'], ['derivative', 'imitative', 'copied'], 'Her design was completely original.'),
  audible: W('adjective', 'nghe được', 'Loud enough to be heard.', ['perceptible', 'hearable', 'clear'], ['inaudible', 'silent'], 'There was an audible sigh of relief when the results were read.'),
  mistaken: W('adjective', 'sai lầm, nhầm lẫn', 'Wrong in one’s opinion or judgment.', ['wrong', 'incorrect', 'erroneous'], ['correct', 'accurate', 'right'], 'The early theory turned out to be mistaken.'),
  reticent: W('adjective', 'kín đáo, ít nói về bản thân', 'Not willing to reveal one’s thoughts or feelings.', ['reserved', 'taciturn', 'restrained'], ['candid', 'outspoken', 'forthcoming'], 'The usually reticent author spoke openly about her childhood.'),
  uniform: W('adjective', 'đồng đều, như nhau', 'The same in every part or case; not varying.', ['consistent', 'even', 'identical'], ['uneven', 'varied', 'irregular'], 'The bricks were of uniform size and colour.'),
  invasive: W('adjective', 'xâm lấn', 'Spreading harmfully into new areas, or entering the body.', ['intrusive', 'encroaching', 'aggressive'], ['native', 'non-invasive', 'contained'], 'An invasive plant species has taken over the riverbank.'),
  fragile: W('adjective', 'mong manh, dễ vỡ', 'Easily broken or damaged.', ['delicate', 'breakable', 'frail'], ['sturdy', 'robust', 'resilient'], 'Coral reefs are fragile ecosystems: a small rise in water temperature can break them down.'),
  resilient: W('adjective', 'kiên cường, phục hồi nhanh', 'Able to recover quickly from difficulty or damage.', ['tough', 'hardy', 'robust'], ['fragile', 'vulnerable', 'weak'], 'The forest proved resilient and regrew within a decade.'),
  inevitable: W('adjective', 'không thể tránh khỏi', 'Certain to happen; unavoidable.', ['unavoidable', 'certain', 'inescapable'], ['avoidable', 'uncertain', 'preventable'], 'Some delay was inevitable given the bad weather.'),
  invisible: W('adjective', 'vô hình, không nhìn thấy', 'Impossible to see.', ['unseen', 'hidden', 'imperceptible'], ['visible', 'conspicuous', 'obvious'], 'Ultraviolet light is invisible to the human eye.'),
  intentional: W('adjective', 'cố ý, có chủ đích', 'Done on purpose.', ['deliberate', 'planned', 'calculated'], ['accidental', 'unintentional'], 'The gap in the wall was intentional, to let air flow through.'),
  hypothetical: W('adjective', 'giả định', 'Based on a possible situation rather than a real one.', ['theoretical', 'supposed', 'imagined'], ['actual', 'real', 'factual'], 'The teacher posed a hypothetical question about life on Mars.'),
  predictable: W('adjective', 'có thể đoán trước', 'Behaving or happening in a way that is expected.', ['foreseeable', 'expected', 'routine'], ['unpredictable', 'surprising', 'unprecedented'], 'The ending of the story was entirely predictable.'),
  insignificant: W('adjective', 'không đáng kể', 'Too small or unimportant to matter.', ['negligible', 'minor', 'trivial'], ['significant', 'important', 'major'], 'The difference between the two results was statistically insignificant.'),
  unprecedented: W('adjective', 'chưa từng có', 'Never done or known before.', ['unparalleled', 'new', 'unheard-of'], ['common', 'routine', 'predictable'], 'The city faced an unprecedented heat wave.'),
  austere: W('adjective', 'khắc khổ, giản dị, mộc mạc', 'Severe or very plain, without comfort or decoration.', ['plain', 'stark', 'spartan'], ['ornate', 'lavish', 'luxurious'], 'The monks lived in austere rooms with only a bed and a desk.'),
  temporary: W('adjective', 'tạm thời', 'Lasting for only a limited time.', ['provisional', 'short-term', 'interim'], ['permanent', 'lasting'], 'The school moved into a temporary building during the repairs.'),
  cluttered: W('adjective', 'bừa bộn, lộn xộn', 'Filled with too many things in an untidy way.', ['messy', 'untidy', 'crowded'], ['tidy', 'neat', 'orderly'], 'His cluttered desk made it hard to find anything.'),
  amateur: W('adjective', 'nghiệp dư', 'Done for pleasure rather than as a paid job; lacking professional skill.', ['nonprofessional', 'hobbyist', 'unskilled'], ['professional', 'expert'], 'An amateur astronomer discovered the comet.'),
  regional: W('adjective', 'thuộc vùng, khu vực', 'Relating to a particular area of a country or the world.', ['local', 'provincial', 'territorial'], ['national', 'global', 'universal'], 'Each regional office handles its own hiring.'),
  monotonous: W('adjective', 'đơn điệu, nhàm chán', 'Dull because it never changes.', ['repetitive', 'tedious', 'dull'], ['varied', 'lively', 'eclectic'], 'The work on the assembly line was monotonous.'),
  eclectic: W('adjective', 'đa dạng, chiết trung', 'Drawing from many different sources or styles.', ['diverse', 'varied', 'wide-ranging'], ['uniform', 'narrow', 'monotonous'], 'The café plays an eclectic mix of jazz, folk and pop.'),
  fictional: W('adjective', 'hư cấu', 'Invented for a story; not real.', ['imaginary', 'invented', 'made-up'], ['real', 'factual', 'historical'], 'The town in the novel is fictional, though it resembles many real ones.'),
  candid: W('adjective', 'thẳng thắn, bộc trực', 'Honest and direct, even about difficult things.', ['frank', 'open', 'forthright'], ['reticent', 'guarded', 'evasive'], 'In a candid interview, the coach admitted his mistakes.'),
  indifferent: W('adjective', 'thờ ơ, không quan tâm', 'Having no interest or concern.', ['unconcerned', 'apathetic', 'detached'], ['interested', 'concerned', 'passionate'], 'Most voters seemed indifferent to the new policy.'),
  uninformed: W('adjective', 'thiếu hiểu biết, không được thông tin', 'Not having enough knowledge or information.', ['ignorant', 'unaware', 'ill-informed'], ['informed', 'knowledgeable', 'aware'], 'The article was written by an uninformed critic who had never actually visited the museum.'),
  dishonest: W('adjective', 'không trung thực', 'Willing to lie, cheat or deceive.', ['deceitful', 'fraudulent', 'untruthful'], ['honest', 'truthful', 'candid'], 'The dishonest seller hid the damage from the buyer.'),
  ambivalent: W('adjective', 'phân vân, có cảm xúc trái chiều', 'Having mixed feelings about something.', ['uncertain', 'torn', 'conflicted'], ['certain', 'decided', 'resolute'], 'She felt ambivalent about moving abroad: excited by the new job but sad to leave her family.'),
  immediate: W('adjective', 'ngay lập tức', 'Happening or done at once.', ['instant', 'prompt', 'direct'], ['delayed', 'gradual', 'eventual'], 'The medicine had an immediate effect.'),
  theoretical: W('adjective', 'thuộc lý thuyết', 'Based on ideas and principles rather than practice or experience.', ['abstract', 'hypothetical', 'conceptual'], ['practical', 'applied', 'empirical'], 'The course moves from theoretical physics to lab work.'),
  accidental: W('adjective', 'tình cờ, ngẫu nhiên', 'Happening by chance, not on purpose.', ['unintentional', 'chance', 'inadvertent'], ['intentional', 'deliberate', 'planned'], 'Penicillin was an accidental discovery.'),
  incremental: W('adjective', 'tăng dần từng bước', 'Happening in small steps over time.', ['gradual', 'step-by-step', 'progressive'], ['sudden', 'abrupt', 'dramatic'], 'The changes were incremental, not revolutionary.'),
  motionless: W('adjective', 'bất động', 'Not moving at all.', ['still', 'stationary', 'static'], ['moving', 'active', 'mobile'], 'The cat sat motionless, watching the bird.'),
  conspicuous: W('adjective', 'dễ thấy, nổi bật', 'Very easy to notice.', ['noticeable', 'prominent', 'obvious'], ['inconspicuous', 'camouflaged', 'hidden'], 'He wore a conspicuous red hat so his friends could find him.'),
  camouflaged: W('adjective', 'được ngụy trang', 'Hidden by colours or patterns that match the surroundings.', ['disguised', 'concealed', 'hidden'], ['conspicuous', 'visible', 'exposed'], 'The moth is camouflaged against the tree bark.'),
  silent: W('adjective', 'im lặng', 'Making no sound, or not speaking.', ['quiet', 'noiseless', 'mute'], ['noisy', 'loud', 'audible'], 'The hall fell silent when the speaker stood up.'),
  useful: W('adjective', 'hữu ích', 'Helpful for doing or achieving something.', ['helpful', 'practical', 'valuable'], ['useless', 'unhelpful'], 'A dictionary is useful when you read old texts.'),
  static: W('adjective', 'tĩnh, không thay đổi', 'Not moving or changing.', ['unchanging', 'stationary', 'fixed'], ['dynamic', 'changing', 'fluid'], 'The population of the town remained static for decades.'),
  crowded: W('adjective', 'đông đúc', 'Full of people or things.', ['packed', 'congested', 'crammed'], ['empty', 'deserted', 'sparse'], 'The crowded train had no free seats.'),
  accurate: W('adjective', 'chính xác', 'Correct in every detail; free from error.', ['correct', 'precise', 'exact'], ['inaccurate', 'mistaken', 'wrong'], 'The map was surprisingly accurate for its time.'),
  confidential: W('adjective', 'bí mật, mật', 'Meant to be kept private.', ['private', 'secret', 'classified'], ['public', 'open', 'published'], 'Patient records are confidential.'),
  statistical: W('adjective', 'thuộc thống kê', 'Relating to numbers collected and analysed to show patterns.', ['numerical', 'quantitative', 'data-based', 'empirical'], ['anecdotal', 'qualitative'], 'The claim was supported by strong statistical evidence: surveys of 5,000 households, analyzed with standard tests, all showed the same pattern.'),
  anecdotal: W('adjective', 'dựa trên giai thoại, chuyện kể', 'Based on personal stories rather than careful research.', ['informal', 'unscientific', 'hearsay'], ['statistical', 'empirical', 'scientific'], 'The evidence that the diet works is mostly anecdotal, coming from a few customers’ personal stories rather than from any study.'),
  preliminary: W('adjective', 'sơ bộ, ban đầu', 'Coming before the main part; early and not final.', ['initial', 'early', 'tentative'], ['final', 'definitive', 'conclusive'], 'Preliminary results suggest the vaccine is effective.'),
  selective: W('adjective', 'có chọn lọc', 'Choosing carefully, or affecting only some things.', ['choosy', 'discriminating', 'particular'], ['exhaustive', 'indiscriminate', 'comprehensive'], 'The university is highly selective in its admissions.'),
  exhaustive: W('adjective', 'đầy đủ, toàn diện', 'Including every possible part or detail.', ['comprehensive', 'thorough', 'complete'], ['selective', 'partial', 'cursory'], 'The team carried out an exhaustive search of the archives.'),
  inaccurate: W('adjective', 'không chính xác', 'Not correct or exact.', ['incorrect', 'wrong', 'mistaken'], ['accurate', 'correct', 'precise'], 'The early figures were inaccurate and had to be revised.'),
  'derived from': W('phrase', 'bắt nguồn từ', 'Taken or developed from a particular source.', ['based on', 'drawn from', 'originating in'], ['independent of', 'unrelated to'], 'Many English words are derived from Latin.'),
  'indifferent to': W('phrase', 'thờ ơ với', 'Not interested in or affected by something.', ['unconcerned about', 'uninterested in'], ['concerned about', 'passionate about'], 'The cat seemed indifferent to the noise outside: it kept sleeping and did not even lift its head.'),
  'consistent with': W('phrase', 'phù hợp với, khớp với', 'In agreement with; not contradicting.', ['in line with', 'compatible with', 'in keeping with'], ['at odds with', 'inconsistent with', 'contrary to'], 'The new data are consistent with the earlier study, which also found that the lake warmed by about one degree.'),
  'at odds with': W('phrase', 'mâu thuẫn với', 'In disagreement or conflict with.', ['in conflict with', 'inconsistent with', 'contrary to'], ['consistent with', 'in line with'], 'His account of events is at odds with the video evidence.'),
};

/**
 * Kho đầy đủ: bộ gốc + bổ sung 30/09/2026 (mỗi chủ đề từ vựng SAT Verbal ≥ 30
 * từ): `more-a` từ nối + dữ liệu/lập luận, `more-b` các chủ đề tính từ.
 */
export const SAT_RW_LEXICON: Record<string, LexEntry> = { ...SAT_RW_LEXICON_BASE, ...MORE_A, ...MORE_B, ...MORE_C };

/** Mục từ điển cho một phương án, không phân biệt hoa thường và dấu câu cuối. */
export function lookupLex(option: string): LexEntry | undefined {
  return SAT_RW_LEXICON[option.trim().toLowerCase().replace(/[.,;:]+$/, '')];
}
