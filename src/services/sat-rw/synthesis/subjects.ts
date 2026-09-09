/**
 * Chủ đề cho câu Rhetorical Synthesis — dạng đang THIẾU HOÀN TOÀN trong kho.
 *
 * Expression of Ideas trên đề thật có hai dạng: Từ nối và Rhetorical Synthesis.
 * Kho hiện có 48 câu, tất cả đều là Từ nối. Nới bảng từ nối chỉ làm dày thêm cái
 * đã có; dựng dạng này mới lấp đúng chỗ trống của blueprint.
 *
 * VÌ SAO DẠNG NÀY SINH ĐƯỢC BẰNG LUẬT. Đề cho một tập ghi chú và một MỤC ĐÍCH,
 * hỏi câu nào phục vụ mục đích ấy. Gắn nhãn cho từng ghi chú, gắn nhãn cho mục
 * đích, rồi khớp — đáp án là kết quả một phép so nhãn, không phải một lời khai.
 * Cùng cơ chế `evaluate` của Command of Evidence, áp lên nhãn thay vì lên số.
 *
 * VÀ NHIỄU ĐẮT NHẤT TỰ NHIÊN CÓ SẴN: mọi ghi chú đều ĐÚNG (chúng nằm ngay trong
 * đề), nên một phương án sai vẫn là một sự thật. Người học kiểm tính đúng rồi
 * dừng lại là mắc bẫy — đúng chỗ đề thật hay đánh, và đúng cái bẫy
 * `accurate_but_irrelevant` đã dựng ở bộ Command of Evidence.
 *
 * MỖI GHI CHÚ ĐÚNG MỘT NHÃN, và đây là luật học được từ một lần hỏng. Bản đầu
 * gắn hai ba nhãn cho một ghi chú cho "giàu", kết quả là 24 mục đích khai ra chỉ
 * dựng được 6 câu: hầu hết mục đích khớp hai ghi chú, mà hai ghi chú cùng khớp
 * thì câu có hai đáp án đúng. Một nhãn một ghi chú thì mỗi mục đích trỏ vào đúng
 * một chỗ, và số câu dựng được bằng đúng số mục đích khai ra.
 *
 * SỰ KIỆN LÀ BỊA. Bịa là chủ ý: người học không được phép biết trước từ kiến
 * thức nền, nếu không câu ấy quay lại đúng lỗi 32% đã đo.
 */

/** Mục đích mà một ghi chú phục vụ. Trong một chủ đề, mỗi nhãn chỉ xuất hiện một lần. */
export type SynthesisTag =
  | 'historical'
  | 'physical'
  | 'current-status'
  | 'purpose'
  | 'people'
  | 'comparison';

export type SynthesisFact = {
  /** Viết sẵn thành câu hoàn chỉnh — phương án chính là câu này. */
  text: string;
  tags: readonly SynthesisTag[];
};

export type SynthesisSubject = {
  slug: string;
  /** Người học đang tìm hiểu gì. */
  topic: string;
  facts: readonly SynthesisFact[];
  /** Mỗi mục đích sinh ra một câu hỏi. */
  goals: readonly { tag: SynthesisTag; text: string }[];
  /** Câu bịa hẳn, không có trong ghi chú — nguyên liệu nhiễu `not_in_notes`. */
  fabricated: readonly string[];
};

export const SUBJECTS: readonly SynthesisSubject[] = Object.freeze([
  {
    slug: 'hollow-bridge',
    topic: 'the Hollow Bridge, an iron bridge in northern England',
    facts: [
      { text: 'The Hollow Bridge was completed in 1887.', tags: ['historical'] },
      { text: 'It was the first iron bridge built in the region.', tags: ['comparison'] },
      { text: 'The bridge spans 240 metres across the Cale valley.', tags: ['physical'] },
      { text: 'It carried a single railway track and a footpath.', tags: ['purpose'] },
      { text: 'The bridge closed to all traffic in 2004.', tags: ['current-status'] },
      { text: 'A local trust of forty volunteers now maintains it.', tags: ['people'] },
    ],
    goals: [
      { tag: 'historical', text: 'specify when the bridge was built' },
      { tag: 'comparison', text: 'emphasise how unusual the bridge was at the time' },
      { tag: 'physical', text: 'describe the physical scale of the bridge' },
      { tag: 'purpose', text: 'explain what the bridge was built to carry' },
      { tag: 'current-status', text: 'explain what happened to the bridge recently' },
      { tag: 'people', text: 'highlight who looks after the bridge now' },
    ],
    fabricated: [
      'The bridge was designed by an engineer who had never built in iron before.',
      'Local councils have twice voted to demolish the structure.',
    ],
  },
  {
    slug: 'kestrel-survey',
    topic: 'a long-running survey of kestrels on the Marrin uplands',
    facts: [
      { text: 'The survey has been running continuously since 1962.', tags: ['historical'] },
      { text: 'It was the first bird survey in Britain to use standardised transects.', tags: ['comparison'] },
      { text: 'Volunteers walk fixed routes totalling 180 kilometres each spring.', tags: ['physical'] },
      { text: 'Its data are used by planning authorities assessing new developments.', tags: ['purpose'] },
      { text: 'The survey now records fourteen species alongside kestrels.', tags: ['current-status'] },
      { text: 'More than 900 people have contributed at least one season.', tags: ['people'] },
    ],
    goals: [
      { tag: 'historical', text: 'emphasise how long the survey has been running' },
      { tag: 'comparison', text: 'emphasise what was new about the survey method' },
      { tag: 'physical', text: 'describe the fieldwork the survey involves' },
      { tag: 'purpose', text: 'explain what the survey data are used for' },
      { tag: 'current-status', text: 'describe what the survey covers today' },
      { tag: 'people', text: 'highlight the scale of volunteer involvement' },
    ],
    fabricated: [
      'Kestrel numbers on the uplands have fallen every year since the survey began.',
      'The survey was suspended for a decade during the 1980s.',
    ],
  },
  {
    slug: 'tevren-canal',
    topic: 'the Tevren Canal, an irrigation project in Central Asia',
    facts: [
      { text: 'Construction of the Tevren Canal began in 1954.', tags: ['historical'] },
      { text: 'The canal runs for 310 kilometres, mostly unlined.', tags: ['physical'] },
      { text: 'It was built to bring water to cotton fields in the Tevren basin.', tags: ['purpose'] },
      { text: 'Roughly a third of its water is now lost to seepage.', tags: ['current-status'] },
      { text: 'Engineers have proposed lining the canal since the 1970s.', tags: ['people'] },
      { text: 'Cotton yields in the basin tripled within a decade of its opening.', tags: ['comparison'] },
    ],
    goals: [
      { tag: 'purpose', text: 'explain why the canal was built' },
      { tag: 'physical', text: 'describe the canal itself' },
      { tag: 'comparison', text: 'show the canal’s effect on farming in the basin' },
      { tag: 'current-status', text: 'describe a problem the canal has today' },
      { tag: 'people', text: 'describe what engineers have recommended' },
      { tag: 'historical', text: 'specify when work on the canal started' },
    ],
    fabricated: [
      'The canal has been fully lined with concrete since 1998.',
      'Cotton is no longer grown anywhere in the Tevren basin.',
    ],
  },
  {
    slug: 'khipu-study',
    topic: 'khipu, the knotted cords used for record-keeping in the Andes',
    facts: [
      { text: 'Khipu were used for administrative records across the Inca state.', tags: ['purpose'] },
      { text: 'A single khipu can carry several hundred knotted cords.', tags: ['physical'] },
      { text: 'Roughly 1,400 khipu survive in museum collections today.', tags: ['current-status'] },
      { text: 'The oldest known khipu predate the Inca state by centuries.', tags: ['historical'] },
      { text: 'Colour and ply direction carry meaning that plain knots do not.', tags: ['comparison'] },
      { text: 'The Harvard Khipu Database was assembled by Gary Urton and colleagues.', tags: ['people'] },
    ],
    goals: [
      { tag: 'physical', text: 'describe how a khipu is constructed' },
      { tag: 'purpose', text: 'explain what khipu were used for' },
      { tag: 'current-status', text: 'say how many khipu remain' },
      { tag: 'historical', text: 'emphasise how far back the practice goes' },
      { tag: 'comparison', text: 'explain what makes khipu harder to read than a simple tally' },
      { tag: 'people', text: 'credit the researchers behind the main database' },
    ],
    fabricated: [
      'Khipu were used exclusively for religious ceremonies.',
      'Every surviving khipu has now been fully decoded.',
    ],
  },
  {
    slug: 'peat-archive',
    topic: 'peat cores taken from the Bruannan bog as a climate archive',
    facts: [
      { text: 'The Bruannan cores record 8,000 years of local conditions.', tags: ['historical'] },
      { text: 'Each core is 12 metres long and about 8 centimetres across.', tags: ['physical'] },
      { text: 'Pollen grains preserved in the peat identify past vegetation.', tags: ['purpose'] },
      { text: 'The cores are stored at 4 °C in a university archive.', tags: ['current-status'] },
      { text: 'Bruannan was the first British bog cored to bedrock.', tags: ['comparison'] },
      { text: 'Three research groups now share access to the archive.', tags: ['people'] },
    ],
    goals: [
      { tag: 'purpose', text: 'explain what the cores can tell researchers' },
      { tag: 'historical', text: 'emphasise how far back the record extends' },
      { tag: 'current-status', text: 'explain how the cores are looked after' },
      { tag: 'physical', text: 'describe the cores themselves' },
      { tag: 'comparison', text: 'emphasise what was new about the Bruannan work' },
      { tag: 'people', text: 'describe who uses the archive' },
    ],
    fabricated: [
      'The cores were destroyed in a flood shortly after collection.',
      'Pollen does not survive in peat and must be inferred indirectly.',
    ],
  },
  {
    slug: 'lantern-festival',
    topic: 'the Semur lantern festival, held annually in a small French town',
    facts: [
      { text: 'The Semur festival has been held every October since 1908.', tags: ['historical'] },
      { text: 'Residents build lanterns from paper stretched over willow frames.', tags: ['physical'] },
      { text: 'The festival began as a way of marking the end of the harvest.', tags: ['purpose'] },
      { text: 'About 4,000 lanterns are carried through the town each year.', tags: ['current-status'] },
      { text: 'Nearly a third of the town’s households take part in building them.', tags: ['people'] },
      { text: 'It is the only festival of its kind left in the department.', tags: ['comparison'] },
    ],
    goals: [
      { tag: 'people', text: 'emphasise how widely the town participates' },
      { tag: 'purpose', text: 'explain why the festival was started' },
      { tag: 'physical', text: 'describe how the lanterns are made' },
      { tag: 'historical', text: 'say how long the festival has run' },
      { tag: 'current-status', text: 'give a sense of the festival’s present size' },
      { tag: 'comparison', text: 'emphasise how rare the festival now is' },
    ],
    fabricated: [
      'The festival was cancelled for most of the twentieth century.',
      'Lanterns are manufactured in a nearby factory and sold to residents.',
    ],
  },
  {
    slug: 'tide-mill',
    topic: 'the Elmsett tide mill, a mill powered by tidal flow',
    facts: [
      { text: 'The Elmsett mill was in commercial use from 1740 to 1926.', tags: ['historical'] },
      { text: 'A pond holds seawater at high tide and releases it through the wheel.', tags: ['physical'] },
      { text: 'The mill ground flour for villages along the estuary.', tags: ['purpose'] },
      { text: 'It is one of only four working tide mills left in the country.', tags: ['comparison'] },
      { text: 'A volunteer group restored the machinery between 1998 and 2007.', tags: ['people'] },
      { text: 'The mill now runs on open days for demonstration.', tags: ['current-status'] },
    ],
    goals: [
      { tag: 'physical', text: 'explain how the mill is powered' },
      { tag: 'comparison', text: 'emphasise how unusual the mill is today' },
      { tag: 'people', text: 'describe the work done to restore the mill' },
      { tag: 'purpose', text: 'explain what the mill was used for' },
      { tag: 'historical', text: 'say how long the mill worked commercially' },
      { tag: 'current-status', text: 'explain when the mill operates now' },
    ],
    fabricated: [
      'The mill has never been restored and remains derelict.',
      'Tide mills were the most common type of mill in the country.',
    ],
  },
  {
    slug: 'seed-bank',
    topic: 'a regional seed bank in the Nokra highlands',
    facts: [
      { text: 'The Nokra seed bank opened in 1991.', tags: ['historical'] },
      { text: 'It stores 22,000 accessions in sealed foil packets at −18 °C.', tags: ['physical'] },
      { text: 'Its collection preserves crop varieties grown only in the highlands.', tags: ['purpose'] },
      { text: 'Farmers may request small quantities of seed at no charge.', tags: ['people'] },
      { text: 'Samples are germination-tested every ten years.', tags: ['current-status'] },
      { text: 'Two thirds of its varieties are held nowhere else.', tags: ['comparison'] },
    ],
    goals: [
      { tag: 'purpose', text: 'explain what the seed bank is for' },
      { tag: 'physical', text: 'describe how the seeds are stored' },
      { tag: 'comparison', text: 'emphasise how rare the collection is' },
      { tag: 'people', text: 'explain how farmers can use the bank' },
      { tag: 'current-status', text: 'describe how the collection is checked' },
      { tag: 'historical', text: 'say when the seed bank was established' },
    ],
    fabricated: [
      'The seed bank charges farmers a fee for each request.',
      'All of its varieties are also held in national collections.',
    ],
  },
]);

export function subjectBySlug(slug: string): SynthesisSubject | undefined {
  return SUBJECTS.find((s) => s.slug === slug);
}
