/**
 * BẢN TIẾNG ANH CHO CHỮ CỦA PHẦN GAME — món ở trang Đổi quà, linh vật, bậc tháng,
 * danh hiệu theo cấp, huy hiệu, nội thất.
 *
 * Dữ liệu gốc (`shop.ts`, `points.ts`, `game/rules.ts`, `game/mascots.ts`,
 * `data/city/furniture.ts`) giữ nguyên tiếng Việt và vẫn là nguồn sự thật; tệp
 * này chỉ tra theo `id` để vẽ khi giao diện đang ở tiếng Anh. Món nào chưa có
 * trong bảng thì hiện lại bản tiếng Việt chứ không hiện trống.
 */
import type { Locale } from '@/i18n/keys';
import type { MascotId } from '@/services/game/mascots';
import type { ShopItem } from './shop';

type Pair = { name: string; detail: string };

const ITEM_EN: Record<string, Pair> = {
  // vé gói
  'pass-plus-1': { name: 'Plus pass, 1 day', detail: 'Try every reading, mock test and the word notebook for 24 hours.' },
  'pass-pro-1': { name: 'Pro pass, 1 day', detail: 'Try the AI tutor and reviewed model answers for 24 hours.' },
  'pass-plus-7': { name: 'Plus pass, 7 days', detail: 'Unlimited reading, mock tests and notebook for 7 days. Stacks with an active Plus pass.' },
  'pass-pro-7': { name: 'Pro pass, 7 days', detail: 'Everything in Plus, plus reviewed model answers and the tutor chat, for 7 days.' },
  'pass-plus-14': { name: 'Plus pass, 14 days', detail: 'Two weeks of unlimited reading and practice tests at a saving.' },
  'pass-pro-14': { name: 'Pro pass, 14 days', detail: 'Two weeks of every premium feature for your final sprint.' },
  // linh vật
  'mascot-owl': { name: 'Wise Owl', detail: '3 free Ask Owl hints every day.' },
  'mascot-fox': { name: 'Clever Fox', detail: 'Blocks your first wrong answer each day.' },
  'mascot-cat': { name: 'Lazy Cat', detail: 'Restores 1 heart every 10 correct answers.' },
  'mascot-dragon': { name: 'Baby Dragon', detail: 'Every hit is 20% stronger.' },
  // skin
  'skin-ninja': { name: 'Shadow Ninja', detail: 'Black outfit, red scarf.' },
  'skin-mage': { name: 'Purple Mage', detail: 'Golden robe, pink staff.' },
  'skin-samurai': { name: 'Red Samurai', detail: 'Red armour, golden hilt.' },
  'skin-astronaut': { name: 'Astronaut', detail: 'White suit, blue laser sword.' },
  'skin-gold': { name: 'Golden Knight', detail: 'Gold armour, purple cape — rare.' },
  // avatar động
  'anim-hero': { name: 'Bouncing Knight', detail: 'Wears the skin you have on.' },
  'anim-slime': { name: 'Bouncy Slime', detail: 'Bounces nonstop and blinks.' },
  'anim-ghost': { name: 'Floating Ghost', detail: 'Drifts up and down, fading in and out.' },
  'anim-owl': { name: 'Head-tilting Owl', detail: 'Tilts its head to look at you.' },
  'anim-star': { name: 'Twinkling Star', detail: 'A cluster of glowing stars circles around.' },
  'anim-dragon': { name: 'Fire Dragon', detail: 'Flaps its wings and breathes fire — rare.' },
  // bìa hồ sơ
  'cover-stars': { name: 'Starry sky', detail: 'Twinkling stars and the odd shooting star.' },
  'cover-sunset': { name: 'Pixel sunset', detail: 'The sun sets behind the hills as clouds drift by.' },
  'cover-ocean': { name: 'Ocean waves', detail: 'Rolling waves with sunlight glittering on the water.' },
  'cover-aurora': { name: 'Aurora', detail: 'Ribbons of light drifting slowly across the night.' },
  'cover-cyberpunk': { name: 'Neon future night', detail: 'Skyscrapers lit with neon and cyberpunk laser grids.' },
  'cover-sakura': { name: 'Torii gate & cherry blossoms', detail: 'A Japanese spring scene full of falling petals.' },
  'cover-mountain': { name: 'Misty peaks', detail: 'Majestic mountains floating in golden dawn light.' },
  'cover-galaxy': { name: 'Heart of the galaxy', detail: 'A black hole with a shimmering, glowing disc.' },
  'cover-library': { name: 'Storybook library', detail: 'Warm wooden shelves in nostalgic candlelight.' },
  'cover-bamboo': { name: 'Zen bamboo forest', detail: 'Cool green bamboo beside a quiet stream.' },
  'cover-autumn': { name: 'Red maple forest', detail: 'An autumn valley ablaze in red and orange.' },
  'cover-vaporwave': { name: 'Retrowave sunset', detail: 'An 80s synthwave sun over a laser grid.' },
  // hiệu ứng hồ sơ
  'fx-sakura': { name: 'Cherry blossoms', detail: 'Pink petals drift down over your profile card and sidebar.' },
  'fx-snow': { name: 'First snow', detail: 'Light snowfall with a soft, cool glow.' },
  'fx-bubbles': { name: 'Ocean bubbles', detail: 'Clear bubbles rise from the bottom of the card and sidebar.' },
  'fx-sparkle': { name: 'Magic glitter', detail: 'Multicoloured stars twinkling and shimmering.' },
  'fx-meteor': { name: 'Meteor shower', detail: 'Shooting stars streak across your profile card and sidebar.' },
  'fx-flame': { name: 'Mystic purple flame', detail: 'Orange-purple embers rise and light up the card — rare.' },
  'fx-autumn': { name: 'Autumn maple leaves', detail: 'Golden maple leaves gently swirl and drift.' },
  'fx-matrix': { name: 'Cyberpunk code rain', detail: 'Streams of digits and neon green light pour down.' },
  'fx-fireflies': { name: 'Summer fireflies', detail: 'Fireflies hover and blink softly in the night.' },
  'fx-butterflies': { name: 'Jewel butterflies', detail: 'Glowing butterflies flutter dreamily.' },
  'fx-lightning': { name: 'Lightning storm', detail: 'Purple lightning bolts flash brightly.' },
  'fx-galaxy': { name: 'Galaxy swirl', detail: 'Glittering nebula dust in gentle motion.' },
  'fx-starlight': { name: 'Shooting-star sky', detail: 'A thousand twinkling stars with meteors passing by.' },
  'fx-neon-pulse': { name: 'Synthwave pulse', detail: 'Purple-blue neon bands pulsing to a futuristic beat.' },
  'fx-rainbow': { name: 'Rainbow prism', detail: 'Soft seven-colour prism light across the frame.' },
  // đồ chiến đấu
  'power-potion': { name: 'Health potion', detail: 'Restores 2 hearts mid-battle.' },
  'power-shield': { name: 'Shield', detail: 'Blocks one wrong answer and keeps your combo.' },
  'power-hint': { name: "Owl's hint", detail: 'Removes 2 wrong options.' },
  'power-double': { name: 'Double XP', detail: 'Double XP for your next 10 correct answers.' },
  // thẻ giữ chuỗi
  'freeze-1': { name: 'Streak freeze', detail: "Saves your streak for a day you couldn't study." },
  'freeze-3': { name: '3-day streak freeze', detail: 'For exam weeks or trips away.' },
  'freeze-7': { name: '7-day holiday pass', detail: "Protects your streak for a full week while you're travelling or busy with exams." },
  'freeze-14': { name: '14-day getaway pass', detail: 'Protects your streak for two whole weeks on a long trip.' },
  'freeze-30': { name: '30-day summer pass', detail: 'The ultimate streak protection for a whole month.' },
  // avatar emoji
  'avatar-owl': { name: 'Night owl', detail: 'Avatar' },
  'avatar-cat': { name: 'Lazy cat', detail: 'Avatar' },
  'avatar-fox': { name: 'Clever fox', detail: 'Avatar' },
  'avatar-whale': { name: 'Whale', detail: 'Avatar' },
  'avatar-dragon': { name: 'Dragon', detail: 'Avatar' },
  'avatar-rocket': { name: 'Rocket', detail: 'Avatar' },
  'avatar-lion': { name: 'Lion', detail: 'A brave avatar that stands firm through every test.' },
  'avatar-panda': { name: 'Panda', detail: 'A hard-working avatar, building up points step by step.' },
  'avatar-tiger': { name: 'Warrior tiger', detail: 'An avatar bursting with energy in every session.' },
  'avatar-eagle': { name: 'Eagle', detail: 'A sharp-eyed avatar that spots every trap in the test.' },
  'avatar-unicorn': { name: 'Unicorn', detail: 'A magical avatar for wondrous study inspiration.' },
  'avatar-koala': { name: 'Koala', detail: 'A calm avatar for stress-free studying.' },
  'avatar-dino': { name: 'Dinosaur', detail: "A Jurassic avatar that never backs down from a hard question." },
  'avatar-crown': { name: 'Crown', detail: 'A glorious avatar for the most dedicated learners.' },
  'avatar-lightning': { name: 'Lightning', detail: 'An avatar with lightning-fast reflexes.' },
  'avatar-earth': { name: 'Earth', detail: 'An explorer avatar growing a vocabulary without borders.' },
  'avatar-trophy': { name: 'Gold trophy', detail: 'An honorary avatar for an outstanding streak of wins.' },
  'avatar-phoenix': { name: 'Phoenix', detail: 'An avatar that revives your streak and breaks through bands.' },
  'avatar-books': { name: 'Books of wisdom', detail: 'A true bookworm avatar: read deeply, remember long.' },
  'avatar-graduate': { name: 'Graduation cap', detail: 'An avatar for the day you reach your study-abroad goal.' },
  'avatar-fox-spirit': { name: 'Nine-tailed fox', detail: 'A legendary, wise spirit creature of the East.' },
  'avatar-pegasus': { name: 'Pegasus', detail: 'A winged horse soaring through the sky.' },
  'avatar-ninja-cat': { name: 'Ninja cat', detail: 'A mysterious black cat that appears and vanishes.' },
  'avatar-shiba': { name: 'Shiba dog', detail: 'A cute, energetic Japanese Shiba.' },
  'avatar-black-cat': { name: 'Jewel-eyed black cat', detail: 'A mysterious black cat with bright eyes.' },
  'avatar-alien': { name: 'Alien', detail: 'A curious friend from space learning Earth languages.' },
  'avatar-ghost': { name: 'Playful ghost', detail: "A cute little ghost that isn't scared of any test." },
  'avatar-magic-hat': { name: 'Wizard hat', detail: 'An avatar for the wondrous magic of knowledge.' },
  'avatar-rabbit': { name: 'Jade rabbit', detail: 'A nimble rabbit that hops through each question.' },
  'avatar-hamster': { name: 'Hamster', detail: 'A diligent hamster that stores knowledge every day.' },
  'avatar-frog': { name: 'Green frog', detail: 'A patient frog that leaps onto the right word.' },
  'avatar-monkey': { name: 'Little monkey', detail: 'A playful monkey that learns by trying.' },
  'avatar-cow': { name: 'Dairy cow', detail: 'A calm cow that studies steadily.' },
  'avatar-pig': { name: 'Pink pig', detail: 'A cheerful pig that studies well after a good meal.' },
  'avatar-horse': { name: 'Galloping horse', detail: 'A fast horse that gallops through each lesson.' },
  'avatar-penguin': { name: 'Penguin', detail: 'A steady penguin that keeps going through tough exams.' },
  'avatar-chick': { name: 'Baby chick', detail: 'A new learner who grows a little every day.' },
  'avatar-duck': { name: 'Swimming duck', detail: 'A calm duck that learns without rushing.' },
  'avatar-turtle': { name: 'Sea turtle', detail: 'A slow but steady turtle with a long memory.' },
  'avatar-octopus': { name: 'Octopus', detail: 'A many-armed octopus that tackles several tasks at once.' },
  'avatar-crab': { name: 'Golden crab', detail: 'A tough crab that crawls past every difficulty.' },
  'avatar-tropical-fish': { name: 'Tropical fish', detail: 'A bright fish swimming through the sea of vocabulary.' },
  'avatar-butterfly': { name: 'Butterfly', detail: 'A gentle butterfly that flies across every topic.' },
  'avatar-bee': { name: 'Busy bee', detail: 'A hardworking bee that collects words like nectar.' },
  'avatar-ladybug': { name: 'Lucky ladybug', detail: 'A lucky ladybug that brings you correct answers.' },
  'avatar-dolphin': { name: 'Smart dolphin', detail: 'The cleverest creature of the ocean.' },
  'avatar-shark': { name: 'Shark', detail: 'A fierce shark that hunts the hardest exercises.' },
  'avatar-crocodile': { name: 'Crocodile', detail: 'A patient crocodile waiting for the perfect moment.' },
  'avatar-giraffe': { name: 'Giraffe', detail: 'A tall giraffe that sees the exam from far away.' },
  'avatar-elephant': { name: 'Memory elephant', detail: 'An elephant that never forgets a single word.' },
  'avatar-rhino': { name: 'Rhino', detail: 'A rhino as steady as steel.' },
  'avatar-bear': { name: 'Brown bear', detail: 'A warm bear that hugs knowledge close.' },
  'avatar-polar-bear': { name: 'Polar bear', detail: 'A cool polar bear with total focus.' },
  'avatar-kangaroo': { name: 'Kangaroo', detail: 'A jumping kangaroo that leaps ahead fast.' },
  'avatar-flamingo': { name: 'Flamingo', detail: 'An elegant flamingo that stays steady on one leg.' },
  'avatar-peacock': { name: 'Peacock', detail: 'A dazzling peacock that shows off its scores.' },
  'avatar-parrot': { name: 'Talking parrot', detail: 'A parrot that repeats every new word loudly.' },
  'avatar-diamond': { name: 'Diamond', detail: 'A precious gem built from steady study.' },
  'avatar-crystal-ball': { name: 'Crystal ball', detail: 'A crystal ball that foresees the next exam.' },
  'avatar-balloon': { name: 'Balloon', detail: 'A light balloon that rises with every correct answer.' },
  'avatar-artist': { name: 'Artist', detail: 'A creative artist who paints beautiful sentences.' },
  'avatar-music-note': { name: 'Music note', detail: 'A music lover who remembers words through melody.' },
  'avatar-gamepad': { name: 'Gamepad', detail: 'A challenge lover who plays to learn.' },
  'avatar-bullseye': { name: 'Bullseye', detail: 'A precise archer who hits the target again and again.' },
  'avatar-brain': { name: 'Wise brain', detail: 'A sharp mind that thinks clearly.' },
  'avatar-rainbow': { name: 'Rainbow', detail: 'A colourful rainbow after a rainy day of study.' },
  'avatar-clover': { name: 'Four-leaf clover', detail: 'A lucky clover that finds the right word first time.' },
  'avatar-cherry-blossom': { name: 'Cherry blossom', detail: 'A gentle blossom that blooms every study season.' },
  'avatar-star': { name: 'Shining star', detail: 'An avatar that shines on the leaderboard.' },
  'avatar-sun': { name: 'Sun', detail: 'A warm sun that spreads study energy.' },
  'avatar-moon': { name: 'Crescent moon', detail: 'A night owl avatar that keeps a steady rhythm.' },
  'avatar-donut': { name: 'Donut', detail: 'A sweet treat for finishing each lesson.' },
  'avatar-strawberry': { name: 'Strawberry', detail: 'A fresh strawberry that makes studying fun.' },
  'avatar-bubble-tea': { name: 'Bubble tea', detail: 'A relaxing drink after a long study session.' },
  'avatar-cake': { name: 'Birthday cake', detail: 'An avatar celebrating a study streak.' },
  'avatar-teddy': { name: 'Teddy bear', detail: 'A cuddly companion for every day.' },
  'avatar-robot': { name: 'Robot assistant', detail: 'A tech avatar that never gets tired of checking answers.' },
  'avatar-pixel-monster': { name: 'Pixel monster', detail: 'A retro avatar that studies like an 8-bit game.' },
  'avatar-fairy': { name: 'Fairy', detail: 'A magical fairy that turns new words into memories.' },
  'avatar-mermaid': { name: 'Mermaid', detail: 'A sea avatar that studies between the waves.' },
  'avatar-superhero': { name: 'Superhero', detail: 'An avatar that never gives up.' },
  'avatar-theater-mask': { name: 'Theater masks', detail: 'An avatar that expresses feelings through speech.' },
  'avatar-soccer': { name: 'Soccer player', detail: 'An energetic avatar that keeps a steady pace.' },
  'avatar-basketball': { name: 'Basketball player', detail: 'An avatar that breaks through tough questions.' },
  'avatar-trophy-gold': { name: 'Gold medal', detail: 'For the learners who reach the highest milestones.' },
  'avatar-silver-medal': { name: 'Silver medal', detail: 'For the learners who keep chasing the top spot.' },
  'avatar-bronze-medal': { name: 'Bronze medal', detail: 'Honours every step forward.' },
  'avatar-rocket-fire': { name: 'Rocket', detail: 'An avatar that shoots up the leaderboard.' },
  'avatar-ufo': { name: 'UFO', detail: 'An avatar from space learning English.' },
  'avatar-saturn': { name: 'Saturn', detail: 'An avatar exploring new worlds of words.' },
  'avatar-comet': { name: 'Comet', detail: 'An avatar racing through every drill.' },
  'avatar-volcano': { name: 'Volcano', detail: 'A hot avatar, studying with full fire.' },
  'avatar-mountain': { name: 'Snowy mountain', detail: 'A steady avatar standing on the summit.' },
  'avatar-tree-sakura': { name: 'Sacred tree', detail: 'A calm avatar that blooms every exam season.' },
  'avatar-cactus': { name: 'Cactus', detail: 'A tough avatar that survives any desert of exams.' },
  'avatar-mushroom': { name: 'Lucky mushroom', detail: 'A magical avatar that grows bit by bit.' },
  'avatar-four-leaf-sun': { name: 'Bright sun', detail: 'A warm avatar shining through every classroom.' },
  'avatar-snowflake': { name: 'Snowflake', detail: 'A cool avatar that keeps your mind clear.' },
  'avatar-fire': { name: 'Learning fire', detail: 'An avatar that burns bright every day.' },
  'avatar-ice-cream': { name: 'Ice cream', detail: 'A sweet avatar, a reward after each stage.' },
  'avatar-pizza': { name: 'Pizza', detail: 'A cheerful avatar that studies after a good meal.' },
  'avatar-sushi': { name: 'Sushi', detail: 'A refined avatar that loves tidiness.' },
  'avatar-boba': { name: 'Pearl milk tea', detail: 'A sweet avatar that studies like it chews boba.' },
  'avatar-coffee': { name: 'Coffee', detail: 'A wide-awake avatar for late-night study.' },
  'avatar-camera': { name: 'Camera', detail: 'An avatar capturing every moment of progress.' },
  'avatar-globe-asia': { name: 'Asia globe', detail: 'An avatar exploring cultures across continents.' },
  'avatar-castle': { name: 'Castle', detail: 'A royal avatar that studies like a castle lord.' },
  'avatar-lighthouse': { name: 'Lighthouse', detail: 'An avatar guiding lost learners home.' },
  'avatar-compass': { name: 'Compass', detail: 'An avatar that always finds the right direction.' },
  'avatar-key': { name: 'Golden key', detail: 'An avatar that opens every door of knowledge.' },
  'avatar-scroll': { name: 'Ancient scroll', detail: 'A scholar avatar studying every word.' },
  'avatar-hourglass': { name: 'Hourglass', detail: 'An avatar training exam timing.' },
  // giao diện
  'theme-sepia': { name: 'Ivory paper', detail: 'A soft, vintage, yellowed-book look.' },
  'theme-emerald': { name: 'Emerald', detail: 'A calm emerald green that is easy on the eyes for long reads.' },
  'theme-midnight': { name: 'Starry night', detail: 'A night sky full of stars with meteors gliding along the sidebar.' },
  'theme-sakura': { name: 'Cherry blossom garden', detail: 'An elegant pastel pink with petals falling on the sidebar.' },
  'theme-cyberpunk': { name: 'Cyberpunk 2077', detail: 'A tech-black look with blue and magenta neon edges.' },
  'theme-ocean': { name: 'Deep ocean', detail: 'The deep blue of the seabed with gently drifting bubbles.' },
  'theme-sunset': { name: 'Blazing sunset', detail: 'Warm pastel orange and purple like an evening sky.' },
  'theme-lavender': { name: 'Lavender dream', detail: 'A dreamy lavender purple for total relaxation.' },
  'theme-nord': { name: 'Nordic snow', detail: 'A minimalist Scandinavian look with falling snow.' },
  'theme-arcade': { name: 'Arcade · Neon pink', detail: 'Unlock the arcade look: a pixel splash screen, a home screen built as an arcade cabinet with a stage-select menu, 8-bit sound and pink neon buttons across the app.' },
  'theme-cyber': { name: 'Cyber · Neon blue', detail: 'Unlock the cyber pixel look: a navy night background, neon cyan outlines, electric-blue buttons and glowing offset shadows across the app.' },
  'theme-pixel': { name: 'Pixel · Y2K lilac', detail: 'Unlock the pixel look: a lilac grid background, ink-outlined panels with hard shadows and pink, cyan and purple pixel buttons across the app.' },
  'theme-retro': { name: 'Retro · Star ledger', detail: 'Unlock the retro look: rainbow ribbons, 70s striped type, ink-outlined icons and cream surfaces across the app.' },
  'theme-matcha': { name: 'Matcha tea', detail: 'A soft green-tea look with a calm, zen feel.' },
  'theme-chiikawa': { name: 'Chiikawa · Pink study nook', detail: 'Free for everyone: a milk-pink interface, checked-paper backgrounds and Chiikawa mascots on the taskbar and screens.' },
  // nền học
  'bg-mint': { name: 'Mint grid paper', detail: 'Cool mint green with a fine grid like a handwriting book.' },
  'bg-peach': { name: 'Morning peach', detail: 'Warm peach-pink with a faint grid — easy for long sessions.' },
  'bg-lemon': { name: 'Soft lemon', detail: 'Very pale lemon with a bullet-journal dot grid.' },
  'bg-lavender': { name: 'Lavender dots', detail: 'Relaxing lavender with a delicate dot grid.' },
  'bg-sky': { name: 'Morning sky lines', detail: 'Clear sky blue with ruled lines like writing paper.' },
  'bg-kraft': { name: 'Kraft paper', detail: 'Rustic kraft brown with tiny dots like a recycled notebook.' },
  'bg-notebook': { name: 'School notebook', detail: 'Ivory paper with blue lines and a red margin — just like your old school notebook.' },
  'bg-sage': { name: 'Sage diagonals', detail: 'Subtle sage green with fine, even diagonal lines.' },
  'bg-sand': { name: 'Plain sand', detail: 'Warm sand colour, no pattern — for a really clean background.' },
  'bg-rose': { name: 'Powder rose', detail: 'Gentle powder pink with a matching fine grid.' },
  'bg-aqua': { name: 'Clear lake', detail: 'Lake-water turquoise with diagonal ripples.' },
  'bg-dusk': { name: 'Purple dusk', detail: 'Pale purple fading to peach in the bottom corner — rare.' },
};

const FURNITURE_EN: Record<string, string> = {
  bed: 'Wooden bed',
  desk: 'Study desk',
  chair: 'Swivel chair',
  bookshelf: 'Bookshelf',
  sofa: 'Comfy sofa',
  table: 'Coffee table',
  lamp: 'Floor lamp',
  plant: 'Potted plant',
  aquarium: 'Aquarium',
  terrarium: 'Bug terrarium',
  piano: 'Piano',
  tv: 'TV stand',
  globe: 'Globe',
  trophy: 'Trophy cabinet',
  'rug-round': 'Round rug',
  'rug-long': 'Long rug',
  poster: 'IELTS 8.0 poster',
  clock: 'Wall clock',
  window: 'Garden window',
};

/** Tên món theo ngôn ngữ giao diện. */
export function itemName(item: Pick<ShopItem, 'id' | 'name' | 'furniture'>, locale: Locale): string {
  if (locale !== 'en') return item.name;
  if (item.furniture) return FURNITURE_EN[item.furniture] ?? item.name;
  return ITEM_EN[item.id]?.name ?? item.name;
}

/** Mô tả món theo ngôn ngữ giao diện. */
export function itemDetail(item: Pick<ShopItem, 'id' | 'detail' | 'furniture'>, locale: Locale): string {
  if (locale !== 'en') return item.detail;
  if (item.furniture) {
    if (item.detail.startsWith('Treo tường')) return 'Hangs on the wall of your home in the Knowledge City.';
    if (item.detail.startsWith('Trải sàn')) return 'Covers the floor; you can place other items on top.';
    return 'Decorate your home in the Knowledge City.';
  }
  return ITEM_EN[item.id]?.detail ?? item.detail;
}

const MASCOT_EN: Record<MascotId, { name: string; perk: string }> = {
  owl: { name: 'Wise Owl', perk: '3 free Ask Owl hints a day — removes 2 wrong options or reveals a word for you.' },
  fox: { name: 'Clever Fox', perk: 'Fox blocks your first wrong answer each day: no lost heart, no lost combo.' },
  cat: { name: 'Lazy Cat', perk: 'Every 10 correct answers, Cat restores 1 heart.' },
  dragon: { name: 'Baby Dragon', perk: 'Every hit is 20% stronger — defeat monsters faster.' },
};

export function mascotName(m: { id: MascotId; name: string }, locale: Locale): string {
  return locale === 'en' ? MASCOT_EN[m.id].name : m.name;
}

export function mascotPerk(m: { id: MascotId; perk: string }, locale: Locale): string {
  return locale === 'en' ? MASCOT_EN[m.id].perk : m.perk;
}

const TIER_EN: Record<string, string> = {
  'tan-binh': 'Rookie',
  'cham-chi': 'Diligent',
  'ben-bi': 'Persistent',
  'thien-xa': 'Sharpshooter',
  'thien-tai': 'Genius',
};

export function tierName(t: { key: string; name: string }, locale: Locale): string {
  return locale === 'en' ? (TIER_EN[t.key] ?? t.name) : t.name;
}

const LEVEL_TITLE_EN: Record<string, string> = {
  'Huyền thoại': 'Legend',
  'Đại sư': 'Grandmaster',
  'Hiệp sĩ chữ': 'Word Knight',
  'Thợ săn quái': 'Monster Hunter',
  'Tập sự': 'Apprentice',
  'Tân binh': 'Rookie',
};

/** Danh hiệu theo cấp (`titleForLevel`) — truyền vào chuỗi tiếng Việt nó trả về. */
export function levelTitle(vi: string, locale: Locale): string {
  return locale === 'en' ? (LEVEL_TITLE_EN[vi] ?? vi) : vi;
}

const ACHIEVEMENT_EN: Record<string, { title: string; detail: string }> = {
  'first-blood': { title: 'First strike', detail: 'Answer your first question correctly.' },
  hundred: { title: 'A hundred right', detail: 'Get 100 answers right in total.' },
  thousand: { title: 'A thousand right', detail: 'Get 1,000 answers right in total.' },
  'combo-10': { title: 'On fire', detail: 'Reach a 10 combo — your first time in Fever mode.' },
  'combo-25': { title: 'Unstoppable', detail: 'Reach a 25 combo.' },
  'hunter-5': { title: 'Hunter', detail: 'Defeat 5 monsters.' },
  'hunter-7': { title: 'Full bestiary', detail: 'Defeat all seven kinds of monster.' },
  dragon: { title: 'Blank Page Dragon slayer', detail: 'Defeat the boss twice — 14 monsters.' },
  'level-5': { title: 'Level 5', detail: 'Reach level 5.' },
  'level-10': { title: 'Level 10', detail: 'Reach level 10.' },
  'rise-again': { title: 'Back on your feet', detail: 'Got knocked out and kept studying.' },
};

export function achievementTitle(a: { id: string; title: string }, locale: Locale): string {
  return locale === 'en' ? (ACHIEVEMENT_EN[a.id]?.title ?? a.title) : a.title;
}

export function achievementDetail(a: { id: string; detail: string }, locale: Locale): string {
  return locale === 'en' ? (ACHIEVEMENT_EN[a.id]?.detail ?? a.detail) : a.detail;
}
