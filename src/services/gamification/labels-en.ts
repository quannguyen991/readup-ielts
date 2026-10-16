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
  'theme-cyber': { name: 'Cyber · Neon blue', detail: 'Unlock the cyber pixel look: a navy night background, neon cyan outlines, electric-blue buttons and glowing offset shadows across the app.' },
  'theme-pixel': { name: 'Pixel · Y2K lilac', detail: 'Unlock the pixel look: a lilac grid background, ink-outlined panels with hard shadows and pink, cyan and purple pixel buttons across the app.' },
  'theme-retro': { name: 'Retro · Star ledger', detail: 'Unlock the retro look: rainbow ribbons, 70s striped type, ink-outlined icons and cream surfaces across the app.' },
  'theme-matcha': { name: 'Matcha tea', detail: 'A soft green-tea look with a calm, zen feel.' },
  'theme-chiikawa': { name: 'Chiikawa · Pink study nook', detail: 'Unlock a milk-pink interface, checked-paper backgrounds and Chiikawa mascots on the taskbar and screens.' },
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
