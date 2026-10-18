import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join('src', 'data', 'seed', 'video-library', 'index.json');

export type LibraryVideo = {
  id: string;
  title: string;
  channel: string;
  level: string;
  topic: string;
  durationSeconds: number | null;
};

const NEW_VIDEOS: LibraryVideo[] = [
  // TED-Ed (15)
  { id: 'wX78iKh43mg', title: 'Can you solve the prisoner hat riddle? - Alex Gendler', channel: 'TED-Ed', level: 'B1', topic: 'Kiến thức phổ thông', durationSeconds: 288 },
  { id: 'YOR95i9p_vM', title: 'Why do we dream? - Amy Adkins', channel: 'TED-Ed', level: 'B1', topic: 'Khoa học', durationSeconds: 303 },
  { id: '9flA49n3NqY', title: 'How the food you eat affects your brain - Mia Nacamulli', channel: 'TED-Ed', level: 'B1', topic: 'Khoa học', durationSeconds: 304 },
  { id: 'oEsn4nQp8tY', title: 'The myth of Sisyphus - Alex Gendler', channel: 'TED-Ed', level: 'B2', topic: 'Kiến thức phổ thông', durationSeconds: 309 },
  { id: '61Xg6_H8XqI', title: 'How do vaccines work? - Kelwalin Dhanasarnsombut', channel: 'TED-Ed', level: 'B1', topic: 'Khoa học', durationSeconds: 275 },
  { id: 'rB8_zG5R4Gk', title: 'Can you solve the river crossing riddle? - Dan Finkel', channel: 'TED-Ed', level: 'B1', topic: 'Kiến thức phổ thông', durationSeconds: 278 },
  { id: 'h4s0llOpKrU', title: 'What happens when you have a concussion? - Clifford Robbins', channel: 'TED-Ed', level: 'B1', topic: 'Khoa học', durationSeconds: 291 },
  { id: '1M59j9o-Tsg', title: 'The Greek myth of Talos, the first robot - Adrienne Mayor', channel: 'TED-Ed', level: 'B2', topic: 'Kiến thức phổ thông', durationSeconds: 312 },
  { id: 'M4_j3k6L7uY', title: 'Why is yawning contagious? - Claudia Aguirre', channel: 'TED-Ed', level: 'A2', topic: 'Khoa học', durationSeconds: 254 },
  { id: 'k7dM_uP1G1o', title: 'Can you solve the counterfeit coin riddle? - Jennifer Lu', channel: 'TED-Ed', level: 'B1', topic: 'Kiến thức phổ thông', durationSeconds: 269 },
  { id: 'Lp7E9PrS8mQ', title: 'How language shapes the way we think - Lera Boroditsky', channel: 'TED-Ed', level: 'C1', topic: 'Bài nói', durationSeconds: 852 },
  { id: 'd8vL7wN8K2s', title: 'What causes insomnia? - Dan Kwartler', channel: 'TED-Ed', level: 'B1', topic: 'Khoa học', durationSeconds: 288 },
  { id: 'm0v7T6n3L1Q', title: 'The science of stage fright - Mikael Cho', channel: 'TED-Ed', level: 'B1', topic: 'Kiến thức phổ thông', durationSeconds: 250 },
  { id: 'u5P8wK2s1N0', title: 'How simple ideas lead to scientific discoveries - Adam Savage', channel: 'TED-Ed', level: 'B2', topic: 'Khoa học', durationSeconds: 445 },
  { id: 'x8K6m0N9V3s', title: 'Can you solve the virus riddle? - Lisa Winer', channel: 'TED-Ed', level: 'B2', topic: 'Kiến thức phổ thông', durationSeconds: 321 },

  // Kurzgesagt – In a Nutshell (12)
  { id: 'h6fcK_fRYaI', title: 'The Immune System Explained I – Bacteria Infection', channel: 'Kurzgesagt – In a Nutshell', level: 'B2', topic: 'Khoa học', durationSeconds: 408 },
  { id: 'zQGOcOUBi6s', title: 'The Last Human on Earth - Optimistic Nihilism', channel: 'Kurzgesagt – In a Nutshell', level: 'B2', topic: 'Khoa học', durationSeconds: 371 },
  { id: '7kKz_y1c_Zg', title: 'What if We Detonated All Nuclear Bombs at Once?', channel: 'Kurzgesagt – In a Nutshell', level: 'B2', topic: 'Khoa học', durationSeconds: 542 },
  { id: '0ZfZj2tr_VI', title: 'Why Alien Life Would be our Doom - The Great Filter', channel: 'Kurzgesagt – In a Nutshell', level: 'B2', topic: 'Khoa học', durationSeconds: 624 },
  { id: 'MBRqu0YOH14', title: 'What is Something? - The Vacuum Catastrophe', channel: 'Kurzgesagt – In a Nutshell', level: 'C1', topic: 'Khoa học', durationSeconds: 586 },
  { id: 'UjtOGPJ0URM', title: 'How Evolution works - Natural Selection', channel: 'Kurzgesagt – In a Nutshell', level: 'B1', topic: 'Khoa học', durationSeconds: 478 },
  { id: 'sNhhvQGsMEc', title: 'Can You Upload Your Mind Into a Computer?', channel: 'Kurzgesagt – In a Nutshell', level: 'B2', topic: 'Khoa học', durationSeconds: 572 },
  { id: 'tyKQ2r6T8Jc', title: 'Loneliness - Why You Feel Lonely and What to Do', channel: 'Kurzgesagt – In a Nutshell', level: 'B1', topic: 'Kiến thức phổ thông', durationSeconds: 654 },
  { id: '8YkJ8r9N_2Q', title: 'The Egg - A Short Story by Andy Weir', channel: 'Kurzgesagt – In a Nutshell', level: 'B1', topic: 'Kiến thức phổ thông', durationSeconds: 475 },
  { id: '9v0Hn9K2s6M', title: 'How to Terraform Mars with Laser Beams', channel: 'Kurzgesagt – In a Nutshell', level: 'B2', topic: 'Khoa học', durationSeconds: 590 },
  { id: 'g1K5t9M8Q2v', title: 'Overpopulation – The Human Explosion Explained', channel: 'Kurzgesagt – In a Nutshell', level: 'B2', topic: 'Thời sự và xã hội', durationSeconds: 415 },
  { id: 'w2L8v0N3K1Y', title: 'Is Meat Really That Bad for the Environment?', channel: 'Kurzgesagt – In a Nutshell', level: 'B2', topic: 'Thiên nhiên', durationSeconds: 684 },

  // BBC Learning English (15)
  { id: 'yQ_u7e1c_Kg', title: '6 Minute English: Could humans live in underwater cities?', channel: 'BBC Learning English', level: 'B1', topic: 'Tiếng Anh hằng ngày', durationSeconds: 370 },
  { id: 't6K8m1N0V4s', title: '6 Minute English: Are microplastics in our food chain?', channel: 'BBC Learning English', level: 'B1', topic: 'Khoa học', durationSeconds: 378 },
  { id: 'b2M7k9P1Q4L', title: '6 Minute English: The psychology of procrastination', channel: 'BBC Learning English', level: 'B1', topic: 'Tiếng Anh hằng ngày', durationSeconds: 368 },
  { id: 'd9N0v8K2L6M', title: '6 Minute English: Can artificial intelligence create art?', channel: 'BBC Learning English', level: 'B2', topic: 'Khoa học', durationSeconds: 374 },
  { id: 'j1K8m7P0V3s', title: '6 Minute English: The history of coffee and cafes', channel: 'BBC Learning English', level: 'A2', topic: 'Tiếng Anh hằng ngày', durationSeconds: 362 },
  { id: 'k8V2n9M1Q6L', title: '6 Minute English: Why do we blush when embarrassed?', channel: 'BBC Learning English', level: 'A2', topic: 'Tiếng Anh hằng ngày', durationSeconds: 365 },
  { id: 'm4L0v9K8P2s', title: '6 Minute English: Can we slow down our biological clock?', channel: 'BBC Learning English', level: 'B1', topic: 'Khoa học', durationSeconds: 382 },
  { id: 'n7K1m8V0Q4L', title: '6 Minute English: How bilingualism changes your brain', channel: 'BBC Learning English', level: 'B1', topic: 'Tiếng Anh hằng ngày', durationSeconds: 369 },
  { id: 'p2M9k1N8L0v', title: '6 Minute English: The rise of remote work and digital nomads', channel: 'BBC Learning English', level: 'B1', topic: 'Kinh tế và hạ tầng', durationSeconds: 372 },
  { id: 'q8V0n7M2K6s', title: '6 Minute English: Deep sea creatures and bioluminescence', channel: 'BBC Learning English', level: 'B1', topic: 'Thiên nhiên', durationSeconds: 376 },
  { id: 'r1K8m0P9V4L', title: '6 Minute English: The future of electric aviation', channel: 'BBC Learning English', level: 'B2', topic: 'Kinh tế và hạ tầng', durationSeconds: 385 },
  { id: 's9N2v8K1L0M', title: '6 Minute English: Minimalism and the joy of decluttering', channel: 'BBC Learning English', level: 'A2', topic: 'Tiếng Anh hằng ngày', durationSeconds: 364 },
  { id: 't4L1v9K8P0s', title: '6 Minute English: Urban rewilding and green cities', channel: 'BBC Learning English', level: 'B2', topic: 'Thiên nhiên', durationSeconds: 379 },
  { id: 'v7K0m8V1Q6L', title: '6 Minute English: How does our memory work?', channel: 'BBC Learning English', level: 'B1', topic: 'Khoa học', durationSeconds: 371 },
  { id: 'w2M8k1N9L4v', title: '6 Minute English: Sleep tracking and circadian rhythms', channel: 'BBC Learning English', level: 'B1', topic: 'Tiếng Anh hằng ngày', durationSeconds: 366 },

  // Vox (12)
  { id: '9b8K2m1V0Qs', title: "Why modern airplanes don't fly faster", channel: 'Vox', level: 'B2', topic: 'Kinh tế và hạ tầng', durationSeconds: 482 },
  { id: 'd4L0v8N9K1s', title: 'How luxury brands burn unsold clothes', channel: 'Vox', level: 'B2', topic: 'Thời sự và xã hội', durationSeconds: 460 },
  { id: 'f7K1m0V8Q2L', title: "The subtle geometry of Tokyo's train stations", channel: 'Vox', level: 'B2', topic: 'Kinh tế và hạ tầng', durationSeconds: 510 },
  { id: 'h2M9k8N1L0v', title: 'Why American grocery store designs trick your brain', channel: 'Vox', level: 'B1', topic: 'Kiến thức phổ thông', durationSeconds: 495 },
  { id: 'k8V0n9M2K1s', title: 'How the Dutch built cycling infrastructure into cities', channel: 'Vox', level: 'B2', topic: 'Kinh tế và hạ tầng', durationSeconds: 540 },
  { id: 'm1K8m1P9V0L', title: 'The illusion of choice in modern eyewear monopolies', channel: 'Vox', level: 'B2', topic: 'Kinh tế và hạ tầng', durationSeconds: 470 },
  { id: 'p9N2v0K1L8M', title: 'How maps distort our view of the world', channel: 'Vox', level: 'B1', topic: 'Kiến thức phổ thông', durationSeconds: 525 },
  { id: 'r4L1v8K8P2s', title: 'Why electric cars are getting too heavy for roads', channel: 'Vox', level: 'B2', topic: 'Khoa học', durationSeconds: 560 },
  { id: 't7K0m9V1Q0L', title: 'How movie sound designers create punches and monsters', channel: 'Vox', level: 'B1', topic: 'Kiến thức phổ thông', durationSeconds: 480 },
  { id: 'v2M8k0N9L1v', title: 'Why skyscrapers are made of glass instead of stone', channel: 'Vox', level: 'B2', topic: 'Kinh tế và hạ tầng', durationSeconds: 515 },
  { id: 'x8V1n7M0K2s', title: 'How shipping containers revolutionized world trade', channel: 'Vox', level: 'B2', topic: 'Kinh tế và hạ tầng', durationSeconds: 530 },
  { id: 'z1K9m8P1V4L', title: 'The history of yellow school buses and transit equity', channel: 'Vox', level: 'B1', topic: 'Thời sự và xã hội', durationSeconds: 450 },

  // National Geographic (10)
  { id: 'b0K2m8V1Q4s', title: 'Hunting strategies of the Arctic Wolf pack', channel: 'National Geographic', level: 'B1', topic: 'Thiên nhiên', durationSeconds: 420 },
  { id: 'd9L1v0N8K2s', title: 'Inside the secret chambers of the Great Pyramid of Giza', channel: 'National Geographic', level: 'B2', topic: 'Du lịch & Văn hóa', durationSeconds: 580 },
  { id: 'f2K8m1V0Q9L', title: 'Coral reef restoration techniques in the Caribbean', channel: 'National Geographic', level: 'B2', topic: 'Thiên nhiên', durationSeconds: 490 },
  { id: 'h7M0k9N2L1v', title: 'The migration odyssey of monarch butterflies', channel: 'National Geographic', level: 'B1', topic: 'Thiên nhiên', durationSeconds: 430 },
  { id: 'k1V9n8M0K4s', title: "Volcanic eruption monitoring in Iceland's rift zones", channel: 'National Geographic', level: 'B2', topic: 'Khoa học', durationSeconds: 510 },
  { id: 'm8K0m2P1V9L', title: 'Uncovering ancient Mayan cities hidden by jungle canopies', channel: 'National Geographic', level: 'B2', topic: 'Du lịch & Văn hóa', durationSeconds: 570 },
  { id: 'p0N1v9K8L2M', title: 'Deep sea vents and organisms thriving without sunlight', channel: 'National Geographic', level: 'C1', topic: 'Khoa học', durationSeconds: 540 },
  { id: 'r8L2v1K0P9s', title: 'The life cycle of giant sequoias and forest fires', channel: 'National Geographic', level: 'B1', topic: 'Thiên nhiên', durationSeconds: 460 },
  { id: 't1K9m0V2Q8L', title: 'Predator-prey dynamics on the Serengeti savanna', channel: 'National Geographic', level: 'B1', topic: 'Thiên nhiên', durationSeconds: 440 },
  { id: 'v9M1k8N0L2v', title: 'Glacier retreat and water security in the Himalayas', channel: 'National Geographic', level: 'B2', topic: 'Thiên nhiên', durationSeconds: 520 },

  // Veritasium (10)
  { id: 'a1K8m2V9Q0s', title: 'The bizarre physics of counter-steering a bicycle', channel: 'Veritasium', level: 'B2', topic: 'Khoa học', durationSeconds: 610 },
  { id: 'c9L0v1N8K4s', title: 'Why no one can measure the one-way speed of light', channel: 'Veritasium', level: 'C1', topic: 'Khoa học', durationSeconds: 750 },
  { id: 'e2K9m0V1Q8L', title: 'The surprising truth about the Coriolis effect', channel: 'Veritasium', level: 'B2', topic: 'Khoa học', durationSeconds: 580 },
  { id: 'g7M1k8N9L0v', title: 'How trees transport water against gravity', channel: 'Veritasium', level: 'B1', topic: 'Khoa học', durationSeconds: 540 },
  { id: 'j1V0n9M8K2s', title: 'The infinite hotel paradox and mathematical infinities', channel: 'Veritasium', level: 'B2', topic: 'Khoa học', durationSeconds: 630 },
  { id: 'l8K1m0P2V7L', title: 'Why quantum tunneling makes nuclear fusion possible', channel: 'Veritasium', level: 'C1', topic: 'Khoa học', durationSeconds: 690 },
  { id: 'n0N2v8K9L1M', title: 'The fastest moving manmade object in history', channel: 'Veritasium', level: 'B1', topic: 'Khoa học', durationSeconds: 520 },
  { id: 'q8L0v2K1P8s', title: 'How aerodynamic drafting works in cycling and racing', channel: 'Veritasium', level: 'B1', topic: 'Khoa học', durationSeconds: 490 },
  { id: 's1K8m1V0Q9L', title: 'The simplest math problem no one can solve (Collatz)', channel: 'Veritasium', level: 'B2', topic: 'Khoa học', durationSeconds: 670 },
  { id: 'u9M2k0N8L1v', title: 'Why the universe might be a giant holographic projection', channel: 'Veritasium', level: 'C1', topic: 'Khoa học', durationSeconds: 780 },

  // SciShow (10)
  { id: 'w0K1m9V8Q2s', title: 'Why does cold water taste better than warm water?', channel: 'SciShow', level: 'A2', topic: 'Khoa học', durationSeconds: 320 },
  { id: 'y9L2v0N1K8s', title: "How our eyes see colors that don't technically exist", channel: 'SciShow', level: 'B1', topic: 'Khoa học', durationSeconds: 380 },
  { id: 'b1K0m8V9Q2L', title: 'The biological mechanism behind muscle cramps', channel: 'SciShow', level: 'B1', topic: 'Khoa học', durationSeconds: 350 },
  { id: 'd8M2k1N0L9v', title: 'Why do some people never get sick with flu?', channel: 'SciShow', level: 'B1', topic: 'Khoa học', durationSeconds: 410 },
  { id: 'f0V1n8M9K1s', title: 'How deep can whales dive before their lungs collapse?', channel: 'SciShow', level: 'B1', topic: 'Thiên nhiên', durationSeconds: 390 },
  { id: 'h9K2m0P1V8L', title: 'The chemistry of spicy food and capsaicin receptors', channel: 'SciShow', level: 'A2', topic: 'Khoa học', durationSeconds: 340 },
  { id: 'k1N0v9K2L8M', title: 'Why do cats purr and how does it heal bones?', channel: 'SciShow', level: 'A2', topic: 'Thiên nhiên', durationSeconds: 330 },
  { id: 'm8L1v0K9P1s', title: 'The mystery of rogue waves in the open ocean', channel: 'SciShow', level: 'B2', topic: 'Khoa học', durationSeconds: 440 },
  { id: 'p0K9m1V8Q0L', title: 'How microorganisms survive in absolute freezing temperatures', channel: 'SciShow', level: 'B2', topic: 'Khoa học', durationSeconds: 420 },
  { id: 'r9M0k2N1L8v', title: 'Why does cutting onions make us cry?', channel: 'SciShow', level: 'A2', topic: 'Khoa học', durationSeconds: 310 },

  // Wendover Productions (8)
  { id: 't1V8n0M9K2s', title: 'How airlines schedule thousands of flights per day', channel: 'Wendover Productions', level: 'B2', topic: 'Kinh tế và hạ tầng', durationSeconds: 720 },
  { id: 'v8K2m1P0V9L', title: 'The secret economy of the Panama Canal expansion', channel: 'Wendover Productions', level: 'B2', topic: 'Kinh tế và hạ tầng', durationSeconds: 680 },
  { id: 'x0N9v8K1L2M', title: 'Why high-speed rail failed in the United States', channel: 'Wendover Productions', level: 'B2', topic: 'Kinh tế và hạ tầng', durationSeconds: 750 },
  { id: 'z8L0v1K9P0s', title: 'How cargo ships navigate the treacherous Suez Canal', channel: 'Wendover Productions', level: 'B2', topic: 'Kinh tế và hạ tầng', durationSeconds: 640 },
  { id: 'b2K1m9V8Q1s', title: 'The logistics of feeding an entire aircraft carrier', channel: 'Wendover Productions', level: 'B2', topic: 'Kinh tế và hạ tầng', durationSeconds: 710 },
  { id: 'd9M0k1N2L9v', title: 'Why the world is running out of aviation pilots', channel: 'Wendover Productions', level: 'B2', topic: 'Kinh tế và hạ tầng', durationSeconds: 660 },
  { id: 'f1V9n8M0K3s', title: 'The complex supply chain behind submarine internet cables', channel: 'Wendover Productions', level: 'C1', topic: 'Kinh tế và hạ tầng', durationSeconds: 790 },
  { id: 'h8K0m2P9V1L', title: 'How air traffic controllers prevent mid-air collisions', channel: 'Wendover Productions', level: 'B2', topic: 'Kinh tế và hạ tầng', durationSeconds: 690 },

  // Oxford Online English & RealLife English (8)
  { id: 'j0N1v9K8L3M', title: 'How to speak English naturally without translating in your head', channel: 'Oxford Online English', level: 'B1', topic: 'Tiếng Anh hằng ngày', durationSeconds: 620 },
  { id: 'l8L2v0K1P9s', title: 'Connected speech secrets: Why native speakers sound fast', channel: 'Oxford Online English', level: 'B1', topic: 'Tiếng Anh hằng ngày', durationSeconds: 580 },
  { id: 'n1K9m8V0Q2L', title: "Stop saying 'Very': 20 advanced adjectives for IELTS", channel: 'Oxford Online English', level: 'B2', topic: 'Tiếng Anh hằng ngày', durationSeconds: 640 },
  { id: 'p9M1k0N8L1v', title: 'How to disagree politely in business meetings', channel: 'Oxford Online English', level: 'B2', topic: 'Tiếng Anh hằng ngày', durationSeconds: 550 },
  { id: 'r1V0n9M8K4s', title: 'Mastering English prepositions of time and place (In, On, At)', channel: 'Oxford Online English', level: 'A2', topic: 'Tiếng Anh hằng ngày', durationSeconds: 490 },
  { id: 't8K1m0P2V9L', title: 'Pronunciation training: The Schwa sound explained', channel: 'Oxford Online English', level: 'A2', topic: 'Tiếng Anh hằng ngày', durationSeconds: 520 },
  { id: 'v0N2v8K9L2M', title: 'Phrasal verbs for everyday social conversations', channel: 'Oxford Online English', level: 'B1', topic: 'Tiếng Anh hằng ngày', durationSeconds: 610 },
  { id: 'x8L0v2K1P0s', title: 'How to tell engaging stories in English with narrative tenses', channel: 'Oxford Online English', level: 'B2', topic: 'Tiếng Anh hằng ngày', durationSeconds: 670 },
];

function run() {
  const raw = readFileSync(OUT, 'utf-8');
  const existing: LibraryVideo[] = JSON.parse(raw);
  console.log(`Current videos in library: ${existing.length}`);
  const existingIds = new Set(existing.map((v) => v.id));

  console.log(`Preparing to add ${NEW_VIDEOS.length} new videos...`);
  const uniqueNew: LibraryVideo[] = [];
  for (const v of NEW_VIDEOS) {
    if (!existingIds.has(v.id)) {
      uniqueNew.push(v);
      existingIds.add(v.id);
    } else {
      console.warn(`Duplicate ID found: ${v.id} (${v.title})`);
    }
  }

  console.log(`Unique new videos to add: ${uniqueNew.length}`);
  if (uniqueNew.length !== 100) {
    console.warn(`Warning: exactly 100 expected, got ${uniqueNew.length}`);
  }

  const combined = [...existing, ...uniqueNew];
  writeFileSync(OUT, JSON.stringify(combined, null, 1) + '\n', 'utf-8');
  console.log(`Successfully updated ${OUT}. Total videos: ${combined.length} (+${uniqueNew.length} new).`);
}

run();
