import React from 'react';
import { Image, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { CHIIKAWA_IMG } from './chiikawa';

type Art = (s: number) => React.ReactElement;

const PINK = '#F58AB0';
const DEEP = '#D65E86';
const INK = '#7A4E62';

/** Nhãn dán vẽ bằng mã (không dùng ảnh): hình tròn kiểu Chiikawa, mặt chấm mắt má hồng. */
const heart: Art = (s) => (
  <Svg width={s} height={s} viewBox="0 0 48 48">
    <Path d="M24 41C10 31 6 23 6 16.5 6 11 10 7.5 15 7.5c3.6 0 7 2 9 5.200 2-3.200 5.400-5.200 9-5.200 5 0 9 3.500 9 9 0 6.500-4 14.500-18 24.500z" fill={PINK} stroke="#fff" strokeWidth={3} />
    <Circle cx={18} cy={20} r={2} fill={INK} />
    <Circle cx={30} cy={20} r={2} fill={INK} />
    <Path d="M21.500 25q2.500 2.500 5 0" stroke={INK} strokeWidth={1.800} fill="none" strokeLinecap="round" />
  </Svg>
);

const star: Art = (s) => (
  <Svg width={s} height={s} viewBox="0 0 48 48">
    <Path d="M24 4l6.200 13.200 14.300 1.800-10.500 9.900 2.700 14.200L24 36.200 11.300 43.100 14 28.900 3.500 19l14.300-1.800z" fill="#FFD966" stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
    <Circle cx={19} cy={23} r={1.900} fill={INK} />
    <Circle cx={29} cy={23} r={1.900} fill={INK} />
    <Circle cx={16} cy={28} r={2.400} fill="#FFB3C7" />
    <Circle cx={32} cy={28} r={2.400} fill="#FFB3C7" />
  </Svg>
);

const cherry: Art = (s) => (
  <Svg width={s} height={s} viewBox="0 0 48 48">
    <Path d="M24 8c-2 8-6 14-8 22M24 8c2 8 6 14 8 22M24 8c4-4 9-4 13-2" stroke="#7BBF6A" strokeWidth={3} fill="none" strokeLinecap="round" />
    <Circle cx={15} cy={34} r={9} fill="#F0547F" stroke="#fff" strokeWidth={3} />
    <Circle cx={33} cy={34} r={9} fill="#F0547F" stroke="#fff" strokeWidth={3} />
    <Circle cx={12} cy={31} r={2} fill="#fff" opacity={0.7} />
    <Circle cx={30} cy={31} r={2} fill="#fff" opacity={0.7} />
  </Svg>
);

const bow: Art = (s) => (
  <Svg width={s} height={s} viewBox="0 0 48 48">
    <Path d="M24 24L6 12v24z" fill={PINK} stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
    <Path d="M24 24l18-12v24z" fill={PINK} stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
    <Rect x={19} y={18} width={10} height={12} rx={4} fill={DEEP} stroke="#fff" strokeWidth={3} />
  </Svg>
);

const cloud: Art = (s) => (
  <Svg width={s} height={s} viewBox="0 0 48 48">
    <G fill="#fff" stroke="#BFE3F5" strokeWidth={2.500}>
      <Ellipse cx={24} cy={30} rx={16} ry={9} />
      <Circle cx={17} cy={24} r={8} />
      <Circle cx={29} cy={22} r={9} />
    </G>
    <Circle cx={20} cy={30} r={1.800} fill={INK} />
    <Circle cx={28} cy={30} r={1.800} fill={INK} />
    <Circle cx={17} cy={34} r={2.200} fill="#FFB3C7" />
    <Circle cx={31} cy={34} r={2.200} fill="#FFB3C7" />
  </Svg>
);

const strawberry: Art = (s) => (
  <Svg width={s} height={s} viewBox="0 0 48 48">
    <Path d="M24 43C10 37 7 22 8 17c8-4 24-4 32 0 1 5-2 20-16 26z" fill="#F0547F" stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
    <Path d="M14 15l5-6 5 4 5-4 5 6" fill="#7BBF6A" stroke="#fff" strokeWidth={2.500} strokeLinejoin="round" />
    <Circle cx={18} cy={25} r={1.500} fill="#FFE7A0" />
    <Circle cx={28} cy={24} r={1.500} fill="#FFE7A0" />
    <Circle cx={23} cy={32} r={1.500} fill="#FFE7A0" />
    <Circle cx={30} cy={32} r={1.500} fill="#FFE7A0" />
  </Svg>
);

type Sticker = { key: string; label: string; tilt: number; image?: number; art?: Art };

const STICKERS: Sticker[] = [
  { key: 'wave', label: 'Chào nhé!', tilt: -5, image: CHIIKAWA_IMG.wave },
  { key: 'cheer', label: 'Cố lên!', tilt: 4, image: CHIIKAWA_IMG.cheer },
  { key: 'heart', label: 'Yêu lắm', tilt: -3, art: heart },
  { key: 'peek', label: 'Ló đầu…', tilt: 5, image: CHIIKAWA_IMG.peek },
  { key: 'star', label: 'Giỏi quá', tilt: 6, art: star },
  { key: 'lie', label: 'Nằm chút', tilt: -4, image: CHIIKAWA_IMG.lie },
  { key: 'cherry', label: 'Ngọt ghê', tilt: -6, art: cherry },
  { key: 'sleep', label: 'Ngủ ngon', tilt: 3, image: CHIIKAWA_IMG.sleep },
  { key: 'bow', label: 'Xinh xỉu', tilt: 5, art: bow },
  { key: 'cloud', label: 'Nhẹ tênh', tilt: -4, art: cloud },
  { key: 'strawberry', label: 'Dâu tây', tilt: 4, art: strawberry },
  { key: 'study', label: 'Học bài', tilt: -4, image: CHIIKAWA_IMG.sStudy },
  { key: 'read', label: 'Đọc sách', tilt: 3, image: CHIIKAWA_IMG.sRead },
  { key: 'headphones', label: 'Nghe nhạc', tilt: 5, image: CHIIKAWA_IMG.sHeadphones },
  { key: 'eatStrawberry', label: 'Ăn dâu nè', tilt: -5, image: CHIIKAWA_IMG.sStrawberry },
  { key: 'happy', label: 'Vui quá!', tilt: 4, image: CHIIKAWA_IMG.sHappy },
  { key: 'trophy', label: 'Vô địch', tilt: -3, image: CHIIKAWA_IMG.sTrophy },
  { key: 'think', label: 'Hmm…', tilt: 5, image: CHIIKAWA_IMG.sThink },
  { key: 'giftHeart', label: 'Tặng tim', tilt: -4, image: CHIIKAWA_IMG.sHeart },
  { key: 'bye', label: 'Hẹn mai', tilt: 3, image: CHIIKAWA_IMG.sBye },
];

const ORDER = STICKERS.map((x) => x.key);

/** Biểu tượng tác vụ → nhãn dán hợp nghĩa (không có thì chọn ổn định theo tên). */
const FOR_ICON: Record<string, string> = {
  book: 'read', letters: 'read', note: 'study', pencil: 'study', clipboard: 'study', bookmark: 'read',
  trophy: 'trophy', star: 'star', flame: 'cheer', trending: 'cheer', bell: 'wave', search: 'think',
  headphones: 'headphones', mic: 'headphones', heart: 'heart', settings: 'bow', home: 'wave',
};

/** Trang nào → nhãn dán hợp nghĩa (cho góc trang). Không khớp thì null: giữ hình cũ. */
const PATH_RULES: [RegExp, string][] = [
  [/listen|nghe|shadow/, 'headphones'],
  [/vocab|tu-vung|tu-sach|oxford|cefr/, 'read'],
  [/read|luyen-doc|library|bilingual/, 'read'],
  [/speak|noi/, 'wave'],
  [/sat|math|toan|ngu-phap|sentence/, 'think'],
  [/quest|leaderboard|progress|weekly|mastery|lich-su/, 'trophy'],
  [/shop/, 'strawberry'],
  [/profile|settings|invite/, 'giftHeart'],
  [/practice|mock|ielts|toefl|toeic|hsa|review|errors|notes|bookmarks/, 'study'],
];
export function stickerForPath(path: string): string | null {
  for (const [re, name] of PATH_RULES) if (re.test(path)) return name;
  return null;
}

/** Một nhãn dán Chiikawa theo tên, hoặc chọn ổn định theo `seed` (ví dụ tên biểu tượng) để mỗi mục một hình. */
export function ChiikawaSticker({ name, seed, size = 44 }: { name?: string; seed?: string; size?: number }) {
  let idx = ORDER.indexOf(name ?? FOR_ICON[seed ?? ''] ?? '');
  if (idx < 0) {
    let h = 0;
    for (const c of seed ?? '') h = (h * 31 + c.charCodeAt(0)) >>> 0;
    idx = h % STICKERS.length;
  }
  const st = STICKERS[idx]!;
  return (
    <View pointerEvents="none" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: `${st.tilt}deg` }] }}>
      {st.image ? <Image source={st.image} resizeMode="contain" style={{ width: size, height: size }} /> : st.art ? st.art(size) : null}
    </View>
  );
}

/** Bộ nhãn dán Chiikawa trong hồ sơ: miếng dán viền trắng hơi nghiêng, kèm lời ngắn. Chỉ trang trí, không nhận chạm. */
export function ChiikawaStickerRow({ title }: { title: string }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: INK }}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }} pointerEvents="none">
        {STICKERS.map((st) => (
          <View key={st.key} style={{ width: 92, alignItems: 'center', transform: [{ rotate: `${st.tilt}deg` }] }}>
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 26,
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: '#FBD3E1',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px rgba(214,94,134,0.22)',
              }}
            >
              {st.image ? <Image source={st.image} resizeMode="contain" style={{ width: 70, height: 70 }} /> : st.art ? st.art(58) : null}
            </View>
            <View style={{ marginTop: -8, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: '#FFE8F0', borderWidth: 1.500, borderColor: '#FFFFFF' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: DEEP }}>{st.label}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
