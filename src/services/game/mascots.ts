/**
 * LINH VẬT — bạn đồng hành đứng cạnh nhân vật trên thanh trận đấu, đổi bằng sao.
 *
 * Mỗi con giúp một kiểu, đều tính bằng MÃ (không gọi AI), và đều là giúp chứ
 * không làm hộ: bỏ bớt phương án sai, đỡ một câu sai, hồi tim, chém mạnh hơn.
 * Đáp án vẫn phải tự chọn.
 *
 * Chỉ đeo một con một lúc — để lựa chọn có nghĩa.
 */

export type MascotId = 'owl' | 'fox' | 'cat' | 'dragon';

export type Perks = {
  /** Số lượt Hỏi Cú miễn phí mỗi ngày (không trừ vật phẩm). */
  freeHints: number;
  /** Câu sai ĐẦU TIÊN mỗi ngày không mất tim, không mất combo. */
  firstMissShield: boolean;
  /** Cứ bao nhiêu câu đúng thì hồi một tim (0 = không). */
  healEvery: number;
  /** Nhân sát thương mỗi nhát chém. */
  damageMult: number;
};

export const NO_PERKS: Perks = { freeHints: 0, firstMissShield: false, healEvery: 0, damageMult: 1 };

export type Mascot = {
  id: MascotId;
  name: string;
  /** Tên sprite pixel và màu thân. */
  look: 'owl' | 'fox' | 'cat' | 'dragon';
  color: string;
  perk: string;
  /** Câu linh vật nói khi giúp. */
  line: string;
  perks: Perks;
};

export const MASCOTS: Record<MascotId, Mascot> = {
  owl: {
    id: 'owl',
    name: 'Cú Thông Thái',
    look: 'owl',
    color: '#A16207',
    perk: 'Mỗi ngày 3 lượt Hỏi Cú miễn phí — bỏ bớt 2 phương án sai hoặc mở hộ một từ.',
    line: 'Hù hù! Hai đáp án này chắc chắn sai nhé.',
    perks: { ...NO_PERKS, freeHints: 3 },
  },
  fox: {
    id: 'fox',
    name: 'Cáo Tinh Ranh',
    look: 'fox',
    color: '#F97316',
    perk: 'Câu sai đầu tiên mỗi ngày được Cáo đỡ: không mất tim, không mất combo.',
    line: 'Suýt nữa! Lần này tớ đỡ cho, câu sau cẩn thận nha.',
    perks: { ...NO_PERKS, firstMissShield: true },
  },
  cat: {
    id: 'cat',
    name: 'Mèo Lười',
    look: 'cat',
    color: '#94A3B8',
    perk: 'Cứ 10 câu đúng, Mèo hồi cho 1 tim.',
    line: 'Meo~ nghỉ một nhịp, hồi một tim.',
    perks: { ...NO_PERKS, healEvery: 10 },
  },
  dragon: {
    id: 'dragon',
    name: 'Rồng Con',
    look: 'dragon',
    color: '#34D399',
    perk: 'Mỗi nhát chém mạnh thêm 20% — hạ quái nhanh hơn.',
    line: 'Phì phì! Tớ thổi thêm lửa vào nhát chém.',
    perks: { ...NO_PERKS, damageMult: 1.2 },
  },
};

export function perksOf(id: MascotId | null | undefined): Perks {
  return id ? MASCOTS[id].perks : NO_PERKS;
}

/** Sao thưởng từ trận đấu — cộng vào số sao đổi quà, ngoài sao tính từ thời gian học. */
export const STAR_BONUS = { defeat: 2, boss: 10, levelUp: 5, quest: 3, achievement: 5 } as const;
