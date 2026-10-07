import type { ListeningGroup, ListeningSection, ListeningTest, TranscriptLine } from '@/services/listening/types';

type Topic = {
  category: string;
  title: string;
  venue: string;
  event: string;
  focus: string;
  weekday: string;
  room: string;
  groupSize: number;
  fee: number;
  weeks: number;
  item: string;
  result: string;
  obstacle: string;
};

/** These are original practice materials written for Band 9, not book content. */
const TOPICS: Topic[] = [
  { category: 'Campus & study', title: 'Study skills and peer learning', venue: 'Riverside Learning Hub', event: 'a peer-learning workshop', focus: 'how students plan independent study', weekday: 'Tuesday', room: 'Room 204', groupSize: 12, fee: 18, weeks: 4, item: 'a notebook', result: 'a shared revision plan', obstacle: 'irregular study routines' },
  { category: 'Campus & study', title: 'The future of public libraries', venue: 'Northgate Library', event: 'a library research session', focus: 'how public libraries support local learners', weekday: 'Wednesday', room: 'the Map Room', groupSize: 10, fee: 12, weeks: 3, item: 'a library card', result: 'a guide to reliable sources', obstacle: 'limited evening access' },
  { category: 'Campus & study', title: 'Fieldwork for urban ecology', venue: 'City College', event: 'an urban ecology field course', focus: 'small habitats within built-up areas', weekday: 'Saturday', room: 'the East Lab', groupSize: 8, fee: 25, weeks: 5, item: 'a water bottle', result: 'a neighbourhood habitat map', obstacle: 'weather-dependent observations' },
  { category: 'Campus & study', title: 'Learning a language through exchange', venue: 'Westbrook College', event: 'a language exchange evening', focus: 'peer conversation and vocabulary growth', weekday: 'Thursday', room: 'the Media Room', groupSize: 16, fee: 9, weeks: 6, item: 'a photo ID', result: 'a personal speaking log', obstacle: 'uneven confidence among partners' },
  { category: 'Campus & study', title: 'Designing accessible classrooms', venue: 'Harbour Institute', event: 'an inclusive classroom seminar', focus: 'practical changes that make lessons easier to access', weekday: 'Monday', room: 'Studio 3', groupSize: 14, fee: 20, weeks: 2, item: 'a tablet', result: 'an accessibility checklist', obstacle: 'different needs within one class' },

  { category: 'Work & careers', title: 'Preparing for a first interview', venue: 'Central Careers Centre', event: 'a first-interview clinic', focus: 'clear examples in entry-level interviews', weekday: 'Friday', room: 'the Career Suite', groupSize: 10, fee: 15, weeks: 2, item: 'a printed CV', result: 'a practice interview plan', obstacle: 'nerves under time pressure' },
  { category: 'Work & careers', title: 'Skills for remote teamwork', venue: 'Foundry Workspace', event: 'a remote teamwork workshop', focus: 'communication across distributed teams', weekday: 'Tuesday', room: 'the Bridge Room', groupSize: 12, fee: 22, weeks: 3, item: 'headphones', result: 'a team communication charter', obstacle: 'unclear handovers' },
  { category: 'Work & careers', title: 'Apprenticeships in clean energy', venue: 'Greenline Training Centre', event: 'a clean-energy careers day', focus: 'technical routes into the energy sector', weekday: 'Thursday', room: 'Workshop 1', groupSize: 20, fee: 0, weeks: 1, item: 'work gloves', result: 'a list of apprenticeship providers', obstacle: 'a shortage of local placements' },
  { category: 'Work & careers', title: 'Building a portfolio career', venue: 'Market Street Studio', event: 'a freelance planning course', focus: 'balancing several sources of work', weekday: 'Wednesday', room: 'the Loft', groupSize: 9, fee: 30, weeks: 4, item: 'a laptop', result: 'a monthly income planner', obstacle: 'unpredictable workloads' },
  { category: 'Work & careers', title: 'Mentoring across generations', venue: 'Oakfield Enterprise Centre', event: 'a workplace mentoring session', focus: 'how colleagues share practical knowledge', weekday: 'Monday', room: 'the Forum', groupSize: 18, fee: 14, weeks: 3, item: 'a question list', result: 'a six-month mentoring outline', obstacle: 'limited time for regular meetings' },

  { category: 'Travel & places', title: 'Making city buses easier to use', venue: 'City Transport Museum', event: 'a public transport planning walk', focus: 'signs and information at bus interchanges', weekday: 'Saturday', room: 'the Map Gallery', groupSize: 15, fee: 11, weeks: 2, item: 'a travel card', result: 'a revised passenger map', obstacle: 'confusing route changes' },
  { category: 'Travel & places', title: 'Walking routes through old towns', venue: 'Old Quay Visitor Centre', event: 'a heritage walking tour', focus: 'how local routes connect historic places', weekday: 'Sunday', room: 'the Courtyard', groupSize: 14, fee: 8, weeks: 1, item: 'comfortable shoes', result: 'a self-guided route leaflet', obstacle: 'uneven pavement surfaces' },
  { category: 'Travel & places', title: 'Tourism beyond the peak season', venue: 'Lakeside Travel Forum', event: 'a low-season tourism workshop', focus: 'visitor services outside the summer months', weekday: 'Wednesday', room: 'Room 6', groupSize: 11, fee: 19, weeks: 3, item: 'a calendar', result: 'a seasonal visitor plan', obstacle: 'businesses closing in winter' },
  { category: 'Travel & places', title: 'Cycling safely to work', venue: 'East Borough Mobility Centre', event: 'a commuter cycling course', focus: 'safer links between homes and workplaces', weekday: 'Tuesday', room: 'the Bike Lab', groupSize: 10, fee: 16, weeks: 3, item: 'a helmet', result: 'a safer cycling route', obstacle: 'gaps in protected lanes' },
  { category: 'Travel & places', title: 'How museums welcome visitors', venue: 'Harbour City Museum', event: 'a visitor experience tour', focus: 'wayfinding and interpretation in museums', weekday: 'Friday', room: 'the North Foyer', groupSize: 13, fee: 13, weeks: 2, item: 'a sketchbook', result: 'a visitor feedback summary', obstacle: 'crowding around popular displays' },

  { category: 'Environment', title: 'Restoring a neighbourhood stream', venue: 'Willow Creek Centre', event: 'a stream restoration day', focus: 'ways to improve a small urban waterway', weekday: 'Saturday', room: 'the Field Room', groupSize: 12, fee: 7, weeks: 4, item: 'wellies', result: 'a stream monitoring chart', obstacle: 'runoff after heavy rain' },
  { category: 'Environment', title: 'Reducing food waste at home', venue: 'Green Basket Kitchen', event: 'a food-waste cooking class', focus: 'storage and meal planning at home', weekday: 'Thursday', room: 'the Demonstration Kitchen', groupSize: 10, fee: 17, weeks: 2, item: 'a container', result: 'a weekly meal plan', obstacle: 'confusion over date labels' },
  { category: 'Environment', title: 'Community gardens and biodiversity', venue: 'Southside Garden Centre', event: 'a community gardening course', focus: 'creating wildlife-friendly shared spaces', weekday: 'Sunday', room: 'the Greenhouse', groupSize: 16, fee: 10, weeks: 5, item: 'gardening gloves', result: 'a pollinator planting plan', obstacle: 'dry soil in the warmer months' },
  { category: 'Environment', title: 'Repair cafés and the circular economy', venue: 'Mill Lane Workshop', event: 'a repair café introduction', focus: 'extending the useful life of household goods', weekday: 'Monday', room: 'Bench 4', groupSize: 8, fee: 6, weeks: 3, item: 'a small appliance', result: 'a basic repair guide', obstacle: 'replacement parts that are hard to find' },
  { category: 'Environment', title: 'Preparing towns for hotter summers', venue: 'Civic Climate Office', event: 'a climate-ready streets workshop', focus: 'shade and cooling in public spaces', weekday: 'Wednesday', room: 'the Council Chamber', groupSize: 18, fee: 21, weeks: 4, item: 'a sun hat', result: 'a shade priority map', obstacle: 'limited space for new trees' },

  { category: 'Science & technology', title: 'Everyday uses of satellite data', venue: 'North Science Centre', event: 'a satellite mapping lecture', focus: 'how remote sensing supports daily decisions', weekday: 'Tuesday', room: 'the Planet Room', groupSize: 24, fee: 12, weeks: 1, item: 'a phone', result: 'a local data story', obstacle: 'cloud cover in some images' },
  { category: 'Science & technology', title: 'Designing safer apps for children', venue: 'Digital Futures Lab', event: 'a child-safe app design workshop', focus: 'privacy choices in apps used by young people', weekday: 'Friday', room: 'the Usability Lab', groupSize: 12, fee: 28, weeks: 3, item: 'a laptop', result: 'a child-friendly privacy checklist', obstacle: 'settings that are hard to understand' },
  { category: 'Science & technology', title: 'Robots in hospital logistics', venue: 'Westgate Medical School', event: 'a medical robotics open day', focus: 'automated delivery inside hospitals', weekday: 'Thursday', room: 'the Simulation Ward', groupSize: 20, fee: 0, weeks: 1, item: 'a visitor badge', result: 'a hospital route diagram', obstacle: 'shared corridors at busy times' },
  { category: 'Science & technology', title: 'How cities measure air quality', venue: 'Airwatch Research Unit', event: 'an air quality data session', focus: 'interpreting local pollution measurements', weekday: 'Monday', room: 'Lab 2', groupSize: 9, fee: 24, weeks: 2, item: 'a calculator', result: 'a sensor location proposal', obstacle: 'readings that vary with wind' },
  { category: 'Science & technology', title: 'The hidden work of digital archives', venue: 'County Records Lab', event: 'a digital archiving seminar', focus: 'preserving born-digital records', weekday: 'Wednesday', room: 'the Archive Studio', groupSize: 11, fee: 18, weeks: 3, item: 'a USB drive', result: 'a file preservation checklist', obstacle: 'formats that quickly become obsolete' },

  { category: 'Health & society', title: 'Designing calmer public spaces', venue: 'Meadow Health Centre', event: 'a sensory-friendly design walk', focus: 'how sound and lighting affect comfort', weekday: 'Saturday', room: 'the Quiet Room', groupSize: 10, fee: 14, weeks: 2, item: 'earplugs', result: 'a calmer-space checklist', obstacle: 'background noise from traffic' },
  { category: 'Health & society', title: 'Food traditions and family memory', venue: 'Community Table Hall', event: 'a food memory storytelling session', focus: 'the role of recipes in family histories', weekday: 'Sunday', room: 'the Garden Hall', groupSize: 15, fee: 9, weeks: 2, item: 'a recipe card', result: 'a shared community cookbook', obstacle: 'recipes passed on without measurements' },
  { category: 'Health & society', title: 'Supporting people who live alone', venue: 'Cedar Grove Advice Centre', event: 'a social connection forum', focus: 'small ways to strengthen local support', weekday: 'Tuesday', room: 'Room 12', groupSize: 17, fee: 5, weeks: 3, item: 'a phone number list', result: 'a weekly contact network', obstacle: 'people not knowing what help exists' },
  { category: 'Health & society', title: 'Sleep routines for shift workers', venue: 'Harbour Occupational Health', event: 'a sleep and shift-work session', focus: 'rest routines for changing work hours', weekday: 'Thursday', room: 'the Rest Lab', groupSize: 12, fee: 20, weeks: 2, item: 'an eye mask', result: 'a personal rest schedule', obstacle: 'daylight during daytime sleep' },
  { category: 'Health & society', title: 'Making community sport inclusive', venue: 'Parkview Sports Hall', event: 'an inclusive sport taster day', focus: 'adapting activities for mixed abilities', weekday: 'Friday', room: 'Court B', groupSize: 20, fee: 8, weeks: 4, item: 'trainers', result: 'an inclusive activity plan', obstacle: 'equipment designed for one body type' },

  { category: 'Arts & culture', title: 'Soundscapes of the seaside', venue: 'Coastal Arts Workshop', event: 'a field recording class', focus: 'recording everyday sounds by the coast', weekday: 'Saturday', room: 'Studio 2', groupSize: 9, fee: 26, weeks: 2, item: 'a pair of headphones', result: 'a short coastal sound piece', obstacle: 'wind noise on recordings' },
  { category: 'Arts & culture', title: 'Restoring photographs from family albums', venue: 'East End Heritage House', event: 'a family photograph workshop', focus: 'caring for and describing old photographs', weekday: 'Wednesday', room: 'the Darkroom', groupSize: 8, fee: 16, weeks: 3, item: 'cotton gloves', result: 'a labelled family photo set', obstacle: 'missing names and dates' },
  { category: 'Arts & culture', title: 'Public art and local identity', venue: 'Station Square Gallery', event: 'a public art discussion', focus: 'how shared artworks shape a place', weekday: 'Monday', room: 'the Gallery Café', groupSize: 19, fee: 10, weeks: 1, item: 'a notebook', result: 'a local artwork proposal', obstacle: 'different opinions about public space' },
  { category: 'Arts & culture', title: 'The craft of documentary photography', venue: 'Beacon Photography School', event: 'a documentary photography class', focus: 'building a story from a sequence of images', weekday: 'Thursday', room: 'the Light Studio', groupSize: 10, fee: 32, weeks: 5, item: 'a camera', result: 'a five-image photo essay', obstacle: 'getting permission to photograph people' },
  { category: 'Arts & culture', title: 'Why small theatres matter', venue: 'Lantern Theatre', event: 'a backstage theatre tour', focus: 'the role of small venues in new writing', weekday: 'Friday', room: 'the Green Room', groupSize: 14, fee: 12, weeks: 2, item: 'a torch', result: 'a short audience survey', obstacle: 'rising production costs' },

  { category: 'Community & services', title: 'Emergency planning for apartment buildings', venue: 'North Block Residents Centre', event: 'a building safety briefing', focus: 'clear emergency information for residents', weekday: 'Tuesday', room: 'the Residents Lounge', groupSize: 22, fee: 0, weeks: 1, item: 'a torch', result: 'a floor-by-floor contact sheet', obstacle: 'outdated contact details' },
  { category: 'Community & services', title: 'Sharing tools across a neighbourhood', venue: 'Common Ground Shed', event: 'a neighbourhood tool library session', focus: 'lending equipment between households', weekday: 'Saturday', room: 'the Tool Store', groupSize: 12, fee: 7, weeks: 3, item: 'a tool to donate', result: 'a shared tool catalogue', obstacle: 'items returned late' },
  { category: 'Community & services', title: 'Helping new residents find local support', venue: 'Welcome Point Centre', event: 'a local services orientation', focus: 'making essential local services easier to find', weekday: 'Wednesday', room: 'the Welcome Room', groupSize: 16, fee: 0, weeks: 2, item: 'proof of address', result: 'a multilingual service map', obstacle: 'information spread across many websites' },
  { category: 'Community & services', title: 'Volunteers and local food banks', venue: 'Harvest Street Pantry', event: 'a food bank volunteer induction', focus: 'organising donations with dignity', weekday: 'Monday', room: 'the Packing Room', groupSize: 18, fee: 0, weeks: 2, item: 'closed shoes', result: 'a clearer stock rotation plan', obstacle: 'donations arriving unpredictably' },
  { category: 'Community & services', title: 'Making council information clearer', venue: 'Civic Information Office', event: 'a plain-language writing clinic', focus: 'clearer letters and online notices', weekday: 'Thursday', room: 'Room 5', groupSize: 13, fee: 15, weeks: 3, item: 'a sample letter', result: 'a plain-language rewrite', obstacle: 'technical wording in official notices' },
];

const pad = (n: number) => String(n).padStart(2, '0');
const lines = (...items: [string, string][]): TranscriptLine[] => items.map(([speaker, text]) => ({ speaker, text }));
const question = (n: number, answer: ListeningGroup['questions'][number]['answer'], extra: Partial<ListeningGroup['questions'][number]> = {}) => ({ n, answer, ...extra });
const options = (...texts: string[]) => texts.map((text, i) => ({ key: String.fromCharCode(65 + i), text }));

function buildSection1(t: Topic): ListeningSection {
  const transcript = lines(
    ['Receptionist', `Good morning, ${t.venue}. How can I help?`],
    ['Caller', `Hello. I would like to book ${t.event}. My surname is Morgan.`],
    ['Receptionist', `Certainly, Ms Morgan. The next session is on ${t.weekday}, in ${t.room}. It begins at six in the evening.`],
    ['Caller', 'I have not visited the centre before. Is the entrance on the main road?'],
    ['Receptionist', 'The main entrance faces the small garden, beside the number 32 bus stop. The car park is around the back, but spaces are limited after five.'],
    ['Caller', 'Could I bring my study group?'],
    ['Receptionist', `Yes, but each group is limited to ${t.groupSize} people. The fee is £${t.fee} per person.`],
    ['Caller', 'Do we have to pay today?'],
    ['Receptionist', 'A deposit is enough to hold the places. Please pay the balance at the desk when you arrive; we do not take cash by phone.'],
    ['Caller', 'What does that include?'],
    ['Receptionist', `It includes the activity materials and a follow-up handout. Refreshments are not included.`],
    ['Caller', 'How early should we get there?'],
    ['Receptionist', 'The doors open at five forty-five. Arriving ten minutes early gives everyone time to sign in, especially if it is your first visit.'],
    ['Caller', 'Is there anything I should bring?'],
    ['Receptionist', `Please bring ${t.item}. You will receive a booking code, ${t.weekday.slice(0, 2).toUpperCase()}${pad(t.groupSize + t.fee)}.`],
    ['Caller', `Thank you. I will see you on ${t.weekday}.`],
  );
  const groups: ListeningGroup[] = [
    { type: 'gap', title: 'Questions 1–5', instruction: 'Complete the booking notes. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.', wordLimit: 'NO MORE THAN THREE WORDS AND/OR A NUMBER', lines: ['## Workshop booking', 'Surname: {{1}}', 'Day: {{2}}', 'Room: {{3}}', 'Maximum group size: {{4}} people', 'Booking code: {{5}}'], questions: [question(1, 'Morgan'), question(2, t.weekday), question(3, t.room), question(4, String(t.groupSize), { accept: [String(t.groupSize)] }), question(5, `${t.weekday.slice(0, 2).toUpperCase()}${pad(t.groupSize + t.fee)}`)] },
    { type: 'mcq-one', title: 'Question 6', instruction: 'Choose the correct letter, A, B or C.', questions: [question(6, 'B', { prompt: 'What is included in the fee?', options: options('refreshments', 'activity materials', 'a travel pass') })] },
    { type: 'mcq-one', title: 'Question 7', instruction: 'Choose the correct letter, A, B or C.', questions: [question(7, 'A', { prompt: 'What should Ms Morgan bring?', options: options(t.item, 'a printed map', 'a camera') })] },
    { type: 'mcq-many', title: 'Questions 8–9', instruction: 'Choose TWO letters, A–E. Which TWO items are provided?', options: options('activity materials', 'refreshments', 'a follow-up handout', 'a travel pass', 'a certificate'), questions: [question(8, ['A', 'C'])] },
    { type: 'matching', title: 'Question 10', instruction: 'Choose the correct letter, A–C.', options: options('morning', 'afternoon', 'evening'), questions: [question(10, 'C', { prompt: 'When is the workshop held?' })] },
  ];
  return { n: 1, title: t.event, context: `A caller asks ${t.venue} about ${t.event}.`, audio: audioUrl(t.title, 1), durationSec: 300, transcript, groups };
}

function buildSection2(t: Topic): ListeningSection {
  const facts: [string, string][] = [
    ['main meeting point', t.venue], ['starting time', '9:30'], ['group limit', String(t.groupSize)], ['entry fee', `£${t.fee}`], ['meeting room', t.room],
    ['programme length', `${t.weeks} weeks`], ['essential item', t.item], ['final output', t.result], ['meeting day', t.weekday], ['topic focus', t.focus],
  ];
  const transcript = lines(
    ['Coordinator', `Welcome to our information session about ${t.event}. I will explain the arrangements first.`],
    ['Coordinator', `The main meeting point is ${t.venue}. Please arrive by 9:30, when our guide will meet the group.`],
    ['Coordinator', 'We will begin with a short welcome, then move through the site in small groups. A printed map is available, although the route is marked clearly at each turn.'],
    ['Coordinator', `We can take ${t.groupSize} participants. The entry fee is £${t.fee}, and the meeting room is ${t.room}.`],
    ['Coordinator', 'Please use the side entrance if you arrive after the group has set off. The main reception may be busy, so allow a few extra minutes to find us.'],
    ['Coordinator', `The programme lasts ${t.weeks} weeks. Please bring ${t.item}; all other materials are supplied.`],
    ['Coordinator', 'Each session includes time for questions. You do not need previous experience, and we will email a short summary after every meeting.'],
    ['Coordinator', `At the end, participants will prepare ${t.result}. We meet on ${t.weekday}, and our main focus is ${t.focus}.`],
    ['Coordinator', `Please note that ${t.obstacle} can affect the activities, so check the notice board before travelling.`],
  );
  const qs = facts.map(([label, answer], i) => question(11 + i, answer, {}));
  const group: ListeningGroup = { type: 'gap', title: 'Questions 11–20', instruction: 'Complete the programme notes. Write NO MORE THAN EIGHT WORDS AND/OR A NUMBER for each answer.', wordLimit: 'NO MORE THAN EIGHT WORDS AND/OR A NUMBER', lines: ['## Programme information', ...facts.map(([label], i) => `${label[0]?.toUpperCase()}${label.slice(1)}: {{${11 + i}}}`)], questions: qs };
  return { n: 2, title: `Information about ${t.title.toLowerCase()}`, context: `A coordinator explains a local programme connected with ${t.title.toLowerCase()}.`, audio: audioUrl(t.title, 2), durationSec: 300, transcript, groups: [group] };
}

function buildSection3(t: Topic): ListeningSection {
  const transcript = lines(
    ['Tutor', `Let's review your project on ${t.focus}. What did you decide to investigate?`],
    ['Mina', 'At first I wanted to cover the whole district, but that would make the project too broad. We have now chosen two nearby areas that can be compared fairly.'],
    ['Mina', `I am looking at the main problem: ${t.obstacle}. I will collect observations at the site.`],
    ['Owen', 'I checked the timetable and we can visit both areas at the same time of day. That should reduce the effect of changing conditions.'],
    ['Owen', `I will compare the local records with the research summary. That should give us a longer view.`],
    ['Tutor', 'Good. Have you planned how you will gather comments from participants?'],
    ['Mina', 'Yes, I will conduct short interviews. Owen can prepare the online questionnaire.'],
    ['Tutor', 'Keep the interview questions neutral. If you suggest an answer, people may simply agree rather than explain what they really think.'],
    ['Owen', `The questionnaire will help us find out whether people would use ${t.result}.`],
    ['Tutor', `How many people can you realistically include?`],
    ['Mina', `We agreed on a sample of ${t.groupSize} people, selected from two neighbourhood groups.`],
    ['Owen', 'We should not build the prototype until the interviews are complete.'],
    ['Tutor', 'Exactly. Your final presentation should explain the evidence, the limits and the next step.'],
    ['Mina', 'We will make one draft chart first and ask the seminar group whether the labels are clear. Then we can prepare the final version.'],
  );
  const groups: ListeningGroup[] = [
    { type: 'matching', title: 'Questions 21–24', instruction: 'Who will be responsible for each task? Choose the correct letter, A–E.', options: options('Mina', 'Owen', 'both students', 'the tutor', 'the participants'), questions: [question(21, 'A', { prompt: 'Collect observations at the site' }), question(22, 'B', { prompt: 'Compare local records with previous research' }), question(23, 'A', { prompt: 'Conduct short interviews' }), question(24, 'B', { prompt: 'Prepare the online questionnaire' })] },
    { type: 'mcq-one', title: 'Questions 25–30', instruction: 'Choose the correct letter, A, B or C.', questions: [
      question(25, 'C', { prompt: 'What is the project mainly investigating?', options: options('the cost of a new building', 'changes in national policy', t.focus) }),
      question(26, 'A', { prompt: 'Which challenge does Mina identify?', options: options(t.obstacle, 'a lack of historical records', 'a shortage of volunteers') }),
      question(27, 'B', { prompt: 'What will Owen compare?', options: options('interview recordings', 'local records and a research summary', 'two proposed budgets') }),
      question(28, 'A', { prompt: 'How many people will be included in the sample?', options: options(String(t.groupSize), String(t.groupSize + 4), String(t.groupSize * 2)) }) ,
      question(29, 'C', { prompt: 'When will the students build their prototype?', options: options('before gathering evidence', 'during the first interview', 'after the interviews are complete') }),
      question(30, 'B', { prompt: 'What should the final presentation include?', options: options('a full technical manual', 'evidence, limitations and a next step', 'only the questionnaire results') }),
    ] },
  ];
  return { n: 3, title: `Project discussion: ${t.title}`, context: `Two students discuss a project about ${t.title.toLowerCase()} with their tutor.`, audio: audioUrl(t.title, 3), durationSec: 300, transcript, groups };
}

function buildSection4(t: Topic): ListeningSection {
  const facts: [string, string][] = [
    ['research topic', t.focus], ['study location', t.venue], ['sample size', String(t.groupSize)], ['programme duration', `${t.weeks} weeks`], ['main barrier', t.obstacle],
    ['proposed outcome', t.result], ['recommended meeting day', t.weekday], ['required resource', t.item], ['meeting space', t.room], ['participation fee', `£${t.fee}`],
  ];
  const transcript = lines(
    ['Lecturer', `Today I want to consider ${t.focus}, using a local programme as an example.`],
    ['Lecturer', 'When people discuss this subject, they often focus on a single visible change. A useful study needs to consider the routines and decisions that surround it as well.'],
    ['Lecturer', `The project is based at ${t.venue}. A carefully chosen sample of ${t.groupSize} participants will be followed.`],
    ['Lecturer', 'The researchers will record the starting conditions before the programme begins. Without that baseline, later differences could be mistaken for an effect of the programme.'],
    ['Lecturer', `The programme will run for ${t.weeks} weeks. Early feedback suggests that ${t.obstacle} is the main barrier.`],
    ['Lecturer', 'This barrier does not affect every participant in the same way. The team will therefore separate practical difficulties from differences in personal preference.'],
    ['Lecturer', `Researchers hope to produce ${t.result}. To compare the observations consistently, meetings are recommended for ${t.weekday}.`],
    ['Lecturer', 'The observations should be recorded using the same categories each time. Short notes immediately after a session are generally more useful than a long account written several days later.'],
    ['Lecturer', `Participants should bring ${t.item}, and all group sessions will use ${t.room}. The proposed fee is £${t.fee}.`],
    ['Lecturer', 'Finally, the findings will be shared with the participants before they are published. This gives the team a chance to correct factual errors, while leaving the interpretation open to discussion.'],
    ['Lecturer', 'The results should be treated as a starting point rather than proof that the same approach will work everywhere.'],
  );
  const group: ListeningGroup = {
    type: 'gap', title: 'Questions 31–40', instruction: 'Complete the lecture notes. Write NO MORE THAN EIGHT WORDS AND/OR A NUMBER for each answer.', wordLimit: 'NO MORE THAN EIGHT WORDS AND/OR A NUMBER',
    lines: ['## Lecture notes', ...facts.map(([label], i) => `${label[0]?.toUpperCase()}${label.slice(1)}: {{${31 + i}}}`)],
    questions: facts.map(([, answer], i) => question(31 + i, answer)),
  };
  return { n: 4, title: `Lecture: ${t.title}`, context: `A short lecture reviews research connected with ${t.title.toLowerCase()}.`, audio: audioUrl(t.title, 4), durationSec: 300, transcript, groups: [group] };
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const audioBase = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
const audioUrl = (title: string, section: number) => {
  const path = `/listening/original/${slug(title)}/s${section}.mp3`;
  return audioBase ? `${audioBase}/storage/v1/object/public/listening-audio${path}` : path;
};

export const ORIGINAL_TOPIC_TESTS: ListeningTest[] = TOPICS.map((topic, i) => ({
  id: `band9-topic-${pad(i + 1)}`,
  title: topic.title,
  titleVi: topic.title,
  source: 'Band 9 Original',
  level: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
  cover: { topic: topic.title, category: topic.category, hue: (28 + i * 29) % 360 },
  sections: [buildSection1(topic), buildSection2(topic), buildSection3(topic), buildSection4(topic)],
}));
