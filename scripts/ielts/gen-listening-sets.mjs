// Sinh bộ đề Listening bằng luật (không gọi API): điền biểu mẫu + bản đồ.
// Đáp án suy ra từ chính tham số dựng đề nên không thể lệch với lời thoại.
// Chạy: node scripts/ielts/gen-listening-sets.mjs
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('src/data/drill-sets/raw');
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (r, a) => a[Math.floor(r() * a.length)];
const shuffle = (r, a) => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
const write = (type, n, set) => { const d = path.join(OUT, type); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, String(n).padStart(2, '0') + '.json'), JSON.stringify(set, null, 1) + '\n'); };
const cap = (s) => s[0].toUpperCase() + s.slice(1);

const SURNAMES = ['Marsh', 'Whitlock', 'Penrose', 'Hargreaves', 'Dunmore', 'Fairbrother', 'Calloway', 'Ashworth', 'Kettering', 'Lockhart', 'Brannigan', 'Thackeray', 'Pemberton', 'Garrick', 'Holloway', 'Sutcliffe', 'Wetherby', 'Cranmer', 'Fenwick', 'Radcliffe', 'Yardley', 'Boswell', 'Tennant', 'Quigley', 'Maddox', 'Birtwistle', 'Lavender', 'Pritchard', 'Stanhope', 'Kingsley'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth', 'twenty-first', 'twenty-second', 'twenty-third', 'twenty-fourth', 'twenty-fifth', 'twenty-sixth', 'twenty-seventh', 'twenty-eighth'];
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const DIG = ['oh', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const PRICEW = { 5: 'five', 10: 'ten', 15: 'fifteen', 20: 'twenty', 25: 'twenty-five', 30: 'thirty', 35: 'thirty-five', 40: 'forty', 45: 'forty-five', 50: 'fifty', 55: 'fifty-five', 60: 'sixty', 65: 'sixty-five', 70: 'seventy', 75: 'seventy-five', 80: 'eighty', 85: 'eighty-five', 90: 'ninety' };
const spell = (w) => w.toUpperCase().split('').join(', ');
const CONS = 'BCDFGHJKLMNPQRSTVWXZ';
const LET = 'ABCDEFGHJKLMNPRSTVWXY';
const spokenCode = (s) => s.split('').map((c) => (/\d/.test(c) ? NUM[+c] : c)).join(' ');

// ---------- Form completion ----------
const SCENES = [
  { title: 'Gym membership', clerk: 'Sam', caller: 'Caller', open: ['Good morning, Riverside Fitness, Sam speaking.', "Hello, I'd like to join the gym, please."], labels: { surname: 'Surname', phone: 'Mobile number', postcode: 'Postcode', date: 'Start date', price: 'Joining fee (£)', count: 'Classes per week', ref: 'Membership code' }, dateQ: 'When would you like to start?', countQ: 'How many classes a week do you think you will come to?', priceThing: 'joining fee' },
  { title: 'Library card', clerk: 'Helen', caller: 'Caller', open: ['City Library, Helen speaking.', "Hi, I've just moved to the area and I'd like a library card."], labels: { surname: 'Surname', phone: 'Telephone', postcode: 'Postcode', date: 'Card start date', price: 'Yearly fee (£)', count: 'Books allowed', ref: 'Card number' }, dateQ: 'On which date would you like the card to start?', countQ: 'How many books would you like to borrow at a time?', priceThing: 'yearly fee' },
  { title: 'Hotel booking', clerk: 'Daniel', caller: 'Caller', open: ['Good afternoon, Lakeside Hotel, Daniel speaking.', "Hello, I'd like to book a room, please."], labels: { surname: 'Surname', phone: 'Contact number', postcode: 'Postcode', date: 'Check-in date', price: 'Deposit (£)', count: 'Number of nights', ref: 'Booking reference' }, dateQ: 'What date would you like to arrive?', countQ: 'And how many nights will you be staying?', priceThing: 'deposit' },
  { title: 'Evening course enrolment', clerk: 'Priya', caller: 'Caller', open: ['Parkside College, Priya speaking.', "Hello, I'd like to enrol on an evening photography course."], labels: { surname: 'Surname', phone: 'Phone number', postcode: 'Postcode', date: 'First class', price: 'Course fee (£)', count: 'Number of weeks', ref: 'Student ID' }, dateQ: 'The next course begins soon. Which date is the first class?', countQ: 'How many weeks does the course run for?', priceThing: 'course fee' },
  { title: 'Lost property report', clerk: 'Mark', caller: 'Caller', open: ['Central Station lost property, Mark speaking.', 'Hello, I think I left my rucksack on a train yesterday.'], labels: { surname: 'Surname', phone: 'Phone number', postcode: 'Postcode', date: 'Date lost', price: 'Handling charge (£)', count: 'Number of items', ref: 'Report number' }, dateQ: 'On which date did you lose it?', countQ: 'How many items were in the bag?', priceThing: 'handling charge' },
  { title: 'Coach tour booking', clerk: 'Grace', caller: 'Caller', open: ['Highland Day Tours, Grace speaking.', "Hi, I'd like to book a place on the castle tour."], labels: { surname: 'Surname', phone: 'Mobile number', postcode: 'Postcode', date: 'Tour date', price: 'Price per person (£)', count: 'Number of people', ref: 'Booking code' }, dateQ: 'Which date would you like to travel?', countQ: 'How many people will be coming?', priceThing: 'price per person' },
  { title: 'Car rental', clerk: 'Tony', caller: 'Caller', open: ['Swift Car Hire, Tony speaking.', "Hello, I'd like to rent a small car for a few days."], labels: { surname: 'Surname', phone: 'Phone number', postcode: 'Postcode', date: 'Pick-up date', price: 'Insurance (£)', count: 'Days of rental', ref: 'Licence number' }, dateQ: 'When would you like to collect it?', countQ: 'And how many days do you need it for?', priceThing: 'insurance cost' },
  { title: 'Clinic registration', clerk: 'Olivia', caller: 'Caller', open: ['Elm Park Medical Centre, Olivia speaking.', "Hello, I'd like to register as a new patient."], labels: { surname: 'Surname', phone: 'Telephone', postcode: 'Postcode', date: 'Appointment date', price: 'Form fee (£)', count: 'Years at this address', ref: 'Patient number' }, dateQ: 'We can see you for a check-up. Which date suits you?', countQ: 'How many years have you lived at your current address?', priceThing: 'fee for the private form' },
];
const TRAPPABLE = ['date', 'count', 'price'];

function fieldGen(r, type, sc, trap) {
  const lines = []; let answer; let quote;
  const ask = (t) => lines.push([sc.clerk, t]);
  const say = (t) => lines.push([sc.caller, t]);
  if (type === 'surname') { const s = pick(r, SURNAMES); answer = s; ask('Can I take your surname, please?'); quote = `It's ${s}. That's ${spell(s)}.`; say(quote); }
  else if (type === 'phone') {
    const d = '07' + Array.from({ length: 9 }, () => Math.floor(r() * 10)).join(''); answer = d;
    const sp = d.split('').map((x) => DIG[+x]);
    quote = [sp.slice(0, 3), sp.slice(3, 7), sp.slice(7)].map((x) => x.join(' ')).join(', ');
    ask("And what's the best number to reach you on?"); say(`It's ${quote}.`);
  } else if (type === 'postcode') {
    const a = `${pick(r, [...'BCDGLMNSW'])}${pick(r, [...LET])}${1 + Math.floor(r() * 9)}`; const b = `${1 + Math.floor(r() * 9)}${pick(r, [...CONS])}${pick(r, [...CONS])}`;
    answer = `${a} ${b}`; quote = `${spokenCode(a)}, ${spokenCode(b)}`; ask("What's your postcode?"); say(`${quote}.`);
  } else if (type === 'ref') {
    const rf = `${pick(r, [...CONS])}${pick(r, [...CONS])}${1000 + Math.floor(r() * 8999)}`; answer = rf; quote = spokenCode(rf);
    ask('Let me give you your reference. Have you got a pen?'); say('Yes, go ahead.'); ask(`It's ${quote}.`);
  } else if (type === 'date') {
    const day = 1 + Math.floor(r() * 28); const m = pick(r, MONTHS);
    answer = `${day} ${m} | ${m} ${day} | ${day}th ${m} | ${m} ${day}th | ${ORD[day]} ${m}`;
    ask(sc.dateQ);
    if (trap) { const wrong = 1 + (day % 28); say(`The ${ORD[wrong]} of ${m}... no, sorry, that's a Sunday. Make it the ${ORD[day]} of ${m}.`); quote = `Make it the ${ORD[day]} of ${m}`; }
    else { say(`The ${ORD[day]} of ${m}, please.`); quote = `The ${ORD[day]} of ${m}`; }
  } else if (type === 'count') {
    const n = 2 + Math.floor(r() * 7); answer = `${n} | ${NUM[n]}`; ask(sc.countQ);
    if (trap) { say(`${cap(NUM[n + 1])}, I think. Actually, let me say ${NUM[n]}, it's better to be safe.`); quote = `let me say ${NUM[n]}`; }
    else { say(`${cap(NUM[n])}, I think.`); quote = NUM[n]; }
  } else if (type === 'price') {
    const p = 15 + Math.floor(r() * 16) * 5; answer = `£${p} | ${p}`;
    say(`How much is the ${sc.priceThing}?`);
    if (trap) { ask(`It's ${PRICEW[p - 10]} pounds... oh, hold on, that's last year's price. This year it's ${PRICEW[p]} pounds.`); quote = `this year it's ${PRICEW[p]} pounds`; }
    else { ask(`It's ${PRICEW[p]} pounds.`); quote = `${PRICEW[p]} pounds`; }
  }
  return { lines, answer, quote };
}

for (let n = 1; n <= 10; n++) {
  const r = rng(9100 + n * 31);
  const scenes = shuffle(r, SCENES).slice(0, 4);
  const script = []; const qs = [];
  scenes.forEach((sc, si) => {
    const types = shuffle(r, ['surname', 'phone', 'postcode', 'date', 'count', 'price', 'ref']).slice(0, 5);
    if (!types.some((t) => TRAPPABLE.includes(t))) types[4] = 'date';
    const trapType = pick(r, types.filter((t) => TRAPPABLE.includes(t)));
    script.push(`Narrator: Conversation ${si + 1}. ${sc.title}.`);
    script.push(`${sc.clerk}: ${sc.open[0]}`); script.push(`${sc.caller}: ${sc.open[1]}`);
    for (const t of types) {
      const g = fieldGen(r, t, sc, t === trapType);
      for (const [who, txt] of g.lines) script.push(`${who}: ${txt}`);
      qs.push({ prompt: `[${sc.title}] ${sc.labels[t]}: ____`, answer: g.answer, why: `Người nói đọc: “${g.quote}”. ${t === trapType ? 'Bẫy tự đính chính: lấy giá trị được chốt SAU CÙNG.' : 'Đáp án lấy đúng giá trị được nói ra.'}`, quote: g.quote });
    }
    script.push(`${sc.clerk}: Lovely, that's everything. Thank you.`);
  });
  write('listening-form-completion', n, { title: `Form completion #${n}`, topic: scenes.map((s) => s.title).join(' · '), context: script.join('\n'), questions: qs });
}

// ---------- Map labelling ----------
const VENUES = [
  { name: 'wildlife park', place: ['penguin pool', 'reptile house', 'gift shop', 'café', 'bird aviary', 'picnic area', 'petting farm', 'first-aid post', 'butterfly house', 'ticket office'] },
  { name: 'university campus', place: ['library', 'sports hall', 'student union', 'science block', 'bookshop', 'health centre', 'art studio', 'language lab', 'bike shed', 'canteen'] },
  { name: 'botanical garden', place: ['rose garden', 'glasshouse', 'visitor centre', 'pond', 'herb garden', 'tea room', 'sculpture lawn', 'cactus house', 'play area', 'souvenir stall'] },
  { name: 'museum', place: ['dinosaur hall', 'cloakroom', 'maritime gallery', 'cinema', 'cafeteria', 'temporary exhibition', 'learning studio', 'gift counter', 'costume gallery', 'archive room'] },
  { name: 'sports centre', place: ['swimming pool', 'squash courts', 'weights room', 'reception', 'changing rooms', 'climbing wall', 'juice bar', 'dance studio', 'physio room', 'creche'] },
  { name: 'holiday village', place: ['boat house', 'laundry', 'games room', 'shop', 'restaurant', 'tennis courts', 'bike hire', 'nature trail office', 'spa', 'campfire circle'] },
];
const SIDE_VI = { A: 'phía sau bên trái', B: 'phía sau ở giữa', C: 'phía sau bên phải', D: 'hàng gần cổng, bên trái', E: 'hàng gần cổng, ở giữa', F: 'hàng gần cổng, bên phải' };

function describe(r, L, fac, intro) {
  const nm = (x) => `the ${fac[x]}`;
  const near = { D: 'first building on your left', E: 'building straight ahead of you', F: 'first building on your right' };
  if ('DEF'.includes(L)) return pick(r, [`As you come in through the main entrance, ${nm(L)} is the ${near[L]}.`, `Just inside the entrance you will find ${nm(L)}. It is the ${near[L]}.`]);
  const behind = { A: 'D', B: 'E', C: 'F' }[L];
  const T = cap(nm(L));
  const opts = [`${T} is directly behind ${nm(behind)}, at the back of the site.`];
  const nb = { A: ['B', 'left'], B: ['A', 'right'], C: ['B', 'right'] }[L]; // L nằm bên nào của hàng xóm
  if (intro.has(nb[0])) opts.push(`${T} is right next to ${nm(nb[0])}, on its ${nb[1]} side.`);
  if (L === 'B' && intro.has('A') && intro.has('C')) opts.push(`${T} is in the middle at the back, between ${nm('A')} and ${nm('C')}.`);
  return pick(r, opts);
}

for (let n = 1; n <= 10; n++) {
  const r = rng(5200 + n * 17);
  const venues = shuffle(r, VENUES).slice(0, 4);
  const script = []; const maps = []; const qs = [];
  venues.forEach((v, mi) => {
    const names = shuffle(r, v.place).slice(0, 6);
    const letters = shuffle(r, ['A', 'B', 'C', 'D', 'E', 'F']);
    const fac = {}; letters.forEach((l, i) => { fac[l] = names[i]; });
    maps.push({ title: `Map ${mi + 1}: ${cap(v.name)}`, entrance: 'Main entrance', cells: ['A', 'B', 'C', 'D', 'E', 'F'] });
    script.push(`Narrator: Map ${mi + 1}. The ${v.name}.`);
    script.push(`Guide: Welcome to the ${v.name}. I will quickly show you where things are. Look at the map as I talk, and remember that you come in at the main entrance at the bottom.`);
    const order = [...shuffle(r, ['D', 'E', 'F']), ...shuffle(r, ['A', 'B', 'C'])];
    const skip = pick(r, order.slice(3));
    const intro = new Set(); const sentences = {};
    for (const L of order) { sentences[L] = describe(r, L, fac, intro); script.push(`Guide: ${sentences[L]}`); intro.add(L); }
    script.push('Guide: That covers everything. Enjoy your visit.');
    for (const L of order) if (L !== skip) qs.push({ mapIndex: mi, prompt: `Where is the ${fac[L]}?`, answer: L, why: `Người dẫn nói: “${sentences[L]}” → ô ${L} (${SIDE_VI[L]}).`, quote: sentences[L] });
  });
  write('listening-map-labelling', n, { title: `Map labelling #${n}`, topic: venues.map((v) => v.name).join(' · '), context: script.join('\n'), options: ['A', 'B', 'C', 'D', 'E', 'F'], maps, questions: qs });
}
console.log('done');
