/**
 * Đề Reading kiểm tra đầu vào: 3 bài, 40 câu. Nội dung TỰ SOẠN cho bài kiểm tra này.
 *
 * Ba dạng câu theo đúng format: trắc nghiệm (mcq), đúng / sai / không có thông tin (tfng),
 * và điền chỗ trống (gap) — đáp án là một từ hoặc cụm từ có trong bài.
 */

export type ReadingQuestion =
  | { n: number; type: 'mcq'; prompt: string; options: string[]; answer: number }
  | { n: number; type: 'tfng'; prompt: string; answer: 'TRUE' | 'FALSE' | 'NOT GIVEN' }
  | { n: number; type: 'gap'; prompt: string; answer: string };

export type ReadingPassage = { id: string; title: string; paragraphs: string[]; questions: ReadingQuestion[] };

export const READING_PAPER: ReadingPassage[] = [
  {
    id: 'reading-1',
    title: 'Urban beekeeping',
    paragraphs: [
      'Beekeeping has traditionally been associated with rural farmland, where colonies have room to forage among wildflowers and crops. In recent years, however, a growing number of city residents have started keeping hives on rooftops, balconies and school grounds. Supporters argue that cities can be surprisingly good for bees. Because many gardens and parks are planted with a wide variety of flowers that bloom at different times, urban colonies often have a more continuous supply of nectar than colonies in intensive farming areas, where a single crop may flower for only a few weeks each year.',
      'Nevertheless, urban beekeeping is not without problems. Hives placed too close together can compete for the same flowers, and a large number of colonies in one neighbourhood may weaken the local bee population. Some researchers have also raised concerns about the spread of disease when hives are kept in dense areas with little monitoring. For this reason, many city councils now require beekeepers to register their hives and to attend training before they start.',
      'Honey produced in cities also tends to differ from rural honey. Because urban flora is so varied, the honey is often a blend of many floral sources, while rural honey is more likely to be dominated by the flavour of a single crop. Many urban beekeepers see this diversity as an advantage, and they sell their products at local markets as a way of connecting residents with the natural life of the city.',
    ],
    questions: [
      { n: 1, type: 'mcq', prompt: 'Beekeeping has traditionally been associated with', options: ['urban areas', 'rural farmland', 'school grounds', 'rooftops'], answer: 1 },
      { n: 2, type: 'mcq', prompt: 'Why can urban colonies have a more continuous supply of nectar?', options: ['bees are fed by humans', 'gardens have flowers that bloom at different times', 'crops are sprayed less often', 'hives are larger'], answer: 1 },
      { n: 3, type: 'gap', prompt: 'In intensive farming areas, a single crop may flower for only a few ____ each year.', answer: 'weeks' },
      { n: 4, type: 'tfng', prompt: 'Urban colonies produce more honey than rural colonies.', answer: 'NOT GIVEN' },
      { n: 5, type: 'tfng', prompt: 'Hives placed too close together can compete for the same flowers.', answer: 'TRUE' },
      { n: 6, type: 'tfng', prompt: 'Many cities have banned beekeeping in dense neighbourhoods.', answer: 'FALSE' },
      { n: 7, type: 'mcq', prompt: 'What do many city councils now require?', options: ['a licence fee', 'hive registration and training', 'a minimum hive size', 'planting of flowers'], answer: 1 },
      { n: 8, type: 'gap', prompt: 'Some researchers worry about the spread of ____ in dense areas.', answer: 'disease' },
      { n: 9, type: 'mcq', prompt: 'Urban honey is often', options: ['sweeter than rural honey', 'a blend of many floral sources', 'lighter in colour', 'easier to store'], answer: 1 },
      { n: 10, type: 'gap', prompt: 'Rural honey is more likely to be dominated by the flavour of a ____.', answer: 'single crop' },
      { n: 11, type: 'gap', prompt: 'Many urban beekeepers sell their products at ____.', answer: 'local markets' },
      { n: 12, type: 'tfng', prompt: 'Most city beekeepers consider the variety of urban honey a disadvantage.', answer: 'FALSE' },
      { n: 13, type: 'mcq', prompt: 'Selling honey locally is described as a way to', options: ['make a large profit', 'connect residents with the natural life of the city', 'replace imported honey', 'train new beekeepers'], answer: 1 },
    ],
  },
  {
    id: 'reading-2',
    title: 'The lighthouse',
    paragraphs: [
      'For centuries, lighthouses guided sailors safely past dangerous coastlines. The earliest well-known example, the Pharos of Alexandria, was built around the third century BCE and is believed to have stood more than 100 metres tall. Its fire was reflected by a large polished mirror, though historians disagree about how bright the light actually was.',
      'Medieval lighthouses were often simple open fires on towers, which needed constant tending. The invention of the Argand lamp in the late eighteenth century, which produced a brighter and steadier flame, changed the design of lighthouses. Later, lenses developed by the French physicist Augustin-Jean Fresnel allowed keepers to concentrate light into a powerful beam that could be seen many kilometres away while using far less fuel.',
      'Although modern satellites and radar now provide navigators with precise positions, many lighthouses remain in use. They are cheap to maintain compared with new electronic systems, and they serve as a backup if technology fails. Many former lighthouses have also been converted into museums or holiday accommodation, attracting visitors who are interested in maritime history.',
    ],
    questions: [
      { n: 14, type: 'tfng', prompt: 'The Pharos of Alexandria was built in the third century BCE.', answer: 'TRUE' },
      { n: 15, type: 'tfng', prompt: 'Historians agree on how bright the Pharos light was.', answer: 'FALSE' },
      { n: 16, type: 'gap', prompt: 'The fire of the Pharos was reflected by a large polished ____.', answer: 'mirror' },
      { n: 17, type: 'gap', prompt: 'Medieval lighthouse fires needed constant ____.', answer: 'tending' },
      { n: 18, type: 'tfng', prompt: 'The Argand lamp produced a brighter and steadier flame.', answer: 'TRUE' },
      { n: 19, type: 'tfng', prompt: 'The Argand lamp was invented in the early nineteenth century.', answer: 'FALSE' },
      { n: 20, type: 'tfng', prompt: 'Augustin-Jean Fresnel was an Italian physicist.', answer: 'FALSE' },
      { n: 21, type: 'tfng', prompt: 'Fresnel lenses let a beam be seen far away while using less fuel.', answer: 'TRUE' },
      { n: 22, type: 'mcq', prompt: 'What was the main improvement of the Argand lamp?', options: ['it used less oil', 'it gave a brighter and steadier flame', 'it was cheaper to build', 'it needed no keeper'], answer: 1 },
      { n: 23, type: 'mcq', prompt: 'Why do many lighthouses remain in use?', options: ['they are required by law', 'they are cheap to maintain and serve as a backup', 'they are faster than satellites', 'they attract sailors'], answer: 1 },
      { n: 24, type: 'gap', prompt: 'Modern navigators use ____ to find precise positions.', answer: 'satellites' },
      { n: 25, type: 'gap', prompt: 'Former lighthouses have been converted into museums or holiday ____.', answer: 'accommodation' },
      { n: 26, type: 'mcq', prompt: 'Visitors to former lighthouses are often interested in', options: ['electronics', 'maritime history', 'medieval fires', 'lens manufacturing'], answer: 1 },
      { n: 27, type: 'tfng', prompt: 'Fresnel lenses were developed before the Argand lamp.', answer: 'NOT GIVEN' },
    ],
  },
  {
    id: 'reading-3',
    title: 'Sleep and memory',
    paragraphs: [
      'Sleep is often described as a passive state, but research over the past few decades suggests that the brain is highly active during certain stages of sleep. One of the most studied functions is memory consolidation, the process by which newly acquired information is stabilised and integrated with existing knowledge.',
      'Experiments have shown that people who sleep after learning a task often perform better on it the next day than people who remain awake for the same period. Researchers believe that during slow-wave sleep, the brain replays patterns of activity recorded during the day, which may strengthen connections between neurons. Rapid eye movement (REM) sleep, by contrast, seems to be linked with the processing of emotional memories.',
      'The effects are not limited to students. Studies of shift workers have found that irregular sleep can impair the recall of new information, even when total sleep time appears adequate. This suggests that the timing and regularity of sleep may be as important as its duration.',
      'Some scientists caution that much of the evidence comes from laboratory experiments with small groups of young adults. More research is needed to determine how the findings apply to older people or to those with sleep disorders.',
    ],
    questions: [
      { n: 28, type: 'mcq', prompt: 'Sleep is traditionally considered to be a state that is', options: ['highly active', 'passive', 'dangerous', 'shortened by learning'], answer: 1 },
      { n: 29, type: 'mcq', prompt: 'Memory consolidation means', options: ['forgetting information that is not used', 'stabilising new information and integrating it', 'repeating words aloud', 'training muscles'], answer: 1 },
      { n: 30, type: 'tfng', prompt: 'People who sleep after learning a task perform better the next day than those who stay awake.', answer: 'TRUE' },
      { n: 31, type: 'gap', prompt: 'During slow-wave sleep, the brain ____ patterns of activity recorded during the day.', answer: 'replays' },
      { n: 32, type: 'mcq', prompt: 'REM sleep is linked with', options: ['physical growth', 'the processing of emotional memories', 'digestion', 'body temperature'], answer: 1 },
      { n: 33, type: 'tfng', prompt: 'Irregular sleep can impair the recall of new information in shift workers.', answer: 'TRUE' },
      { n: 34, type: 'tfng', prompt: 'The memory effects of irregular sleep appear only when total sleep time is short.', answer: 'FALSE' },
      { n: 35, type: 'gap', prompt: 'The timing and regularity of sleep may be as important as its ____.', answer: 'duration' },
      { n: 36, type: 'mcq', prompt: 'Much of the evidence on sleep and memory comes from studies of', options: ['elderly people', 'small groups of young adults', 'children', 'shift workers only'], answer: 1 },
      { n: 37, type: 'mcq', prompt: 'Scientists say more research is needed on', options: ['older people and those with sleep disorders', 'animals', 'dreams', 'caffeine'], answer: 0 },
      { n: 38, type: 'gap', prompt: 'Much of the evidence comes from ____ with small groups.', answer: 'laboratory experiments' },
      { n: 39, type: 'tfng', prompt: 'Shift workers always sleep less than other people.', answer: 'NOT GIVEN' },
      { n: 40, type: 'gap', prompt: 'People perform better if they ____ after learning a task.', answer: 'sleep' },
    ],
  },
];

/** Tất cả câu hỏi theo thứ tự số 1–40. */
export const READING_QUESTIONS: ReadingQuestion[] = READING_PAPER.flatMap((p) => p.questions);
