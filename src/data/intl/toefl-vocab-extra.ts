import type { VocabEntry } from './vocab-types';

/** Từ vựng TOEFL bổ sung cho unit 11–20. Mỗi ví dụ chứa đúng từ gốc để dùng cho bài điền chữ. */
export const TOEFL_VOCAB_EXTRA: readonly VocabEntry[] = [
  // Unit 11 — địa chất và khí hậu
  { word: 'sediment', pos: 'n', vi: 'trầm tích', en: 'material such as sand or mud that settles at the bottom of water', example: 'Layers of sediment record the region’s history.' },
  { word: 'erosion', pos: 'n', vi: 'xói mòn', en: 'the gradual wearing away of soil and rock by water or wind', example: 'Heavy rain caused severe erosion on the hillside.' },
  { word: 'glacier', pos: 'n', vi: 'sông băng', en: 'a large mass of ice that moves slowly over land', example: 'The glacier has shrunk by a third since 1980.' },
  { word: 'volcano', pos: 'n', vi: 'núi lửa', en: 'a mountain that releases molten rock from beneath the surface', example: 'The volcano last erupted about two hundred years ago.' },
  { word: 'atmosphere', pos: 'n', vi: 'khí quyển', en: 'the layer of gases surrounding a planet', example: 'Carbon dioxide traps heat in the atmosphere.' },
  { word: 'climate', pos: 'n', vi: 'khí hậu', en: 'the typical weather of a region over many years', example: 'The climate of the coast is mild and humid.' },
  { word: 'fossil', pos: 'n', vi: 'hoá thạch', en: 'the preserved remains or traces of an ancient living thing', example: 'The fossil shows that the bird had sharp teeth.' },
  { word: 'mineral', pos: 'n', vi: 'khoáng chất', en: 'a naturally occurring solid substance with a fixed composition', example: 'Quartz is a common mineral in granite.' },
  { word: 'rainfall', pos: 'n', vi: 'lượng mưa', en: 'the amount of rain that falls in an area over a period', example: 'Annual rainfall has decreased in the southern region.' },
  { word: 'tectonic', pos: 'adj', vi: 'thuộc kiến tạo địa chất', en: 'relating to the movement of the Earth’s crust', example: 'Tectonic activity created the mountain range.' },

  // Unit 12 — thiên văn và vật lý
  { word: 'galaxy', pos: 'n', vi: 'thiên hà', en: 'a huge system of stars, gas and dust held together by gravity', example: 'Our galaxy contains hundreds of billions of stars.' },
  { word: 'orbit', pos: 'n', vi: 'quỹ đạo', en: 'the curved path of an object around a star or planet', example: 'The satellite completes one orbit every ninety minutes.' },
  { word: 'radiation', pos: 'n', vi: 'bức xạ', en: 'energy released as waves or particles', example: 'Solar radiation warms the surface of the planet.' },
  { word: 'gravity', pos: 'n', vi: 'trọng lực', en: 'the force that attracts objects toward one another', example: 'Gravity keeps the moon in orbit around the Earth.' },
  { word: 'particle', pos: 'n', vi: 'hạt', en: 'a very small piece of matter', example: 'Each particle carries a small electric charge.' },
  { word: 'energy', pos: 'n', vi: 'năng lượng', en: 'the capacity to do work or cause change', example: 'Plants convert light energy into chemical energy.' },
  { word: 'density', pos: 'n', vi: 'mật độ; tỉ trọng', en: 'the mass of a substance per unit of volume', example: 'Water has a higher density than oil.' },
  { word: 'momentum', pos: 'n', vi: 'động lượng; đà', en: 'the quantity of motion an object has', example: 'The ball keeps its momentum after the collision.' },
  { word: 'telescope', pos: 'n', vi: 'kính thiên văn', en: 'an instrument that makes distant objects appear larger and clearer', example: 'A new telescope will map the sky in infrared.' },
  { word: 'celestial', pos: 'adj', vi: 'thuộc thiên thể', en: 'relating to stars, planets and other objects in space', example: 'Astronomers recorded the movements of celestial bodies.' },

  // Unit 13 — hoá học và vật liệu
  { word: 'compound', pos: 'n', vi: 'hợp chất', en: 'a substance made of two or more elements chemically combined', example: 'Water is a compound of hydrogen and oxygen.' },
  { word: 'molecule', pos: 'n', vi: 'phân tử', en: 'the smallest unit of a compound that keeps its properties', example: 'Each molecule contains two atoms of hydrogen.' },
  { word: 'element', pos: 'n', vi: 'nguyên tố', en: 'a pure substance that cannot be broken down chemically', example: 'Carbon is an element found in all living things.' },
  { word: 'reaction', pos: 'n', vi: 'phản ứng', en: 'a chemical change in which substances combine or separate', example: 'The reaction releases heat and a gas.' },
  { word: 'catalyst', pos: 'n', vi: 'chất xúc tác', en: 'a substance that speeds up a reaction without being used up', example: 'The catalyst lowers the temperature needed for the reaction.' },
  { word: 'solvent', pos: 'n', vi: 'dung môi', en: 'a liquid that dissolves another substance', example: 'Water is a common solvent for salts.' },
  { word: 'polymer', pos: 'n', vi: 'polyme', en: 'a large molecule made of many repeated smaller units', example: 'Plastic is a synthetic polymer.' },
  { word: 'alloy', pos: 'n', vi: 'hợp kim', en: 'a metal mixed with one or more other elements', example: 'Bronze is an alloy of copper and tin.' },
  { word: 'acid', pos: 'n', vi: 'axit', en: 'a substance that releases hydrogen ions in water', example: 'Lemon juice contains a weak acid.' },
  { word: 'oxidation', pos: 'n', vi: 'sự ô-xy hoá', en: 'a chemical reaction in which a substance combines with oxygen', example: 'Oxidation causes iron to rust.' },

  // Unit 14 — sinh thái và động vật
  { word: 'habitat', pos: 'n', vi: 'môi trường sống', en: 'the natural place where an animal or plant lives', example: 'The wetland is the habitat of many migrating birds.' },
  { word: 'predator', pos: 'n', vi: 'động vật săn mồi', en: 'an animal that hunts and eats other animals', example: 'An owl is a major predator of mice.' },
  { word: 'prey', pos: 'n', vi: 'con mồi', en: 'an animal that is hunted and eaten by another', example: 'The cheetah chases its prey across the plain.' },
  { word: 'migration', pos: 'n', vi: 'sự di cư', en: 'the regular movement of animals from one region to another', example: 'The migration of whales takes place every winter.' },
  { word: 'ecosystem', pos: 'n', vi: 'hệ sinh thái', en: 'a community of living things and their physical environment', example: 'Coral reefs form a rich and delicate ecosystem.' },
  { word: 'camouflage', pos: 'n', vi: 'ngụy trang', en: 'colouring or shape that helps an animal blend into its surroundings', example: 'The insect’s camouflage makes it hard to see on bark.' },
  { word: 'population', pos: 'n', vi: 'quần thể; dân số', en: 'the number of living things of one kind in an area', example: 'The bird population has doubled since the reserve opened.' },
  { word: 'herbivore', pos: 'n', vi: 'động vật ăn cỏ', en: 'an animal that eats only plants', example: 'A deer is a herbivore that feeds on grass and leaves.' },
  { word: 'carnivore', pos: 'n', vi: 'động vật ăn thịt', en: 'an animal that eats mainly meat', example: 'A wolf is a carnivore that hunts in packs.' },
  { word: 'pollinate', pos: 'v', vi: 'thụ phấn', en: 'to transfer pollen to a flower so that it can produce seed', example: 'Bees pollinate many crops in the region.' },

  // Unit 15 — chính trị và quản trị
  { word: 'legislation', pos: 'n', vi: 'luật pháp', en: 'laws passed by a government or parliament', example: 'New legislation requires factories to filter their waste.' },
  { word: 'democracy', pos: 'n', vi: 'nền dân chủ', en: 'a system of government in which citizens vote for their leaders', example: 'Democracy depends on a free press and fair elections.' },
  { word: 'constitution', pos: 'n', vi: 'hiến pháp', en: 'the basic laws that set out how a country is governed', example: 'The constitution guarantees freedom of speech.' },
  { word: 'election', pos: 'n', vi: 'cuộc bầu cử', en: 'a formal process of choosing leaders by vote', example: 'The election results were announced on Sunday.' },
  { word: 'citizen', pos: 'n', vi: 'công dân', en: 'a legal member of a country or state', example: 'Every citizen over eighteen may vote.' },
  { word: 'sovereignty', pos: 'n', vi: 'chủ quyền', en: 'the authority of a state to govern itself', example: 'The treaty respects the sovereignty of each nation.' },
  { word: 'diplomacy', pos: 'n', vi: 'ngoại giao', en: 'the conduct of relations between nations through negotiation', example: 'Diplomacy helped resolve the border dispute.' },
  { word: 'reform', pos: 'n', vi: 'cải cách', en: 'a change made to improve a system or institution', example: 'The reform cut the time needed to register a business.' },
  { word: 'authority', pos: 'n', vi: 'thẩm quyền; cơ quan', en: 'the power to make decisions or enforce rules', example: 'The local authority controls the public parks.' },
  { word: 'regulation', pos: 'n', vi: 'quy định', en: 'an official rule made to control an activity', example: 'New regulation limits the amount of noise at night.' },

  // Unit 16 — giáo dục và học tập
  { word: 'curriculum', pos: 'n', vi: 'chương trình học', en: 'the set of courses taught by a school or university', example: 'The curriculum now includes data science.' },
  { word: 'scholarship', pos: 'n', vi: 'học bổng', en: 'money given to a student to help pay for study', example: 'She won a scholarship to study in Canada.' },
  { word: 'literacy', pos: 'n', vi: 'khả năng đọc viết', en: 'the ability to read and write', example: 'Adult literacy programs reached thousands of people.' },
  { word: 'seminar', pos: 'n', vi: 'buổi thảo luận nhóm', en: 'a small class in which students discuss a topic in depth', example: 'Each seminar has about fifteen students.' },
  { word: 'graduate', pos: 'v', vi: 'tốt nghiệp', en: 'to complete a course of study at a school or university', example: 'Most students graduate after four years.' },
  { word: 'assignment', pos: 'n', vi: 'bài tập', en: 'a piece of work set for a student to complete', example: 'The assignment is due on the last day of term.' },
  { word: 'instruction', pos: 'n', vi: 'sự giảng dạy', en: 'teaching or guidance given to learners', example: 'Instruction is given in small groups.' },
  { word: 'lecture', pos: 'n', vi: 'bài giảng', en: 'a talk given to students on a subject', example: 'The lecture covers the history of the printing press.' },
  { word: 'academic', pos: 'adj', vi: 'thuộc học thuật', en: 'relating to schools, colleges and research', example: 'The academic year begins in September.' },
  { word: 'tutorial', pos: 'n', vi: 'buổi hướng dẫn nhỏ', en: 'a small class led by a tutor', example: 'Attendance at the tutorial is recommended.' },

  // Unit 17 — nghệ thuật và văn học
  { word: 'novel', pos: 'n', vi: 'tiểu thuyết', en: 'a long fictional story in book form', example: 'She is writing a novel about a family in Hue.' },
  { word: 'poetry', pos: 'n', vi: 'thơ ca', en: 'literary works written in verse', example: 'Poetry often uses images and rhythm.' },
  { word: 'sculpture', pos: 'n', vi: 'điêu khắc', en: 'art made by carving, shaping or assembling materials', example: 'The sculpture stands in the centre of the square.' },
  { word: 'painting', pos: 'n', vi: 'hội hoạ', en: 'a picture made with paint on a surface', example: 'The painting shows a harbour at sunset.' },
  { word: 'composition', pos: 'n', vi: 'tác phẩm; bố cục', en: 'a piece of music or art, or the arrangement of its parts', example: 'The composition has three distinct movements.' },
  { word: 'narrative', pos: 'n', vi: 'câu chuyện; lối tự sự', en: 'a story or account of a sequence of events', example: 'The narrative is told from the point of view of a child.' },
  { word: 'symbolism', pos: 'n', vi: 'chủ nghĩa biểu tượng', en: 'the use of symbols to express ideas', example: 'Symbolism runs throughout the poem.' },
  { word: 'genre', pos: 'n', vi: 'thể loại', en: 'a category of art or literature with a shared style', example: 'Science fiction is a popular genre.' },
  { word: 'critic', pos: 'n', vi: 'nhà phê bình', en: 'a person who judges and analyzes works of art', example: 'The critic praised the film’s simple style.' },
  { word: 'manuscript', pos: 'n', vi: 'bản thảo', en: 'a handwritten or typed text before it is published', example: 'The manuscript was rediscovered in an old library.' },

  // Unit 18 — ngôn ngữ và giao tiếp
  { word: 'dialect', pos: 'n', vi: 'phương ngữ', en: 'a form of a language used in one region or group', example: 'Each dialect has its own vocabulary.' },
  { word: 'vocabulary', pos: 'n', vi: 'từ vựng', en: 'the set of words known or used by a person or group', example: 'Her vocabulary grew quickly after she started reading.' },
  { word: 'syntax', pos: 'n', vi: 'cú pháp', en: 'the rules that govern how words are arranged into sentences', example: 'English syntax usually places the subject before the verb.' },
  { word: 'grammar', pos: 'n', vi: 'ngữ pháp', en: 'the rules for forming words and sentences in a language', example: 'The grammar of this sentence is incorrect.' },
  { word: 'pronunciation', pos: 'n', vi: 'cách phát âm', en: 'the way a word is said', example: 'Pronunciation is the hardest part for many learners.' },
  { word: 'linguistic', pos: 'adj', vi: 'thuộc ngôn ngữ học', en: 'relating to language and its structure', example: 'The study compares linguistic patterns across three languages.' },
  { word: 'phrase', pos: 'n', vi: 'cụm từ', en: 'a group of words that forms a unit of meaning', example: 'The phrase “at a glance” means quickly.' },
  { word: 'metaphor', pos: 'n', vi: 'ẩn dụ', en: 'a figure of speech that describes one thing as if it were another', example: 'The poet uses a metaphor of a river for time.' },
  { word: 'translation', pos: 'n', vi: 'bản dịch', en: 'the act or result of changing text from one language to another', example: 'The translation keeps the humor of the original.' },
  { word: 'dialogue', pos: 'n', vi: 'đối thoại', en: 'conversation between two or more people in a text or film', example: 'The dialogue reveals the characters’ tensions.' },

  // Unit 19 — đô thị và kiến trúc
  { word: 'urban', pos: 'adj', vi: 'thuộc đô thị', en: 'relating to cities and towns', example: 'Urban areas attract people looking for work.' },
  { word: 'infrastructure', pos: 'n', vi: 'hạ tầng', en: 'the basic systems of roads, power and water in a place', example: 'Investment in infrastructure improved transport across the city.' },
  { word: 'architecture', pos: 'n', vi: 'kiến trúc', en: 'the art and science of designing buildings', example: 'The architecture of the station reflects the Art Deco style.' },
  { word: 'skyline', pos: 'n', vi: 'đường chân trời thành phố', en: 'the outline of buildings against the sky', example: 'The new tower changed the city’s skyline.' },
  { word: 'construction', pos: 'n', vi: 'xây dựng', en: 'the process of building something', example: 'Construction of the bridge took four years.' },
  { word: 'district', pos: 'n', vi: 'quận; khu vực', en: 'a part of a city with its own character', example: 'The old district is full of small cafes.' },
  { word: 'zoning', pos: 'n', vi: 'quy hoạch phân khu', en: 'rules that decide how land in an area may be used', example: 'Zoning laws limit the height of new buildings.' },
  { word: 'transit', pos: 'n', vi: 'giao thông công cộng', en: 'the movement of people or goods by public transport', example: 'Public transit connects the suburbs to the city center.' },
  { word: 'landmark', pos: 'n', vi: 'công trình nổi tiếng', en: 'a building or feature that is easily recognized in a place', example: 'The cathedral is a landmark of the city.' },
  { word: 'monument', pos: 'n', vi: 'đài tưởng niệm', en: 'a statue or building that commemorates a person or event', example: 'The monument honors soldiers who died in the war.' },

  // Unit 20 — truyền thông và thông tin
  { word: 'journalism', pos: 'n', vi: 'báo chí', en: 'the work of collecting and reporting news', example: 'Journalism requires careful checking of facts.' },
  { word: 'broadcast', pos: 'n', vi: 'chương trình phát sóng', en: 'a programme sent out by radio or television', example: 'The broadcast reached millions of viewers.' },
  { word: 'publication', pos: 'n', vi: 'ấn phẩm', en: 'a book, magazine or newspaper issued to the public', example: 'The publication is printed every month.' },
  { word: 'editor', pos: 'n', vi: 'biên tập viên', en: 'a person who prepares written material for publication', example: 'The editor cut the article to half its length.' },
  { word: 'circulation', pos: 'n', vi: 'lượng phát hành', en: 'the number of copies of a publication that are sold', example: 'The newspaper’s circulation has fallen in recent years.' },
  { word: 'headline', pos: 'n', vi: 'tiêu đề', en: 'the title of a news article, printed in large type', example: 'The headline caught everyone’s attention.' },
  { word: 'documentary', pos: 'n', vi: 'phim tài liệu', en: 'a film that presents facts about real events', example: 'The documentary examines the history of the canal.' },
  { word: 'encyclopedia', pos: 'n', vi: 'bách khoa toàn thư', en: 'a reference book covering many subjects', example: 'The encyclopedia entry explains the basics of photosynthesis.' },
  { word: 'censorship', pos: 'n', vi: 'kiểm duyệt', en: 'control of information by an authority', example: 'Censorship limits what reporters are allowed to publish.' },
  { word: 'propaganda', pos: 'n', vi: 'tuyên truyền', en: 'information spread to promote a political cause', example: 'The leaflets were a form of propaganda.' },
];
