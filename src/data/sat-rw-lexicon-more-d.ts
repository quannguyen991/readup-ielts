/**
 * Bổ sung từ điển SAT Verbal — phần D: 4 chủ đề trọng điểm hay gặp nhất trong đề Digital SAT:
 * - Chủ đề 12: Luận cứ khoa học, kiểm chứng và bác bỏ (Scientific Inquiry & Evidence)
 * - Chủ đề 13: Văn học, tâm lý và tính cách nhân vật (Literature & Character Dynamics)
 * - Chủ đề 14: Lịch sử, quyền lực và cải cách xã hội (History, Civic Discourse & Politics)
 * - Chủ đề 15: Tự nhiên, biến đổi và sinh thái (Ecology, Climate & Evolutionary Adaptation)
 *
 * Mỗi chủ đề đúng 32 từ, câu ví dụ chứa chính từ đó dạng nguyên thể (hỗ trợ `clozeOf` đục lỗ).
 */
import { W, type LexEntry } from './sat-rw-lex-helpers';

export const MORE_D: Record<string, LexEntry> = {
  // =========================================================================
  // 12 · Luận cứ khoa học, kiểm chứng và bác bỏ
  // =========================================================================
  postulate: W('verb', 'đặt giả thuyết, tiền đề', 'To suggest or accept something as a basic fact or theory to form the basis for an argument.', ['hypothesize', 'posit', 'propose'], ['prove', 'demonstrate'], 'Astronomers postulate that dark matter makes up most of the mass in the universe.'),
  anomaly: W('noun', 'hiện tượng dị thường, bất thường', 'Something that deviates from what is standard, normal, or expected.', ['abnormality', 'irregularity', 'peculiarity'], ['conformity', 'normality', 'regularity'], 'The sudden drop in temperature was a(n) anomaly that meteorologists could not explain.'),
  untenable: W('adjective', 'không thể bảo vệ, không thể đứng vững', 'Not able to be maintained or defended against attack or objection.', ['indefensible', 'unsustainable', 'flawed'], ['tenable', 'defensible', 'sound'], 'When new evidence emerged, the old theory became untenable and was abandoned.'),
  conjecture: W('noun', 'sự phỏng đoán, ước đoán', 'An opinion or conclusion formed on the basis of incomplete information.', ['speculation', 'guesswork', 'surmise'], ['certainty', 'fact', 'proof'], 'Without direct measurements, any claim about the planet’s core remains mere conjecture.'),
  subvert: W('verb', 'lật đổ, làm đảo lộn', 'To undermine the power and authority of an established system, belief, or institution.', ['undermine', 'overturn', 'destabilize'], ['reinforce', 'uphold', 'strengthen'], 'The surprising experimental results served to subvert the long-accepted biological paradigm.'),
  paradoxical: W('adjective', 'nghịch lý, mâu thuẫn nhưng có thật', 'Seeming absurd or self-contradictory, but perhaps true.', ['contradictory', 'incongruous', 'ironic'], ['logical', 'consistent', 'straightforward'], 'It is paradoxical that modern cities with more connectivity often report higher levels of loneliness.'),
  nuance: W('noun', 'sắc thái tinh vi', 'A subtle difference in or shade of meaning, expression, or sound.', ['subtlety', 'distinction', 'refinement'], ['coarseness', 'obviousness'], 'The translator captured every nuance of the author’s complex style.'),
  scrutinize: W('verb', 'soi xét, kiểm tra kỹ lưỡng', 'To examine or inspect something closely and thoroughly.', ['inspect', 'examine', 'analyze'], ['glance', 'overlook', 'ignore'], 'Scientists must scrutinize every data point before submitting their findings for peer review.'),
  discrepancy: W('noun', 'sự sai lệch, bất nhất', 'A lack of compatibility or similarity between two or more facts.', ['inconsistency', 'divergence', 'mismatch'], ['consistency', 'harmony', 'agreement'], 'The audit uncovered a noticeable discrepancy between recorded profits and physical cash in the vault.'),
  attenuate: W('verb', 'làm suy giảm, làm yếu đi', 'To reduce the force, effect, or value of something.', ['weaken', 'diminish', 'dampen'], ['amplify', 'intensify', 'strengthen'], 'Earplugs help attenuate loud noises and protect hearing in industrial factories.'),
  extrapolate: W('verb', 'suy diễn từ dữ liệu có sẵn', 'To extend the application of a method or conclusion to an unknown situation by assuming existing trends will continue.', ['infer', 'project', 'deduce'], ['doubt', 'discount'], 'Researchers often extrapolate future climate trends from centuries of ice core data.'),
  salient: W('adjective', 'nổi bật, quan trọng nhất', 'Most noticeable, prominent, or important.', ['prominent', 'striking', 'conspicuous'], ['inconspicuous', 'minor', 'unnoticeable'], 'The summary highlights the salient points of the lengthy economic report.'),
  validity: W('noun', 'tính hợp lệ, tính đúng đắn', 'The quality of being logically or factually sound and well-grounded.', ['soundness', 'legitimacy', 'credibility'], ['invalidity', 'falsity', 'unreliability'], 'Independent peer review confirmed the validity of the laboratory’s unexpected findings.'),
  preclude: W('verb', 'loại trừ, ngăn ngừa trước', 'To prevent something from happening or make it impossible.', ['prevent', 'prohibit', 'hinder'], ['allow', 'permit', 'facilitate'], 'A severe injury did not preclude her from completing the research paper on time.'),
  elucidate: W('verb', 'làm sáng tỏ, giải thích rõ', 'To make something clear or easy to understand by explaining it.', ['clarify', 'explain', 'illuminate'], ['obscure', 'confuse', 'complicate'], 'The professor used diagrams to elucidate the complex chemical pathway.'),
  rebuttal: W('noun', 'sự phản bác, bác bẻ', 'A refutation or contradiction offering contrary evidence.', ['counterargument', 'refutation', 'disproof'], ['confirmation', 'endorsement', 'agreement'], 'Her brilliant rebuttal addressed every criticism raised by the opposition.'),
  axiom: W('noun', 'tiên đề, chân lý hiển nhiên', 'A statement or proposition that is regarded as being established, accepted, or self-evidently true.', ['maxim', 'principle', 'truism'], ['absurdity', 'paradox'], 'In classical geometry, parallel lines never intersecting is treated as an undisputed axiom.'),
  concur: W('verb', 'đồng tình, nhất trí', 'To agree with someone or share the same opinion.', ['agree', 'accord', 'coincide'], ['disagree', 'dissent', 'dispute'], 'Most climatologists concur that carbon emissions are the primary driver of global warming.'),
  dissent: W('noun', 'sự bất đồng quan điểm', 'The expression or holding of opinions at variance with those previously or commonly held.', ['disagreement', 'opposition', 'objection'], ['agreement', 'consensus', 'harmony'], 'The court ruling included a strong dissent from two dissenting judges.'),
  incongruous: W('adjective', 'không phù hợp, lạc lõng', 'Not in harmony or keeping with the surroundings or other aspects of something.', ['out of place', 'inappropriate', 'discordant'], ['harmonious', 'fitting', 'compatible'], 'The modern glass skyscraper looked incongruous among the historic stone cottages.'),
  confound: W('verb', 'làm bối rối, gây nhầm lẫn', 'To cause surprise or confusion in someone, especially by acting against their expectations.', ['perplex', 'baffle', 'mystify'], ['clarify', 'enlighten', 'explain'], 'The unexpected experimental findings continue to confound even veteran neuroscientists.'),
  fallacy: W('noun', 'ngụy biện, quan niệm sai lầm', 'A mistaken belief, especially one based on unsound argument.', ['misconception', 'delusion', 'error'], ['truth', 'fact', 'verity'], 'The belief that cold weather alone causes the common cold is a widespread fallacy.'),
  antithesis: W('noun', 'sự đối lập hoàn toàn, phản đề', 'A person or thing that is the direct opposite of someone or something else.', ['opposite', 'contrary', 'reverse'], ['duplicate', 'counterpart', 'analog'], 'Selfish greed is the exact antithesis of community service and generosity.'),
  correlate: W('verb', 'có tương quan', 'To have a mutual relationship or connection, in which one thing affects or depends on another.', ['correspond', 'align', 'associate'], ['diverge', 'clash'], 'High levels of exercise often correlate with lower rates of cardiovascular disease.'),
  diverge: W('verb', 'phân kỳ, rẽ nhánh, khác biệt', 'To develop in different directions or become different over time.', ['deviate', 'branch', 'differ'], ['converge', 'unite', 'merge'], 'Although the two languages share a common ancestor, their vocabularies diverge significantly.'),
  deduce: W('verb', 'suy luận logic từ chứng cứ', 'To arrive at a fact or conclusion by reasoning from general principles.', ['infer', 'conclude', 'derive'], ['speculate', 'guess'], 'From the footprints left in the mud, the tracker could deduce the animal’s approximate weight.'),
  presuppose: W('verb', 'tiền giả định', 'To require or assume something as a prior condition in order to be true.', ['assume', 'presume', 'require'], ['disprove', 'doubt'], 'The proposed tax cut seems to presuppose continuous economic growth over the next decade.'),
  tenable: W('adjective', 'có thể bảo vệ được, có cơ sở', 'Able to be maintained or defended against attack or objection.', ['defensible', 'justifiable', 'supportable'], ['untenable', 'indefensible', 'flawed'], 'Her thesis remained tenable even after rigorous scrutiny from visiting scholars.'),
  corroborating: W('adjective', 'mang tính củng cố, làm chứng', 'Serving to support or confirm a theory, claim, or finding with additional evidence.', ['supporting', 'confirming', 'substantiating'], ['refuting', 'contradicting', 'undermining'], 'The detective searched for corroborating testimony to verify the witness’s statement.'),
  refutation: W('noun', 'sự bác bỏ, lời bác bỏ', 'The action of proving a statement or theory to be wrong or false.', ['disproof', 'rebuttal', 'negation'], ['confirmation', 'validation', 'proof'], 'His published article offered a comprehensive refutation of the competitor’s claims.'),
  substantiating: W('adjective', 'có giá trị chứng minh', 'Providing evidence to support or prove the truth of something.', ['validating', 'verifying', 'confirming'], ['discrediting', 'invalidating'], 'The journal required substantiating documentation before publishing the breakthrough discovery.'),
  substantiation: W('noun', 'sự minh chứng, tài liệu bằng chứng', 'Evidence or proof that supports the truth of something.', ['confirmation', 'validation', 'verification'], ['refutation', 'invalidation'], 'The extraordinary scientific claim was published without adequate substantiation from independent labs.'),

  // =========================================================================
  // 13 · Văn học, tâm lý và tính cách nhân vật
  // =========================================================================
  aloof: W('adjective', 'xa cách, lạnh lùng', 'Not friendly or forthcoming; cool and distant.', ['distant', 'detached', 'reserved'], ['friendly', 'sociable', 'gregarious'], 'Though polite at social gatherings, the author remained aloof from literary circles.'),
  gregarious: W('adjective', 'hòa đồng, thích giao du', 'Fond of company; sociable and outgoing.', ['sociable', 'outgoing', 'companionable'], ['aloof', 'solitary', 'unsociable'], 'Unlike her quiet brother, Emma was gregarious and thrived in large gatherings.'),
  condescending: W('adjective', 'trịch thượng, kẻ cả', 'Having or showing an attitude of patronizing superiority.', ['patronizing', 'supercilious', 'disdainful'], ['respectful', 'humble', 'deferential'], 'The wealthy merchant spoke in a(n) condescending tone to his junior clerks.'),
  deferential: W('adjective', 'cung kính, tôn kính', 'Showing polite respect and submission to another person.', ['respectful', 'reverent', 'courteous'], ['disrespectful', 'insolent', 'condescending'], 'The apprentice remained deferential in the presence of the master craftsman.'),
  disdain: W('noun', 'sự khinh miệt, coi thường', 'The feeling that someone or something is unworthy of one’s consideration or respect.', ['contempt', 'scorn', 'derision'], ['admiration', 'respect', 'veneration'], 'She viewed the critic’s harsh remarks with quiet disdain and refused to respond.'),
  veneration: W('noun', 'sự tôn kính, sùng kính', 'Great respect or reverence for someone or something.', ['reverence', 'worship', 'esteem'], ['disdain', 'scorn', 'contempt'], 'Traditional cultures often hold elders in deep veneration for their wisdom.'),
  earnest: W('adjective', 'chân thành, nghiêm túc', 'Resulting from or showing sincere and intense conviction.', ['sincere', 'solemn', 'genuine'], ['flippant', 'frivolous', 'insincere'], 'The young activist made a(n) earnest plea for environmental conservation.'),
  flippant: W('adjective', 'cợt nhả, coi nhẹ việc nghiêm túc', 'Not showing a serious or respectful attitude when appropriate.', ['frivolous', 'facetious', 'disrespectful'], ['earnest', 'serious', 'respectful'], 'His flippant remarks during the solemn ceremony shocked the entire congregation.'),
  melancholy: W('noun', 'nỗi u sầu, buồn man mác', 'A feeling of pensive sadness, typically with no obvious cause.', ['sorrow', 'gloom', 'despondency'], ['joy', 'cheerfulness', 'ecstasy'], 'The rainy autumn afternoon filled the quiet study with gentle melancholy.'),
  loquacious: W('adjective', 'nói nhiều, hoạt ngôn', 'Tending to talk a great deal; very talkative.', ['talkative', 'voluble', 'garrulous'], ['taciturn', 'silent', 'reserved'], 'The loquacious host kept guests entertained with endless stories of his travels.'),
  resolute: W('adjective', 'kiên định, dứt khoát', 'Admirably purposeful, determined, and unwavering.', ['determined', 'steadfast', 'unwavering'], ['vacillating', 'irresolute', 'hesitant'], 'Despite severe setbacks, the explorer remained resolute in reaching the summit.'),
  vacillating: W('adjective', 'do dự, ngập ngừng không dứt', 'Wavering between different opinions or actions; indecisive.', ['indecisive', 'hesitant', 'wavering'], ['resolute', 'decisive', 'steadfast'], 'Her vacillating attitude irritated colleagues who needed a prompt decision.'),
  indignant: W('adjective', 'phẫn nộ vì bất công', 'Feeling or showing anger or annoyance at what is perceived as unfair treatment.', ['outraged', 'resentful', 'furious'], ['content', 'pleased', 'calm'], 'The workers grew indignant when management slashed bonuses without prior notice.'),
  complacent: W('adjective', 'tự mãn, chủ quan', 'Showing smug or uncritical satisfaction with oneself or one’s achievements.', ['smug', 'self-satisfied', 'unconcerned'], ['humble', 'vigilant', 'anxious'], 'The championship team became complacent after a long winning streak and lost the final.'),
  cynical: W('adjective', 'hoài nghi nhân sinh, ác cảm', 'Believing that people are motivated purely by self-interest rather than honorable reasons.', ['skeptical', 'distrustful', 'pessimistic'], ['optimistic', 'ingenuous', 'trusting'], 'After years in politics, the reporter developed a(n) cynical view of public speeches.'),
  ingenuous: W('adjective', 'chân thật, ngây thơ', 'Innocent, unsuspecting, and candid.', ['naive', 'candid', 'innocent'], ['cynical', 'cunning', 'guileful'], 'Her ingenuous nature made it difficult for her to suspect deceit in others.'),
  ostentatious: W('adjective', 'phô trương, khoe khoang', 'Characterized by vulgar or pretentious display designed to impress others.', ['showy', 'flamboyant', 'pretentious'], ['unpretentious', 'modest', 'restrained'], 'The mansion’s ostentatious decor featured gold-plated chandeliers in every room.'),
  unpretentious: W('adjective', 'khiêm tốn, giản dị, không phô trương', 'Not attempting to impress others with an appearance of greater importance or value.', ['modest', 'humble', 'simple'], ['ostentatious', 'pompous', 'pretentious'], 'Despite his international fame, the composer lived in a(n) unpretentious suburban house.'),
  temperament: W('noun', 'khí chất, tính khí tự nhiên', 'A person’s or animal’s nature, especially as it permanently affects their behavior.', ['disposition', 'nature', 'temper'], [], 'His calm temperament helped de-escalate tension during intense board negotiations.'),
  trepidation: W('noun', 'sự âu lo, run sợ', 'A feeling of fear or agitation about something that may happen.', ['apprehension', 'dread', 'anxiety'], ['calm', 'confidence', 'serenity'], 'She entered the dark, abandoned attic with palpable trepidation.'),
  solitude: W('noun', 'sự cô độc, thanh tịnh một mình', 'The state or situation of being alone, often by choice.', ['seclusion', 'isolation', 'loneliness'], ['companionship', 'crowd', 'society'], 'The painter retreated to the coastal cottage to enjoy quiet solitude while working.'),
  wistful: W('adjective', 'nuối tiếc, ngậm ngùi hoài niệm', 'Having or showing a feeling of vague or regretful longing.', ['yearning', 'nostalgic', 'pensive'], ['content', 'indifferent', 'unemotional'], 'She cast a(n) wistful glance at the old family estate before driving away forever.'),
  impetuous: W('adjective', 'bốc đồng, hấp tấp', 'Acting or done quickly and without thought or care.', ['impulsive', 'rash', 'reckless'], ['cautious', 'deliberate', 'prudent'], 'His impetuous decision to invest his entire savings in the venture ended in regret.'),
  fastidious: W('adjective', 'kỹ tính, cầu toàn, khó tính', 'Very attentive to and concerned about accuracy and detail; hard to please.', ['meticulous', 'scrupulous', 'fussy'], ['careless', 'lax', 'sloppy'], 'The fastidious curator adjusted the picture frames until every angle was mathematically exact.'),
  sardonic: W('adjective', 'châm biếm, mỉa mai chua cay', 'Grimly mocking, cynical, or sarcastic.', ['mocking', 'satirical', 'cynical'], ['sincere', 'compassionate', 'kind'], 'With a(n) sardonic smile, he congratulated his rival on winning second place.'),
  capricious: W('adjective', 'thất thường, tùy hứng khó lường', 'Given to sudden and unaccountable changes of mood or behavior.', ['unpredictable', 'fickle', 'erratic'], ['steady', 'consistent', 'predictable'], 'The king was known for his capricious rulings, rewarding courtiers one day and exiling them the next.'),
  benevolent: W('adjective', 'nhân từ, vị tha, bác ái', 'Well meaning and kindly; serving a charitable rather than profit-making purpose.', ['kindhearted', 'charitable', 'magnanimous'], ['malevolent', 'spiteful', 'cruel'], 'The benevolent patron donated millions to establish free libraries across rural towns.'),
  malevolent: W('adjective', 'hiểm độc, ác tâm', 'Having or showing a wish to do evil to others.', ['malicious', 'spiteful', 'hostile'], ['benevolent', 'kind', 'friendly'], 'The villain in the fable possessed a(n) malevolent hatred toward peaceful villagers.'),
  penchant: W('noun', 'thiên hướng, sở thích đặc biệt', 'A strong or habitual liking for something or tendency to do something.', ['inclination', 'predilection', 'propensity'], ['aversion', 'dislike', 'distaste'], 'Ever since childhood, he had a(n) penchant for collecting rare mechanical clocks.'),
  animosity: W('noun', 'sự thù địch, ác cảm sâu sắc', 'Strong hostility or open dislike between people or groups.', ['hostility', 'antagonism', 'enmity'], ['goodwill', 'friendship', 'amity'], 'Decades of territorial rivalry bred persistent animosity between the neighboring provinces.'),
  stoic: W('adjective', 'nhẫn nại, bình thản trước gian khó', 'Enduring pain or hardship without showing feelings or complaining.', ['uncomplaining', 'resigned', 'impassive'], ['emotional', 'complaining', 'expressive'], 'Despite losing his home in the storm, he remained remarkably stoic.'),
  fickle: W('adjective', 'hay thay đổi, không kiên định', 'Changing frequently, especially as regards one’s loyalties, interests, or affection.', ['inconstant', 'capricious', 'changeable'], ['constant', 'loyal', 'steadfast'], 'Popular fashion is notorious for its fickle tastes that shift from season to season.'),

  // =========================================================================
  // 14 · Lịch sử, quyền lực và cải cách xã hội
  // =========================================================================
  sovereignty: W('noun', 'chủ quyền tối cao', 'Supreme power or authority of a state to govern itself or another state.', ['autonomy', 'supremacy', 'dominion'], ['subjugation', 'dependence', 'servitude'], 'The treaty formally recognized the territorial sovereignty of the newly independent nation.'),
  autonomy: W('noun', 'quyền tự trị, độc lập', 'The right or condition of self-government or freedom from external control.', ['independence', 'self-rule', 'sovereignty'], ['dependence', 'subjugation', 'subordination'], 'Local tribal councils were granted complete autonomy over domestic community policies.'),
  subjugation: W('noun', 'sự nô dịch, khuất phục', 'The action of bringing someone or something under domination or control.', ['conquest', 'enslavement', 'oppression'], ['liberation', 'emancipation', 'independence'], 'The conquerors forced the subjugation of neighboring city-states through overwhelming military force.'),
  emancipate: W('verb', 'giải phóng, trao tự do', 'To set free, especially from legal, social, or political restrictions.', ['liberate', 'unfetter', 'release'], ['enslave', 'subjugate', 'imprison'], 'The historic decree helped emancipate millions of laborers held in generational bondage.'),
  disenfranchise: W('verb', 'tước quyền công dân/quyền bầu cử', 'To deprive someone of a legal right, privilege, or immunity, especially the right to vote.', ['disempower', 'deprive', 'exclude'], ['enfranchise', 'empower'], 'Restrictive registration laws threatened to disenfranchise thousands of rural voters.'),
  enfranchise: W('verb', 'trao quyền bầu cử/công dân', 'To give the right to vote to a person or group of people.', ['empower', 'liberate'], ['disenfranchise', 'disempower'], 'The constitutional amendment served to enfranchise women after decades of peaceful protest.'),
  hegemony: W('noun', 'sự bá quyền, thống trị', 'Leadership or dominance, especially by one country or social group over others.', ['dominance', 'supremacy', 'ascendancy'], ['subordination', 'weakness'], 'The empire exercised cultural and military hegemony across the Mediterranean basin.'),
  oppressive: W('adjective', 'áp bức, nặng nề bạo quyền', 'Inflicting harsh and authoritarian treatment on those subject to it.', ['tyrannical', 'despotic', 'authoritarian'], ['liberating', 'democratic', 'humane'], 'Citizens fled across the border to escape the regime’s oppressive censorship laws.'),
  egalitarian: W('adjective', 'bình đẳng chủ nghĩa', 'Believing in or based on the principle that all people are equal and deserve equal rights and opportunities.', ['equal', 'democratic', 'fair'], ['hierarchical', 'elitist', 'authoritarian'], 'The utopian community aimed to build a(n) egalitarian society where resources were shared equally.'),
  hierarchical: W('adjective', 'có thứ bậc, phân cấp', 'Arranged in order of rank or authority.', ['stratified', 'graded', 'ranked'], ['egalitarian', 'horizontal'], 'Traditional feudal systems relied on a(n) hierarchical structure with royalty at the apex.'),
  advocate: W('noun', 'người ủng hộ, bênh vực', 'A person who publicly supports or recommends a particular cause or policy.', ['champion', 'proponent', 'supporter'], ['opponent', 'adversary', 'critic'], 'She became an outspoken advocate for prison reform and humane treatment.'),
  adversary: W('noun', 'đối thủ, kẻ thù', 'One’s opponent in a contest, conflict, or dispute.', ['opponent', 'rival', 'foe'], ['ally', 'supporter', 'collaborator'], 'In diplomatic debates, he treated every adversary with unfailing courtesy.'),
  rhetoric: W('noun', 'nghệ thuật hùng biện, tài ăn nói', 'The art of effective or persuasive speaking or writing.', ['oratory', 'eloquence', 'persuasion'], [], 'The candidate’s stirring rhetoric captivated voters across the political spectrum.'),
  sedition: W('noun', 'hành vi xúi giục nổi loạn', 'Conduct or speech inciting people to rebel against the authority of a state or monarch.', ['treason', 'insurrection', 'mutiny'], ['allegiance', 'loyalty', 'obedience'], 'The editor was arrested on charges of sedition after writing pamphlets opposing the crown.'),
  tyranny: W('noun', 'sự chuyên chế, bạo quyền', 'Cruel and oppressive government or rule.', ['despotism', 'autocracy', 'dictatorship'], ['democracy', 'liberty', 'freedom'], 'Early settlers framed their revolt as a necessary strike against foreign tyranny.'),
  insurrection: W('noun', 'cuộc khởi nghĩa, bạo loạn', 'A violent uprising against an authority or government.', ['rebellion', 'revolt', 'uprising'], ['peace', 'compliance', 'submission'], 'Soldiers guarded government offices following an armed insurrection in the capital.'),
  subversion: W('noun', 'hành vi lật đổ ngầm', 'The undermining of the power and authority of an established system or institution.', ['sabotage', 'disruption', 'treachery'], ['allegiance', 'preservation', 'support'], 'The administration viewed underground presses as dangerous tools of political subversion.'),
  ratify: W('verb', 'phê chuẩn, thông qua hiệp ước', 'To sign or give formal consent to a treaty, contract, or agreement, making it officially valid.', ['approve', 'endorse', 'confirm'], ['reject', 'veto', 'repeal'], 'Representatives gathered in convention to ratify the proposed constitutional articles.'),
  repeal: W('verb', 'bãi bỏ, hủy bỏ (đạo luật)', 'To revoke or annul a law or congressional act.', ['revoke', 'rescind', 'cancel'], ['enact', 'ratify', 'institute'], 'Parliament was forced to repeal the controversial stamp duty after widespread boycotts.'),
  polarization: W('noun', 'sự phân cực chính trị/xã hội', 'Division into two sharply contrasting groups or sets of opinions or beliefs.', ['division', 'divergence', 'estrangement'], ['consensus', 'unity', 'harmony'], 'Media bias contributed to growing polarization among voters in swing districts.')
  ,
  discourse: W('noun', 'nghị luận, đối thoại xã hội', 'Written or spoken communication or debate on a formal subject.', ['dialogue', 'discussion', 'dissertation'], [], 'Academic journals provide a venue for scholarly discourse on human rights.'),
  mandate: W('noun', 'ủy quyền, sứ mệnh chính trị', 'An official order or commission to do something, or the authority granted by a constituency.', ['directive', 'authorization', 'sanction'], ['prohibition', 'refusal'], 'The president claimed an overwhelming mandate from the public to lower trade tariffs.'),
  faction: W('noun', 'bè phái, phe nhóm', 'A small organized dissenting group within a larger one, especially in politics.', ['sect', 'bloc', 'caucus'], ['whole', 'unity'], 'A dissenting faction within the assembly refused to vote for the proposed wartime budget.'),
  solidarity: W('noun', 'tinh thần đoàn kết', 'Unity or agreement of feeling or action, especially among individuals with a common interest.', ['unity', 'unanimity', 'accord'], ['discord', 'division', 'antagonism'], 'Striking coal miners showed remarkable solidarity throughout the cold winter months.'),
  encroachment: W('noun', 'sự xâm lấn quyền lợi/lãnh thổ', 'Intrusion on a person’s territory, rights, or property gradually.', ['intrusion', 'infringement', 'trespass'], ['respect', 'withdrawal'], 'Native leaders warned against continued encroachment onto legally recognized reservation boundaries.'),
  grievance: W('noun', 'sự bất bình, khiếu nại công lý', 'A real or imagined wrong or other cause for complaint or protest, especially unfair treatment.', ['complaint', 'injustice', 'resentment'], ['satisfaction', 'praise'], 'The petition outlined each legal grievance that citizens held against royal governors.'),
  partisanship: W('noun', 'tính đảng phái thiên kiến', 'Prejudice in favor of a particular cause or political party; bias.', ['bias', 'prejudice', 'factionalism'], ['impartiality', 'neutrality', 'objectivity'], 'Bitter partisanship stalled important infrastructure legislation in the senate.'),
  coercion: W('noun', 'sự ép buộc, cưỡng chế', 'The practice of persuading someone to do something by using force or threats.', ['compulsion', 'intimidation', 'duress'], ['volition', 'persuasion', 'choice'], 'Confessions extracted through military coercion are inadmissible in civilized courts of law.'),
  precedent: W('noun', 'tiền lệ pháp lý/lịch sử', 'An earlier event or action that is regarded as an example or guide to be considered in subsequent similar circumstances.', ['model', 'exemplar', 'criterion'], [], 'The supreme court ruling set a binding precedent for upcoming civil rights litigation.'),
  inalienable: W('adjective', 'bất khả xâm phạm, không thể tước đoạt', 'Unable to be taken away from or given away by the possessor.', ['inviolable', 'absolute', 'sacred'], ['revocable', 'negotiable', 'temporary'], 'The constitution asserts that every human possesses inalienable rights to life and liberty.'),
  usurp: W('verb', 'chiếm đoạt quyền lực trái phép', 'To take a position of power or importance illegally or by force.', ['seize', 'commandeer', 'arrogate'], ['relinquish', 'yield', 'surrender'], 'The rebellious general plotted to usurp royal command while the king was away.'),
  clemency: W('noun', 'sự khoan hồng, nhân từ', 'Mercy or lenience shown toward an offender by someone in authority.', ['mercy', 'leniency', 'compassion'], ['severity', 'cruelty', 'retribution'], 'The governor granted executive clemency to nonviolent offenders who showed genuine remorse.'),

  // =========================================================================
  // 15 · Tự nhiên, biến đổi và sinh thái
  // =========================================================================
  symbiotic: W('adjective', 'cộng sinh, cùng có lợi', 'Involving interaction between two different organisms living in close physical association, typically to the advantage of both.', ['mutualistic', 'interdependent', 'cooperative'], ['parasitic', 'antagonistic'], 'Clownfish and sea anemones maintain a(n) symbiotic relationship that protects both species from predators.'),
  parasitic: W('adjective', 'ký sinh, ăn bám gây hại', 'Living as a parasite on or in another organism, causing it harm.', ['injurious', 'exploitative'], ['symbiotic', 'mutualistic', 'beneficial'], 'Mistletoe is a(n) parasitic plant that absorbs moisture and nutrients from its host oak tree.'),
  equilibrium: W('noun', 'trạng thái cân bằng sinh thái/hóa học', 'A state in which opposing forces or influences are balanced.', ['balance', 'stability', 'poise'], ['imbalance', 'instability', 'disequilibrium'], 'Predators play an essential role in keeping the forest ecosystem in stable equilibrium.'),
  catalyst: W('noun', 'chất xúc tác, tác nhân thúc đẩy', 'A substance that increases the rate of a chemical reaction, or a person/thing that precipitates an event.', ['stimulus', 'spark', 'impetus'], ['inhibitor', 'deterrent'], 'The sudden drought acted as a(n) catalyst for widespread migration among herd animals.'),
  mitigate: W('verb', 'làm dịu bớt, giảm nhẹ hậu quả', 'To make less severe, serious, or painful.', ['alleviate', 'lessen', 'moderate'], ['exacerbate', 'aggravate', 'intensify'], 'Planting mangrove trees along coastal shores helps mitigate the damaging impact of tidal surges.'),
  exacerbate: W('verb', 'làm trầm trọng thêm', 'To make a problem, bad situation, or negative feeling worse.', ['aggravate', 'worsen', 'inflame'], ['mitigate', 'alleviate', 'soothe'], 'Deforestation along hillside slopes will only exacerbate seasonal flooding during monsoons.'),
  deplete: W('verb', 'làm cạn kiệt nguồn tài nguyên', 'To use up the supply or resources of something.', ['exhaust', 'consume', 'drain'], ['replenish', 'restore', 'renew'], 'Overfishing in coastal waters threatens to deplete vital marine populations beyond recovery.'),
  replenish: W('verb', 'làm đầy lại, tái tạo', 'To fill something up again or restore a depleted stock.', ['refill', 'renew', 'restore'], ['deplete', 'exhaust', 'empty'], 'Heavy winter snowfall helped replenish mountain reservoirs that had dried up during the summer.'),
  proliferate: W('verb', 'sinh sôi nảy nở nhanh chóng', 'To increase rapidly in numbers; multiply.', ['multiply', 'burgeon', 'flourish'], ['dwindle', 'decline', 'diminish'], 'Algae begin to proliferate rapidly when agricultural runoff introduces excessive nitrogen into the lake.'),
  dwindle: W('verb', 'thu hẹp, suy giảm dần', 'To diminish gradually in size, amount, or strength.', ['diminish', 'decrease', 'shrink'], ['proliferate', 'increase', 'expand'], 'As human settlements expand into savannahs, elephant herds continue to dwindle in size.'),
  volatile: W('adjective', 'dễ biến động, không ổn định', 'Liable to change rapidly and unpredictably, especially for the worse.', ['unstable', 'erratic', 'fickle'], ['stable', 'constant', 'predictable'], 'Desert climates feature highly volatile weather, with blistering daytime heat followed by freezing nights.'),
  precipitate: W('verb', 'gây ra đột ngột, thúc đẩy nhanh', 'To cause an event or situation, typically one that is bad or undesirable, to happen suddenly or unexpectedly.', ['trigger', 'instigate', 'provoke'], ['prevent', 'delay', 'hinder'], 'The abrupt extinction of top predators could precipitate a severe collapse in lower trophic levels.'),
  endemic: W('adjective', 'đặc hữu của một vùng', 'Regularly found among particular people or in a certain area; native and restricted to a certain place.', ['native', 'indigenous', 'restricted'], ['introduced', 'invasive', 'alien'], 'The lemur is an animal endemic to the island of Madagascar and found nowhere else in the wild.'),
  biodiversity: W('noun', 'đa dạng sinh học', 'The variety of life in the world or in a particular habitat or ecosystem.', ['variability', 'variety'], ['uniformity', 'monoculture'], 'Tropical rainforests boast the richest biodiversity of any terrestrial ecosystem on Earth.'),
  degradation: W('noun', 'sự suy thoái đất/môi trường', 'The condition or process of a decline to a lower condition, quality, or level.', ['deterioration', 'decline', 'degeneration'], ['restoration', 'improvement', 'amelioration'], 'Excessive livestock grazing leads to severe soil degradation across arid grasslands.'),
  succumb: W('verb', 'gục ngã, đầu hàng trước dịch bệnh/áp lực', 'To fail to resist pressure, temptation, or an external force like disease.', ['yield', 'submit', 'surrender'], ['resist', 'withstand', 'overcome'], 'Weakened by prolonged drought, many pine trees succumb to invasive bark beetle infestations.'),
  adaptation: W('noun', 'sự thích nghi tiến hóa', 'A change or the process of change by which an organism or species becomes better suited to its environment.', ['adjustment', 'modification', 'acclimation'], ['maladaptation'], 'Camouflage coloration is an evolutionary adaptation that helps insects evade predatory birds.'),
  finite: W('adjective', 'hữu hạn, có giới hạn', 'Having limits or bounds.', ['limited', 'bounded', 'restricted'], ['infinite', 'limitless', 'inexhaustible'], 'Fossil fuels are a(n) finite resource that will eventually be exhausted by modern industry.'),
  inexhaustible: W('adjective', 'vô tận, không bao giờ cạn', 'Unable to be used up or exhausted because existing in abundance.', ['infinite', 'boundless', 'limitless'], ['finite', 'limited', 'scarce'], 'Early explorers mistakenly believed the ocean’s fishery stocks were completely inexhaustible.'),
  flora: W('noun', 'hệ thực vật', 'The plants of a particular region, habitat, or geological period.', ['plant life', 'vegetation'], ['fauna'], 'Botanists cataloged rare alpine flora flourishing on windswept mountain ridges.'),
  fauna: W('noun', 'hệ động vật', 'The animals of a particular region, habitat, or geological period.', ['animal life', 'wildlife'], ['flora'], 'The subterranean cave harbors unique fauna that have evolved without eyesight in total darkness.'),
  contamination: W('noun', 'sự ô nhiễm, nhiễm độc', 'The action or state of making or becoming impure by polluting or poisoning.', ['pollution', 'impurity', 'adulteration'], ['purification', 'cleanliness', 'purity'], 'Industrial runoff caused chemical contamination in the municipal drinking reservoir.'),
  arid: W('adjective', 'khô cằn, hiếm mưa', 'Having little or no rain; too dry or barren to support vegetation.', ['dry', 'parched', 'barren'], ['fertile', 'humid', 'lush'], 'Cactus species thrive in arid desert regions where few other plants can survive.'),
  forage: W('verb', 'tìm kiếm thức ăn trong tự nhiên', 'To search widely for food or provisions.', ['scavenge', 'hunt', 'graze'], [], 'Bears must forage intensively during autumn to build fat reserves before winter hibernation.'),
  disperse: W('verb', 'phát tán, phân tán hạt giống/quần thể', 'To distribute or spread over a wide area.', ['scatter', 'disseminate', 'diffuse'], ['gather', 'concentrate', 'assemble'], 'Dandelion seeds use feathery bristles to disperse widely across meadows on the wind.'),
  canopy: W('noun', 'tầng tán lá rừng', 'The high, continuous upper level of the trees in a forest.', ['treetops', 'overstory', 'cover'], ['understory', 'forest floor'], 'Monkeys spend their entire lives foraging among fruit branches in the rainforest canopy.'),
  pristine: W('adjective', 'nguyên sơ, chưa bị tổn hại', 'In its original condition; unspoiled and clean.', ['unspoiled', 'untouched', 'pure'], ['polluted', 'degraded', 'tarnished'], 'The arctic wilderness remains largely pristine and free from industrial pollution.'),
  terrestrial: W('adjective', 'trên cạn, thuộc đất liền', 'Of, on, or relating to the earth, or living on dry land rather than in water or air.', ['land-dwelling', 'earthly'], ['aquatic', 'marine', 'aerial'], 'Unlike dolphins, otters are semi-aquatic but build their dens on terrestrial riverbanks.'),
  viable: W('adjective', 'có thể tồn tại, có khả năng sống sót', 'Capable of working successfully or surviving under favorable conditions.', ['workable', 'feasible', 'survivable'], ['unviable', 'impractical', 'dead'], 'Conservationists calculated that a population of fifty rhinos was genetically viable over the long term.'),
  sediment: W('noun', 'trầm tích, cặn lắng', 'Matter that settles to the bottom of a liquid, or particulate matter transported by water and wind.', ['silt', 'deposit', 'residue'], [], 'Centuries of river sediment accumulated at the delta, creating nutrient-rich farmland.'),
  carnivore: W('noun', 'động vật ăn thịt', 'An animal that feeds on flesh or meat.', ['meat-eater', 'predator'], ['herbivore'], 'The tiger is an apex carnivore that sits at the top of the tropical food chain.'),
  herbivore: W('noun', 'động vật ăn thực vật', 'An animal that feeds on plants.', ['plant-eater', 'vegetarian'], ['carnivore'], 'The zebra is a grazing herbivore that travels great distances in search of fresh grass.'),
};

export const NEW_THEMES_D: { title: string; blurb: string; words: string[] }[] = [
  {
    title: 'Luận cứ khoa học, kiểm chứng và bác bỏ',
    blurb: 'postulate, anomaly, untenable, conjecture, scrutinize…',
    words: [
      'postulate', 'anomaly', 'untenable', 'conjecture', 'subvert',
      'paradoxical', 'nuance', 'scrutinize', 'discrepancy', 'attenuate',
      'extrapolate', 'salient', 'validity', 'preclude', 'elucidate',
      'rebuttal', 'axiom', 'concur', 'dissent', 'incongruous',
      'confound', 'fallacy', 'antithesis', 'correlate', 'diverge',
      'deduce', 'presuppose', 'tenable', 'corroborating', 'refutation',
      'substantiating', 'substantiation',
    ],
  },
  {
    title: 'Văn học, tâm lý và tính cách nhân vật',
    blurb: 'aloof, gregarious, condescending, disdain, earnest, poignant…',
    words: [
      'aloof', 'gregarious', 'condescending', 'deferential', 'disdain',
      'veneration', 'earnest', 'flippant', 'melancholy', 'loquacious',
      'resolute', 'vacillating', 'indignant', 'complacent', 'cynical',
      'ingenuous', 'ostentatious', 'unpretentious', 'temperament', 'trepidation',
      'solitude', 'wistful', 'impetuous', 'fastidious', 'sardonic',
      'capricious', 'benevolent', 'malevolent', 'penchant', 'animosity',
      'stoic', 'fickle',
    ],
  },
  {
    title: 'Lịch sử, quyền lực và cải cách xã hội',
    blurb: 'sovereignty, autonomy, emancipate, disenfranchise, egalitarian…',
    words: [
      'sovereignty', 'autonomy', 'subjugation', 'emancipate', 'disenfranchise',
      'enfranchise', 'hegemony', 'oppressive', 'egalitarian', 'hierarchical',
      'advocate', 'adversary', 'rhetoric', 'sedition', 'tyranny',
      'insurrection', 'subversion', 'ratify', 'repeal', 'polarization',
      'discourse', 'mandate', 'faction', 'solidarity', 'encroachment',
      'grievance', 'partisanship', 'coercion', 'precedent', 'inalienable',
      'usurp', 'clemency',
    ],
  },
  {
    title: 'Tự nhiên, biến đổi và sinh thái',
    blurb: 'symbiotic, equilibrium, mitigate, deplete, proliferate, biodiversity…',
    words: [
      'symbiotic', 'parasitic', 'equilibrium', 'catalyst', 'mitigate',
      'exacerbate', 'deplete', 'replenish', 'proliferate', 'dwindle',
      'volatile', 'precipitate', 'endemic', 'biodiversity', 'degradation',
      'succumb', 'adaptation', 'finite', 'inexhaustible', 'flora',
      'fauna', 'contamination', 'arid', 'forage', 'disperse',
      'canopy', 'pristine', 'terrestrial', 'viable', 'sediment',
      'carnivore', 'herbivore',
    ],
  },
];

export const MORE = MORE_D;
