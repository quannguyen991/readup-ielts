# Du học G1 (Singapore): căn hộ, làm thêm và tiền riêng — Kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (làm trực tiếp trong phiên này) hoặc superpowers:subagent-driven-development để thực hiện từng task. Các bước dùng cú pháp checkbox (`- [ ]`) để theo dõi.

**Goal:** Đưa căn hộ Singapore, một việc làm thêm (việc 1) và sổ tiền riêng "đồng du học" vào chiến dịch Du học, đồng bộ được giữa nhiều máy.

**Architecture:** Logic thuần (tiền, ca làm, tiền thuê, điều kiện đặt đồ) nằm trong `src/services/study-abroad/economy.ts`, có test. Store Zustand chỉ gọi các hàm thuần đó. Đồng bộ dùng lại `mergeLedgers` của Du ngoạn. Dữ liệu việc làm và đồ có giá là file dữ liệu tĩnh, viết tay.

**Tech Stack:** TypeScript, Zustand (persist), React Native / Expo Router, test bằng `node:test` chạy qua `tsx`.

**Spec:** [docs/superpowers/specs/2026-10-11-du-hoc-can-ho-lam-them-design.md](../specs/2026-10-11-du-hoc-can-ho-lam-them-design.md)

## Global Constraints

- Tiền thuê căn hộ: 30 đồng mỗi tuần học; một tuần học = 7 ngày học.
- Mỗi câu đúng trong ca: 10 đồng; ca được trả khi đạt từ 3/4 câu trở lên.
- Mỗi ca có đúng 4 tình huống.
- Tối đa 2 ca được trả mỗi ngày học.
- Tiền riêng dùng tiền tố `pay:`; không được lẫn với `tk:` (vé) và `co:` (xu).
- Đồ có giá phải mua mới đặt được. Mua bị từ chối khi thiếu tiền hoặc còn nợ tiền thuê.
- Không tạo tiền thật, không gọi AI lúc chạy. Nội dung tình huống do người viết và kiểm tay.
- Mọi chuỗi hiển thị phải có cả `vi` và `en`.
- Không đổi `version: 1` của persist store `useStudyAbroadStore`. Đổi version mà không có `migrate` sẽ làm mất dữ liệu đã lưu.
- Không commit trong kế hoạch này, trừ khi bạn yêu cầu. Repo đang có nhiều thay đổi chưa commit của bạn.
- Tạo file bằng công cụ Write, không ghi UTF-8 bằng PowerShell (dễ làm hỏng dấu tiếng Việt).
- Trước khi tạo file mới, chạy `git ls-files <đường dẫn>` để chắc chưa có file cùng tên.

## Quyết định của kế hoạch (không có trong spec)

- Ca làm không cộng XP của hệ game. Lý do: tránh đếm hai lần với luồng `useGameStore.answer`.
- Ca trượt (dưới 3/4) không ghi sổ, nên không tính vào giới hạn 2 ca và làm lại được ngay.
- G1 chỉ có căn hộ Singapore. Tiền thuê tính từ khi nhiệm vụ `arrival` xong và tiếp tục theo tuần học cho tới hết chiến dịch.
- Mã khoản ca làm là `pay:shift:<ngày học>:<attemptId>`. `attemptId` sinh một lần khi bắt đầu ca, nên nộp hai lần vẫn chỉ trả một lần.

## Review Focus

1. Nộp cùng một ca hai lần làm trả tiền hai lần. Pin bằng test `recordShift` trả `duplicate` (Task 3).
2. Mua đồ khi thiếu tiền hoặc còn nợ tiền thuê được chấp nhận. Pin bằng test `checkBuy` (Task 3).
3. Nợ tiền thuê nhiều tuần, rồi có đủ tiền một lúc, phải trừ tuần cũ trước và không đẩy số dư xuống âm. Pin bằng test `settleRent` (Task 3).
4. Dữ liệu cũ không có sổ tiền, hoặc món có giá được đặt khi chưa mua, phải đọc an toàn. Pin bằng test `normalizeStudyAbroad` (Task 4).
5. Dữ liệu việc làm sai (địa điểm không tồn tại, đáp án ngoài khoảng, đáp án trùng nhau) phải bị test bắt. Pin bằng test `study-abroad-jobs.test.ts` (Task 2).

**Giới hạn đã biết (không test):** hai máy cùng nhận ca trong một ngày học có thể vượt giới hạn 2 ca, vì mỗi máy chỉ kiểm sổ của chính nó trước khi ghi. Việc này chấp nhận được ở G1; ghi lại để xem khi có phản hồi.

---

## File Structure

| File | Trạng thái | Trách nhiệm |
|---|---|---|
| `src/data/study-abroad-dorm.ts` | Sửa | Thêm trường `price` và hai vật phẩm có giá của Singapore |
| `src/data/study-abroad-pricing.test.ts` | Tạo | Test vật phẩm có giá |
| `src/data/study-abroad-jobs.ts` | Tạo | Danh mục việc làm và tình huống ca làm |
| `src/data/study-abroad-jobs.test.ts` | Tạo | Test dữ liệu việc làm |
| `src/services/study-abroad/economy.ts` | Tạo | Hàm thuần: số dư, ca làm, tiền thuê, mua, điều kiện đặt đồ |
| `src/services/study-abroad/economy.test.ts` | Tạo | Test hàm thuần |
| `src/services/study-abroad/sync.ts` | Sửa | Thêm `ledger` vào payload, normalize và merge |
| `src/services/study-abroad/sync.test.ts` | Sửa | Thêm test sổ tiền và đồ có giá |
| `src/store/useStudyAbroadStore.ts` | Sửa | Thêm `ledger`, `workShift`, `buyDecoration`; gắn tiền thuê vào `completeMission` |
| `src/services/sync/stores.ts` | Sửa | Đưa `ledger` vào payload đồng bộ (quanh dòng 300) |
| `app/quest/study-abroad/work.tsx` | Tạo | Màn làm việc: nhận ca, trả lời 4 tình huống, nhận lương |
| `app/quest/study-abroad/dorm.tsx` | Sửa | Hiện số dư, tình trạng tiền thuê, nút mua đồ có giá, lối vào màn việc |

---

## Task 1: Vật phẩm có giá

**Files:**
- Create: `src/data/study-abroad-pricing.test.ts`
- Modify: `src/data/study-abroad-dorm.ts` (type `DormDecoration`, mảng `STUDY_ABROAD_DECORATIONS`)

**Interfaces:**
- Consumes: `STUDY_ABROAD_MISSIONS` từ `src/data/study-abroad-campaign.ts`.
- Produces: `DormDecoration.price?: number`. Hai vật phẩm `sg-orchid` (40 đồng, slot `corner`) và `sg-hawker-poster` (20 đồng, slot `wall`), đều mở bằng `arrival`.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/data/study-abroad-pricing.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import { STUDY_ABROAD_DECORATIONS } from './study-abroad-dorm';
import { STUDY_ABROAD_MISSIONS } from './study-abroad-campaign';

test('đồ có giá: giá dương và mở bằng một nhiệm vụ có thật', () => {
  const missionIds = new Set(STUDY_ABROAD_MISSIONS.map((mission) => mission.id));
  const priced = STUDY_ABROAD_DECORATIONS.filter((item) => item.price !== undefined);
  assert.ok(priced.length >= 2, 'cần ít nhất hai món có giá');
  for (const item of priced) {
    assert.ok((item.price ?? 0) > 0, `${item.id} price`);
    assert.ok(item.unlockMission && missionIds.has(item.unlockMission), `${item.id} unlock`);
  }
});

test('mọi vật phẩm có id duy nhất', () => {
  const ids = STUDY_ABROAD_DECORATIONS.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx tsx --test src/data/study-abroad-pricing.test.ts`
Expected: FAIL với "cần ít nhất hai món có giá" (`priced.length` là 0).

- [ ] **Step 3: Thêm trường giá và hai vật phẩm**

Trong `src/data/study-abroad-dorm.ts`, sửa type `DormDecoration`:

```ts
export type DormDecoration = {
  id: string;
  slot: DormSlot;
  glyph: string;
  name: Bi;
  description: Bi;
  unlockMission?: string;
  /** Giá bằng đồng du học. Có giá thì phải mua mới đặt được (xem services/study-abroad/economy.ts). */
  price?: number;
};
```

Trong mảng `STUDY_ABROAD_DECORATIONS`, thêm hai dòng ngay trước dòng `];` đóng mảng:

```ts
  { id: 'sg-orchid', slot: 'corner', glyph: '🌺', name: { vi: 'Chậu lan Singapore', en: 'Singapore orchid' }, description: { vi: 'Loài lan là quốc hoa của Singapore.', en: 'The orchid is Singapore\'s national flower.' }, unlockMission: 'arrival', price: 40 },
  { id: 'sg-hawker-poster', slot: 'wall', glyph: '🍜', name: { vi: 'Tranh món hawker', en: 'Hawker food poster' }, description: { vi: 'Tranh vẽ các món ăn vặt Singapore.', en: 'A print of Singapore street-food dishes.' }, unlockMission: 'arrival', price: 20 },
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npx tsx --test src/data/study-abroad-pricing.test.ts`
Expected: PASS (2 test).

---

## Task 2: Dữ liệu việc làm Singapore

**Files:**
- Create: `src/data/study-abroad-jobs.ts`
- Create: `src/data/study-abroad-jobs.test.ts`

**Interfaces:**
- Consumes: `getPoiContent` từ `src/data/travel/pois.ts`; `STUDY_PAY.questionsPerShift` từ `src/services/study-abroad/economy.ts` (Task 3).
- Produces: `ShiftQuestion`, `StudyJob`, `STUDY_JOBS: readonly StudyJob[]`. G1 chỉ có một việc: `sg-hawker-server`, gắn với POI `singapore-hawker`, mở bằng `arrival`.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/data/study-abroad-jobs.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import { getPoiContent } from '@/data/travel/pois';
import { STUDY_PAY } from '@/services/study-abroad/economy';
import { STUDY_ABROAD_MISSIONS } from './study-abroad-campaign';
import { STUDY_JOBS } from './study-abroad-jobs';

test('việc làm: địa điểm có thật trong đúng thành phố, nhiệm vụ mở có thật', () => {
  const missionIds = new Set(STUDY_ABROAD_MISSIONS.map((mission) => mission.id));
  assert.ok(STUDY_JOBS.length >= 1);
  for (const job of STUDY_JOBS) {
    const poi = getPoiContent(job.poi);
    assert.ok(poi, `${job.id} POI ${job.poi} không tồn tại`);
    assert.equal(poi.city, job.city, `${job.id} sai thành phố`);
    assert.ok(missionIds.has(job.unlockMission), `${job.id} nhiệm vụ mở không tồn tại`);
  }
});

test('ca làm: đủ số tình huống, đáp án trong khoảng, đáp án không trùng nhau', () => {
  for (const job of STUDY_JOBS) {
    assert.equal(job.questions.length, STUDY_PAY.questionsPerShift, `${job.id} số tình huống`);
    for (const question of job.questions) {
      assert.equal(question.options.length, 4, `${question.id} số đáp án`);
      assert.ok(question.answer >= 0 && question.answer < question.options.length, `${question.id} chỉ số đáp án`);
      assert.equal(new Set(question.options).size, question.options.length, `${question.id} đáp án trùng nhau`);
      assert.ok(question.explanation.vi && question.explanation.en, `${question.id} thiếu giải thích`);
    }
  }
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx tsx --test src/data/study-abroad-jobs.test.ts`
Expected: FAIL với "Cannot find module './study-abroad-jobs'".

- [ ] **Step 3: Viết dữ liệu việc làm**

Tạo `src/data/study-abroad-jobs.ts`:

```ts
import type { Bi } from '@/i18n/useL';

/** Một tình huống trong ca làm: khách nói một câu, có bốn đáp án, một đáp án đúng. */
export type ShiftQuestion = {
  id: string;
  customer: string;
  options: readonly string[];
  answer: number;
  explanation: Bi;
};

/** Việc làm thêm gắn với một địa điểm có sẵn trên bản đồ thành phố (không vẽ thêm). */
export type StudyJob = {
  id: string;
  city: 'singapore';
  title: Bi;
  place: Bi;
  /** Mã địa điểm trong `src/data/travel/pois.ts`. */
  poi: string;
  /** Nhiệm vụ phải xong trước khi việc này mở. */
  unlockMission: string;
  questions: readonly ShiftQuestion[];
};

export const STUDY_JOBS: readonly StudyJob[] = [
  {
    id: 'sg-hawker-server',
    city: 'singapore',
    title: { vi: 'Phục vụ quầy Hawker', en: 'Hawker stall server' },
    place: { vi: 'Khu ăn vặt Hawker', en: 'Hawker centre' },
    poi: 'singapore-hawker',
    unlockMission: 'arrival',
    questions: [
      {
        id: 'seat',
        customer: 'Excuse me, is this seat taken?',
        options: ['Yes, the seat is very nice.', 'No, it is free. Please have a seat.', 'I took the seat to the station.', 'The seat is in the sea.'],
        answer: 1,
        explanation: { vi: '“No, it is free” trả lời đúng câu hỏi có hay không; “Please have a seat” mời khách ngồi.', en: '“No, it is free” answers the yes-or-no question; “Please have a seat” invites the customer to sit.' },
      },
      {
        id: 'takeaway',
        customer: 'Can I get one bowl of chicken rice to go, please?',
        options: ['Of course. That will be four dollars, please.', 'I went to the bowl yesterday.', 'Chicken rice is a very long train.', 'Please sit down and wait for the bus.'],
        answer: 0,
        explanation: { vi: '“Of course” nhận yêu cầu; “That will be…” báo giá.', en: '“Of course” accepts the request; “That will be…” states the price.' },
      },
      {
        id: 'repeat',
        customer: 'Sorry, I didn\'t catch that. Could you say it again?',
        options: ['No, I am not hungry at all.', 'Sorry, I am going to the station.', 'Of course. I said the chicken rice costs four dollars.', 'The rice is in the bus.'],
        answer: 2,
        explanation: { vi: 'Nhắc lại đúng ý, mở đầu lịch sự bằng “Of course”.', en: 'Repeats the point politely, opening with “Of course”.' },
      },
      {
        id: 'spicy',
        customer: 'Is there any chilli sauce? I don\'t like it too spicy.',
        options: ['Yes, we have chilli sauce. It is mild, so try a little.', 'No, the sauce is in the sea.', 'The sauce is very sweet yesterday.', 'I can\'t speak English to you.'],
        answer: 0,
        explanation: { vi: 'Trả lời có hay không rồi mô tả mức cay (“mild”) đúng yêu cầu của khách.', en: 'Answers yes or no, then describes the heat level (“mild”) as the customer asked.' },
      },
    ],
  },
];
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npx tsx --test src/data/study-abroad-jobs.test.ts`
Expected: PASS (2 test). Nếu test báo lỗi import `@/services/study-abroad/economy`, kiểm lại sau khi hoàn thành Task 3; test này phụ thuộc `STUDY_PAY`.

---

## Task 3: Hàm thuần cho tiền riêng

**Files:**
- Create: `src/services/study-abroad/economy.ts`
- Create: `src/services/study-abroad/economy.test.ts`

**Interfaces:**
- Consumes: `ledgerAdd`, `ledgerSum`, `type Ledger` từ `src/services/travel/economy.ts`; `STUDY_ABROAD_MISSIONS`, `STUDY_DAYS`, `DormDecoration`.
- Produces:
  - `STUDY_PAY` (hằng số), `SG_APARTMENT` (`{ city: 'singapore', unlockMission: 'arrival' }`), `PAY_PREFIX`.
  - `type BuyCheck = 'ok' | 'owned' | 'rent-unpaid' | 'poor'`, `type ShiftReason = 'paid' | 'failed' | 'full' | 'duplicate'`.
  - `balanceOf(ledger): number`, `currentStudyDay(completed): number`, `shiftPay(correct): number`, `shiftsOnDay(ledger, day): number`, `recordShift(ledger, day, attemptId, correct): { ledger; paid; reason }`, `weekOf(day): number`, `rentOwed(ledger, city, day): number[]`, `settleRent(ledger, city, day): Ledger`, `owns(ledger, itemId): boolean`, `checkBuy(ledger, city, day, item): BuyCheck`, `buy(ledger, item): Ledger`, `canEquip(item, completed, ledger): boolean`.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/services/study-abroad/economy.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import type { DormDecoration } from '@/data/study-abroad-dorm';
import { STUDY_ABROAD_MISSIONS } from '@/data/study-abroad-campaign';
import { STUDY_DAYS } from '@/data/study-abroad-schedule';
import type { Ledger } from '@/services/travel/economy';
import { balanceOf, buy, canEquip, checkBuy, currentStudyDay, recordShift, rentOwed, settleRent, shiftPay, weekOf } from './economy';

const ORCHID: DormDecoration = {
  id: 'sg-orchid',
  slot: 'corner',
  glyph: '🌺',
  name: { vi: 'Chậu lan', en: 'Orchid' },
  description: { vi: 'x', en: 'x' },
  unlockMission: 'arrival',
  price: 40,
};

test('điểm ca: đạt từ 3/4 mới được trả, mỗi câu đúng 10 đồng', () => {
  assert.equal(shiftPay(2), 0);
  assert.equal(shiftPay(3), 30);
  assert.equal(shiftPay(4), 40);
});

test('ca đạt được ghi một lần; nộp lại cùng mã ca không trả thêm', () => {
  const first = recordShift({}, 1, 'a1', 4);
  assert.equal(first.paid, 40);
  assert.equal(balanceOf(first.ledger), 40);
  const again = recordShift(first.ledger, 1, 'a1', 4);
  assert.equal(again.reason, 'duplicate');
  assert.equal(again.paid, 0);
  assert.equal(balanceOf(again.ledger), 40);
});

test('một ngày học nhận tối đa 2 ca được trả; ca trượt không ghi sổ; ngày khác vẫn nhận được', () => {
  let ledger: Ledger = recordShift({}, 1, 'a1', 4).ledger;
  ledger = recordShift(ledger, 1, 'a2', 3).ledger;
  const third = recordShift(ledger, 1, 'a3', 4);
  assert.equal(third.reason, 'full');
  assert.equal(balanceOf(third.ledger), 70);

  const failed = recordShift({}, 1, 'b1', 2);
  assert.equal(failed.reason, 'failed');
  assert.deepEqual(failed.ledger, {});

  assert.equal(recordShift(ledger, 2, 'a3', 4).reason, 'paid');
});

test('tuần thuê: 7 ngày học một tuần', () => {
  assert.equal(weekOf(1), 0);
  assert.equal(weekOf(7), 0);
  assert.equal(weekOf(8), 1);
});

test('tiền thuê: thiếu tiền thì để nợ; đủ tiền thì trừ các tuần nợ, tuần cũ trước', () => {
  assert.deepEqual(rentOwed({}, 'singapore', 1), [0]);
  const unpaid = settleRent({}, 'singapore', 1);
  assert.deepEqual(rentOwed(unpaid, 'singapore', 1), [0]);

  const funded: Ledger = { 'pay:shift:1:x': 65 };
  const settled = settleRent(funded, 'singapore', 8);
  assert.deepEqual(rentOwed(settled, 'singapore', 8), []);
  assert.equal(balanceOf(settled), 5);
});

test('mua đồ: phải đủ tiền, và không được mua khi còn nợ tiền thuê', () => {
  assert.equal(checkBuy({ 'pay:shift:1:x': 60, 'pay:rent:singapore:0': -30 }, 'singapore', 1, ORCHID), 'poor');
  assert.equal(checkBuy({ 'pay:shift:1:x': 100 }, 'singapore', 1, ORCHID), 'rent-unpaid');

  const paidRent: Ledger = { 'pay:shift:1:x': 100, 'pay:rent:singapore:0': -30 };
  assert.equal(checkBuy(paidRent, 'singapore', 1, ORCHID), 'ok');
  const bought = buy(paidRent, ORCHID);
  assert.equal(balanceOf(bought), 30);
  assert.equal(checkBuy(bought, 'singapore', 1, ORCHID), 'owned');
});

test('đồ có giá: cần mở bằng nhiệm vụ và đã mua mới đặt được', () => {
  assert.equal(canEquip(ORCHID, [], {}), false);
  assert.equal(canEquip(ORCHID, ['arrival'], {}), false);
  assert.equal(canEquip(ORCHID, ['arrival'], { 'pay:buy:sg-orchid': -40 }), true);
});

test('ngày học hiện tại đi theo nhiệm vụ chưa làm', () => {
  assert.equal(currentStudyDay([]), 1);
  assert.equal(currentStudyDay(['arrival']), 1);
  assert.equal(currentStudyDay(['arrival', 'campus-id']), 2);
  assert.equal(currentStudyDay(STUDY_ABROAD_MISSIONS.map((mission) => mission.id)), STUDY_DAYS.length);
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx tsx --test src/services/study-abroad/economy.test.ts`
Expected: FAIL với "Cannot find module './economy'".

- [ ] **Step 3: Viết hàm thuần**

Tạo `src/services/study-abroad/economy.ts`:

```ts
import { STUDY_ABROAD_MISSIONS } from '@/data/study-abroad-campaign';
import type { DormDecoration } from '@/data/study-abroad-dorm';
import { STUDY_DAYS } from '@/data/study-abroad-schedule';
import { ledgerAdd, ledgerSum, type Ledger } from '@/services/travel/economy';

/** Mọi con số của lớp tiền riêng ở một chỗ. Đổi ở đây, test canh theo đây. */
export const STUDY_PAY = {
  payPerCorrect: 10,
  questionsPerShift: 4,
  /** Đạt từ bấy nhiêu câu đúng trở lên thì ca được trả lương. */
  passAt: 3,
  shiftsPerDay: 2,
  rentPerWeek: 30,
  daysPerWeek: 7,
} as const;

/** Căn hộ Singapore: mở sau nhiệm vụ đầu tiên; tiền thuê tính từ lúc đó. */
export const SG_APARTMENT = { city: 'singapore', unlockMission: 'arrival' } as const;

export const PAY_PREFIX = 'pay:';
const SHIFT_PREFIX = 'pay:shift:';
const RENT_PREFIX = 'pay:rent:';
const BUY_PREFIX = 'pay:buy:';

export type BuyCheck = 'ok' | 'owned' | 'rent-unpaid' | 'poor';
export type ShiftReason = 'paid' | 'failed' | 'full' | 'duplicate';

const has = (ledger: Ledger, id: string) => Object.prototype.hasOwnProperty.call(ledger, id);

export function balanceOf(ledger: Ledger): number {
  return Math.max(0, ledgerSum(ledger, PAY_PREFIX));
}

/** Ngày học hiện tại = ngày chứa nhiệm vụ chưa làm đầu tiên; làm hết thì là ngày cuối. */
export function currentStudyDay(completed: readonly string[]): number {
  const next = STUDY_ABROAD_MISSIONS.find((mission) => !completed.includes(mission.id));
  if (!next) return STUDY_DAYS.length;
  return STUDY_DAYS.find((day) => day.missions.some((mission) => mission.id === next.id))?.day ?? 1;
}

export function shiftPay(correct: number): number {
  return correct >= STUDY_PAY.passAt ? correct * STUDY_PAY.payPerCorrect : 0;
}

export function shiftsOnDay(ledger: Ledger, day: number): number {
  const prefix = `${SHIFT_PREFIX}${day}:`;
  return Object.keys(ledger).filter((id) => id.startsWith(prefix)).length;
}

/**
 * Ghi một ca đã làm. `attemptId` sinh MỘT lần khi bắt đầu ca, nên nộp lại cùng ca
 * trả về `duplicate` và không trả thêm. Ca trượt không ghi sổ, nên làm lại được.
 */
export function recordShift(ledger: Ledger, day: number, attemptId: string, correct: number): { ledger: Ledger; paid: number; reason: ShiftReason } {
  const id = `${SHIFT_PREFIX}${day}:${attemptId}`;
  if (has(ledger, id)) return { ledger, paid: 0, reason: 'duplicate' };
  const pay = shiftPay(correct);
  if (pay === 0) return { ledger, paid: 0, reason: 'failed' };
  if (shiftsOnDay(ledger, day) >= STUDY_PAY.shiftsPerDay) return { ledger, paid: 0, reason: 'full' };
  return { ledger: ledgerAdd(ledger, id, pay), paid: pay, reason: 'paid' };
}

export function weekOf(day: number): number {
  return Math.floor((day - 1) / STUDY_PAY.daysPerWeek);
}

/** Các tuần còn nợ tiền thuê của căn hộ, từ tuần đầu đến tuần của ngày học hiện tại. */
export function rentOwed(ledger: Ledger, city: string, day: number): number[] {
  const owed: number[] = [];
  for (let week = 0; week <= weekOf(day); week++) {
    if (!has(ledger, `${RENT_PREFIX}${city}:${week}`)) owed.push(week);
  }
  return owed;
}

/**
 * Trừ tiền thuê các tuần còn nợ, tuần cũ trước. Thiếu tiền thì dừng và để nợ,
 * không bao giờ đẩy số dư xuống âm.
 */
export function settleRent(ledger: Ledger, city: string, day: number): Ledger {
  let next = ledger;
  for (const week of rentOwed(ledger, city, day)) {
    if (balanceOf(next) < STUDY_PAY.rentPerWeek) break;
    next = ledgerAdd(next, `${RENT_PREFIX}${city}:${week}`, -STUDY_PAY.rentPerWeek);
  }
  return next;
}

export function owns(ledger: Ledger, itemId: string): boolean {
  return has(ledger, `${BUY_PREFIX}${itemId}`);
}

export function checkBuy(ledger: Ledger, city: string, day: number, item: DormDecoration): BuyCheck {
  if (owns(ledger, item.id)) return 'owned';
  if (rentOwed(ledger, city, day).length > 0) return 'rent-unpaid';
  if (balanceOf(ledger) < (item.price ?? 0)) return 'poor';
  return 'ok';
}

export function buy(ledger: Ledger, item: DormDecoration): Ledger {
  return ledgerAdd(ledger, `${BUY_PREFIX}${item.id}`, -(item.price ?? 0));
}

/** Món được đặt khi đã mở bằng nhiệm vụ và, nếu có giá, đã mua. */
export function canEquip(item: DormDecoration, completed: readonly string[], ledger: Ledger): boolean {
  if (item.unlockMission && !completed.includes(item.unlockMission)) return false;
  if (item.price && !owns(ledger, item.id)) return false;
  return true;
}
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npx tsx --test src/services/study-abroad/economy.test.ts src/data/study-abroad-jobs.test.ts src/data/study-abroad-pricing.test.ts`
Expected: PASS toàn bộ.

---

## Task 4: Đồng bộ sổ tiền riêng

**Files:**
- Modify: `src/services/study-abroad/sync.ts` (ghi đè toàn bộ)
- Modify: `src/services/study-abroad/sync.test.ts` (thêm test ở cuối)

**Interfaces:**
- Consumes: `canEquip` từ `./economy` (Task 3); `mergeLedgers`, `type Ledger` từ `@/services/travel/economy`.
- Produces: `StudyAbroadPayload` có thêm `ledger: Ledger`. `normalizeStudyAbroad(raw)` và `mergeStudyAbroad(local, remote)` luôn trả về `ledger`.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `src/services/study-abroad/sync.test.ts`:

```ts
test('sổ tiền riêng: hợp hai máy theo mã, không cộng đôi khoản chung', () => {
  const m = mergeStudyAbroad(
    { completed: ['arrival'], ledger: { 'pay:shift:1:a': 40 } },
    { completed: ['arrival'], ledger: { 'pay:shift:1:a': 40, 'pay:shift:1:b': 30 } },
  );
  assert.equal(m.ledger['pay:shift:1:a'], 40);
  assert.equal(m.ledger['pay:shift:1:b'], 30);
});

test('đồ có giá chỉ đặt được khi đã mua; dữ liệu cũ không có sổ vẫn đọc được', () => {
  const locked = normalizeStudyAbroad({ completed: ['arrival'], decorations: { corner: 'sg-orchid' } });
  assert.equal(locked.decorations.corner, 'corner-starter');

  const bought = normalizeStudyAbroad({ completed: ['arrival'], decorations: { corner: 'sg-orchid' }, ledger: { 'pay:buy:sg-orchid': -40 } });
  assert.equal(bought.decorations.corner, 'sg-orchid');

  const old = normalizeStudyAbroad({ completed: ['arrival'] });
  assert.deepEqual(old.ledger, {});
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx tsx --test src/services/study-abroad/sync.test.ts`
Expected: FAIL: `m.ledger` là `undefined` ở test đầu tiên.

- [ ] **Step 3: Ghi đè `sync.ts`**

Ghi đè `src/services/study-abroad/sync.ts` bằng nội dung sau:

```ts
import { DEFAULT_DORM_DECORATIONS, STUDY_ABROAD_DECORATIONS, type DormSlot } from '@/data/study-abroad-dorm';
import { mergeLedgers, type Ledger } from '@/services/travel/economy';
import { canEquip } from './economy';

/** Học kỳ du học: nhiệm vụ đã xong, đồ trang trí phòng, lần nghỉ gần nhất, sổ tiền riêng. */
export type StudyAbroadPayload = {
  completed: string[];
  decorations: Record<DormSlot, string>;
  restedAt: string | null;
  ledger: Ledger;
};

function normalizeLedger(raw: unknown): Ledger {
  if (!raw || typeof raw !== 'object') return {};
  const out: Ledger = {};
  for (const [id, amount] of Object.entries(raw)) {
    if (typeof amount === 'number' && Number.isFinite(amount)) out[id] = amount;
  }
  return out;
}

export function normalizeStudyAbroad(raw: unknown): StudyAbroadPayload {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<StudyAbroadPayload>;
  const completed = Array.isArray(r.completed) ? [...new Set(r.completed.filter((x): x is string => typeof x === 'string'))] : [];
  const ledger = normalizeLedger(r.ledger);
  const decorations = { ...DEFAULT_DORM_DECORATIONS };
  for (const slot of Object.keys(decorations) as DormSlot[]) {
    const id = r.decorations?.[slot];
    const item = STUDY_ABROAD_DECORATIONS.find((d) => d.id === id && d.slot === slot);
    if (item && canEquip(item, completed, ledger)) decorations[slot] = item.id;
  }
  return { completed, decorations, restedAt: typeof r.restedAt === 'string' ? r.restedAt : null, ledger };
}

/**
 * Gộp hai máy: nhiệm vụ đã xong là một chiều (hợp hai bên); sổ tiền hợp theo mã;
 * lần nghỉ lấy mốc mới hơn. Đồ trang trí: ô nào máy này đã đổi khỏi mặc định thì giữ
 * lựa chọn của máy này, còn lại nhận của máy kia, rồi bỏ món chưa được phép đặt.
 */
export function mergeStudyAbroad(local: unknown, remote: unknown | null): StudyAbroadPayload {
  const a = normalizeStudyAbroad(local);
  if (remote === null || remote === undefined) return a;
  const b = normalizeStudyAbroad(remote);
  const completed = [...new Set([...a.completed, ...b.completed])];
  const ledger = mergeLedgers(a.ledger, b.ledger);
  const decorations = { ...DEFAULT_DORM_DECORATIONS };
  for (const slot of Object.keys(decorations) as DormSlot[]) {
    const pick = a.decorations[slot] !== DEFAULT_DORM_DECORATIONS[slot] ? a.decorations[slot] : b.decorations[slot];
    const item = STUDY_ABROAD_DECORATIONS.find((d) => d.id === pick);
    if (item && canEquip(item, completed, ledger)) decorations[slot] = pick;
  }
  const restedAt = [a.restedAt, b.restedAt].filter((x): x is string => !!x).sort().at(-1) ?? null;
  return { completed, decorations, restedAt, ledger };
}
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npx tsx --test src/services/study-abroad/sync.test.ts`
Expected: PASS toàn bộ (test cũ và hai test mới).

---

## Task 5: Store và đồng bộ

**Files:**
- Modify: `src/store/useStudyAbroadStore.ts` (ghi đè toàn bộ)
- Modify: `src/services/sync/stores.ts` (quanh dòng 300–303, hàm `read` của `studyAbroadStore`)

**Interfaces:**
- Consumes: `SG_APARTMENT`, `buy`, `canEquip`, `checkBuy`, `currentStudyDay`, `recordShift`, `settleRent`, `type BuyCheck`, `type ShiftReason` từ `@/services/study-abroad/economy`; `type Ledger` từ `@/services/travel/economy`.
- Produces: store có thêm `ledger`, `buyDecoration(slot, itemId): BuyOutcome`, `workShift(attemptId, correct): { paid; reason }`. `type BuyOutcome = 'invalid' | 'locked' | BuyCheck`.

Không có test riêng cho store (store phụ thuộc persist và localStorage). Logic đã được test ở Task 3 và Task 4; phần này kiểm bằng typecheck và bằng trình duyệt ở Task 8.

- [ ] **Step 1: Ghi đè store**

Ghi đè `src/store/useStudyAbroadStore.ts` bằng nội dung sau:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_PREFIX, storage } from './persist';
import { DEFAULT_DORM_DECORATIONS, STUDY_ABROAD_DECORATIONS, type DormSlot } from '@/data/study-abroad-dorm';
import { SG_APARTMENT, buy, canEquip, checkBuy, currentStudyDay, recordShift, settleRent, type BuyCheck, type ShiftReason } from '@/services/study-abroad/economy';
import type { Ledger } from '@/services/travel/economy';

export type BuyOutcome = 'invalid' | 'locked' | BuyCheck;

type StudyAbroadState = {
  completed: string[];
  decorations: Record<DormSlot, string>;
  restedAt: string | null;
  ledger: Ledger;
  completeMission: (id: string) => void;
  setDecoration: (slot: DormSlot, itemId: string) => void;
  buyDecoration: (slot: DormSlot, itemId: string) => BuyOutcome;
  workShift: (attemptId: string, correct: number) => { paid: number; reason: ShiftReason };
  rest: () => void;
  reset: () => void;
};

/** Tiền thuê chỉ tính từ khi căn hộ Singapore mở (sau nhiệm vụ `arrival`). */
function withRent(ledger: Ledger, completed: readonly string[]): Ledger {
  if (!completed.includes(SG_APARTMENT.unlockMission)) return ledger;
  return settleRent(ledger, SG_APARTMENT.city, currentStudyDay(completed));
}

export const useStudyAbroadStore = create<StudyAbroadState>()(
  persist(
    (set, get) => ({
      completed: [],
      decorations: { ...DEFAULT_DORM_DECORATIONS },
      restedAt: null,
      ledger: {},
      completeMission: (id) => set((state) => {
        if (state.completed.includes(id)) return state;
        const completed = [...state.completed, id];
        return { completed, ledger: withRent(state.ledger, completed) };
      }),
      setDecoration: (slot, itemId) => set((state) => {
        const item = STUDY_ABROAD_DECORATIONS.find((decoration) => decoration.id === itemId && decoration.slot === slot);
        if (!item || !canEquip(item, state.completed, state.ledger)) return state;
        return { decorations: { ...state.decorations, [slot]: itemId } };
      }),
      buyDecoration: (slot, itemId) => {
        const state = get();
        const item = STUDY_ABROAD_DECORATIONS.find((decoration) => decoration.id === itemId && decoration.slot === slot);
        if (!item || !item.price) return 'invalid';
        if (item.unlockMission && !state.completed.includes(item.unlockMission)) return 'locked';
        const check = checkBuy(state.ledger, SG_APARTMENT.city, currentStudyDay(state.completed), item);
        if (check !== 'ok') return check;
        set({ ledger: buy(state.ledger, item), decorations: { ...state.decorations, [slot]: item.id } });
        return 'ok';
      },
      workShift: (attemptId, correct) => {
        const state = get();
        const outcome = recordShift(state.ledger, currentStudyDay(state.completed), attemptId, correct);
        set({ ledger: withRent(outcome.ledger, state.completed) });
        return { paid: outcome.paid, reason: outcome.reason };
      },
      rest: () => set({ restedAt: new Date().toISOString() }),
      reset: () => set({ completed: [], decorations: { ...DEFAULT_DORM_DECORATIONS }, restedAt: null, ledger: {} }),
    }),
    {
      name: `${STORAGE_PREFIX}study-abroad`,
      storage: storage<StudyAbroadState>(),
      // Giữ version 1: không có migrate, đổi version sẽ làm mất dữ liệu đã lưu.
      version: 1,
      partialize: (state) => ({ completed: state.completed, decorations: state.decorations, restedAt: state.restedAt, ledger: state.ledger }) as StudyAbroadState,
      merge: (persisted, current) => {
        const saved = persisted as Partial<StudyAbroadState>;
        return {
          ...current,
          ...saved,
          decorations: { ...DEFAULT_DORM_DECORATIONS, ...(saved.decorations ?? {}) },
          ledger: { ...(saved.ledger ?? {}) },
          completeMission: current.completeMission,
          setDecoration: current.setDecoration,
          buyDecoration: current.buyDecoration,
          workShift: current.workShift,
          rest: current.rest,
          reset: current.reset,
        };
      },
    },
  ),
);
```

- [ ] **Step 2: Đưa `ledger` vào đồng bộ**

Trong `src/services/sync/stores.ts`, tìm `studyAbroadStore` (khoảng dòng 300) và sửa hàm `read`:

Từ:
```ts
    return { completed: s.completed, decorations: s.decorations, restedAt: s.restedAt };
```
Thành:
```ts
    return { completed: s.completed, decorations: s.decorations, restedAt: s.restedAt, ledger: s.ledger };
```

- [ ] **Step 3: Kiểm typecheck các file liên quan**

Run: `npx tsc --noEmit 2>&1 | grep -E "study-abroad|useStudyAbroadStore|services/sync/stores"`
Expected: không có dòng lỗi nào. Repo có thể có lỗi từ các thay đổi chưa commit của bạn; chỉ cần không có lỗi trong các file trên. Nếu có lỗi trong file trên, sửa rồi chạy lại.

- [ ] **Step 4: Chạy lại toàn bộ test Du học**

Run: `npx tsx --test src/services/study-abroad/*.test.ts src/data/study-abroad*.test.ts`
Expected: PASS toàn bộ.

---

## Task 6: Màn việc làm thêm

**Files:**
- Create: `app/quest/study-abroad/work.tsx`

**Interfaces:**
- Consumes: `STUDY_JOBS`, `type ShiftQuestion` từ `@/data/study-abroad-jobs`; `STUDY_PAY`, `balanceOf`, `type ShiftReason` từ `@/services/study-abroad/economy`; `useStudyAbroadStore` (`completed`, `ledger`, `workShift`); `uid` từ `@/store/persist`; `TravelPage`, `GameButton`, `PixelPanel`, `T` từ components kit; `bi`, `useL`; `router` từ `expo-router`.
- Produces: route `/quest/study-abroad/work`.

- [ ] **Step 1: Tạo màn hình**

Tạo `app/quest/study-abroad/work.tsx` với nội dung sau:

```tsx
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { TravelPage } from '@/components/travel/ui/TravelPage';
import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import { STUDY_JOBS } from '@/data/study-abroad-jobs';
import { STUDY_PAY, balanceOf, type ShiftReason } from '@/services/study-abroad/economy';
import { bi, useL } from '@/i18n/useL';
import { uid } from '@/store/persist';
import { useStudyAbroadStore } from '@/store/useStudyAbroadStore';

type Phase = 'idle' | 'playing' | 'done';
type Result = { correct: number; paid: number; reason: ShiftReason };

export default function StudyAbroadWorkScreen() {
  const { L, locale } = useL();
  const completed = useStudyAbroadStore((state) => state.completed);
  const ledger = useStudyAbroadStore((state) => state.ledger);
  const workShift = useStudyAbroadStore((state) => state.workShift);
  // G1 chỉ có một việc. Khi thêm thành phố, màn này sẽ chọn việc theo thành phố đang ở.
  const job = STUDY_JOBS[0]!;
  const unlocked = completed.includes(job.unlockMission);
  const balance = balanceOf(ledger);

  const [phase, setPhase] = useState<Phase>('idle');
  const [attemptId, setAttemptId] = useState('');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  const start = () => {
    setAttemptId(uid());
    setAnswers([]);
    setIndex(0);
    setResult(null);
    setPhase('playing');
  };

  const choose = (option: number) => {
    const next = [...answers, option];
    if (next.length < job.questions.length) {
      setAnswers(next);
      setIndex(index + 1);
      return;
    }
    const correct = next.filter((picked, i) => picked === job.questions[i]!.answer).length;
    const outcome = workShift(attemptId, correct);
    setAnswers(next);
    setResult({ correct, paid: outcome.paid, reason: outcome.reason });
    setPhase('done');
  };

  const reasonText = (reason: ShiftReason) => {
    if (reason === 'paid') return L('Đã trả lương cho ca này.', 'Pay for this shift has been recorded.');
    if (reason === 'failed') return L(`Chưa đủ ${STUDY_PAY.passAt}/${job.questions.length} câu nên ca không được trả. Bạn có thể nhận ca khác.`, `Fewer than ${STUDY_PAY.passAt} of ${job.questions.length} correct, so no pay. You can take another shift.`);
    if (reason === 'full') return L('Hôm nay đã đủ 2 ca được trả. Sang ngày học mới để nhận thêm.', 'You have already been paid for 2 shifts today. Move on to the next study day for more.');
    return L('Ca này đã được ghi.', 'This shift has already been recorded.');
  };

  const question = job.questions[Math.min(index, job.questions.length - 1)]!;

  return (
    <TravelPage title={L('Việc làm thêm', 'Part-time work')} back="/quest/study-abroad/dorm" backLabel={L('Phòng ký túc xá', 'Dorm room')}>
      <PixelPanel tone="navy" inner={{ padding: 16, gap: 9 }}>
        <Text className="font-heavy" style={{ color: T.goldLight, fontSize: 21 }}>{bi(job.title, locale)}</Text>
        <Text className="font-sans" style={{ color: T.cream, fontSize: 13, lineHeight: 19 }}>
          {bi(job.place, locale)} · {L(`${job.questions.length} tình huống mỗi ca · đạt từ ${STUDY_PAY.passAt} câu · ${STUDY_PAY.payPerCorrect} đồng mỗi câu đúng`, `${job.questions.length} situations per shift · pass at ${STUDY_PAY.passAt} · ${STUDY_PAY.payPerCorrect} per correct answer`)}
        </Text>
        <Text className="font-semi" style={{ color: T.goldLight, fontSize: 14 }}>{L(`Số dư: ${balance} đồng du học`, `Balance: ${balance} study funds`)}</Text>
      </PixelPanel>

      {!unlocked ? (
        <PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 14, gap: 8 }}>
          <Text className="font-sans" style={{ color: T.muted, fontSize: 13, lineHeight: 19 }}>
            {L('Việc này mở khi bạn đến Singapore và làm xong nhiệm vụ nhập cảnh.', 'This job opens once you reach Singapore and finish the arrival mission.')}
          </Text>
        </PixelPanel>
      ) : phase === 'idle' ? (
        <View style={{ marginTop: 14 }}>
          <GameButton label={L('Nhận ca', 'Start shift')} tone="gold" onPress={start} />
        </View>
      ) : phase === 'playing' ? (
        <PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 14, gap: 10 }}>
          <Text className="font-semi" style={{ color: T.muted, fontSize: 12 }}>{L(`Tình huống ${index + 1}/${job.questions.length}`, `Situation ${index + 1}/${job.questions.length}`)}</Text>
          <Text className="font-heavy" style={{ color: T.ink, fontSize: 16, lineHeight: 22 }}>{`"${question.customer}"`}</Text>
          <View style={{ gap: 8 }}>
            {question.options.map((option, i) => (
              <Pressable key={`${question.id}-${i}`} accessibilityRole="button" onPress={() => choose(i)} style={{ padding: 11, borderRadius: 9, borderWidth: 1.5, borderColor: T.line, backgroundColor: '#FFFFFF' }}>
                <Text className="font-sans" style={{ color: T.ink, fontSize: 14, lineHeight: 20 }}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </PixelPanel>
      ) : result ? (
        <PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 14, gap: 9 }}>
          <Text className="font-heavy" style={{ color: T.ink, fontSize: 16 }}>{L(`Đúng ${result.correct}/${job.questions.length} tình huống`, `${result.correct}/${job.questions.length} correct`)}</Text>
          <Text className="font-semi" style={{ color: result.paid > 0 ? T.good : T.muted, fontSize: 14, lineHeight: 20 }}>
            {result.paid > 0 ? L(`+${result.paid} đồng du học. `, `+${result.paid} study funds. `) : ''}{reasonText(result.reason)}
          </Text>
          {job.questions.map((q, i) => {
            const picked = answers[i];
            const right = picked === q.answer;
            return (
              <Text key={q.id} className="font-sans" style={{ color: right ? T.good : T.bad, fontSize: 12, lineHeight: 18 }}>
                {`${right ? '✓' : '✗'} ${bi(q.explanation, locale)}`}
              </Text>
            );
          })}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <GameButton label={L('Nhận ca khác', 'Another shift')} tone="gold" onPress={start} />
            <GameButton label={L('Về phòng ký túc xá', 'Back to dorm')} tone="paper" onPress={() => router.push('/quest/study-abroad/dorm' as never)} />
          </View>
        </PixelPanel>
      ) : null}
      <View style={{ height: 24 }} />
    </TravelPage>
  );
}
```

- [ ] **Step 2: Kiểm typecheck file mới**

Run: `npx tsc --noEmit 2>&1 | grep "study-abroad/work"`
Expected: không có dòng lỗi nào.

---

## Task 7: Màn phòng ký túc xá: số dư, tiền thuê, mua đồ

**Files:**
- Modify: `app/quest/study-abroad/dorm.tsx`

**Interfaces:**
- Consumes: `balanceOf`, `currentStudyDay`, `owns`, `rentOwed`, `SG_APARTMENT` từ `@/services/study-abroad/economy`; `buyDecoration`, `ledger` từ store.
- Produces: nút mua khi đồ có giá chưa sở hữu; thông báo kết quả mua; lối vào màn `/quest/study-abroad/work`.

Các thay đổi dưới đây là thay thế đúng chỗ, không đổi phần còn lại của màn.

- [ ] **Step 1: Sửa import**

Ở dòng đầu, đổi:
```tsx
import React from 'react';
```
Thành:
```tsx
import React, { useState } from 'react';
```

Ngay dưới các import hiện có, thêm:
```tsx
import { SG_APARTMENT, balanceOf, currentStudyDay, owns, rentOwed } from '@/services/study-abroad/economy';
```

- [ ] **Step 2: Lấy sổ tiền và tình trạng tiền thuê trong component**

Trong `export default function StudyAbroadDormScreen()`, ngay sau dòng `const setDecoration = useStudyAbroadStore((state) => state.setDecoration);`, thêm:

```tsx
  const ledger = useStudyAbroadStore((state) => state.ledger);
  const buyDecoration = useStudyAbroadStore((state) => state.buyDecoration);
  const [notice, setNotice] = useState<string | null>(null);
  const day = currentStudyDay(completed);
  const balance = balanceOf(ledger);
  const rentUnpaid = rentOwed(ledger, SG_APARTMENT.city, day).length > 0;
  const buyFeedback = (outcome: ReturnType<typeof buyDecoration>, name: string) => {
    if (outcome === 'ok') return L(`Đã mua ${name}.`, `Bought ${name}.`);
    if (outcome === 'poor') return L('Chưa đủ đồng du học. Hãy đi làm thêm trước.', 'Not enough study funds yet. Work a shift first.');
    if (outcome === 'rent-unpaid') return L('Còn nợ tiền thuê. Làm thêm để đóng tiền thuê trước khi mua.', 'Rent is still unpaid. Work a shift to pay it before buying.');
    if (outcome === 'locked') return L('Món này chưa mở.', 'This item is still locked.');
    return '';
  };
```

- [ ] **Step 3: Hiện số dư và tình trạng tiền thuê**

Trong panel đầu trang, ngay sau dòng `<Text className="font-semi" style={{ color: T.goldLight, fontSize: 13 }}>{L(`${completed.length}/${missionCount} nhiệm vụ · ${xp} XP`, ...`}</Text>`, thêm:

```tsx
            <Text className="font-semi" style={{ color: T.goldLight, fontSize: 13 }}>
              {L(`Số dư: ${balance} đồng du học · Tiền thuê: ${rentUnpaid ? 'chưa đóng' : 'đã đóng'}`, `Balance: ${balance} study funds · Rent: ${rentUnpaid ? 'unpaid' : 'paid'}`)}
            </Text>
```

- [ ] **Step 4: Đổi hành vi bấm vào vật phẩm và truyền nhãn giá**

Trong vòng lặp `STUDY_ABROAD_DECORATIONS.filter((item) => item.slot === slot.id).map((item) => { ... })`, thay đoạn `return (<DecorationOption ... />)` bằng:

```tsx
                    const owned = owns(ledger, item.id);
                    const priceLabel = item.price && !owned && unlocked ? L(`Giá ${item.price} đồng du học`, `Price ${item.price} study funds`) : undefined;
                    return (
                      <DecorationOption
                        key={item.id}
                        item={item}
                        unlocked={unlocked}
                        selected={selected}
                        lockedHint={mission ? L(`Mở sau: ${bi(mission.place, locale)}`, `Unlock after: ${bi(mission.place, locale)}`) : L('Đồ cơ bản', 'Starter item')}
                        priceLabel={priceLabel}
                        onPress={() => {
                          if (!item.price || owned) {
                            setDecoration(slot.id, item.id);
                            setNotice(null);
                            return;
                          }
                          const outcome = buyDecoration(slot.id, item.id);
                          setNotice(buyFeedback(outcome, bi(item.name, locale)));
                        }}
                      />
                    );
```

- [ ] **Step 5: Cập nhật `DecorationOption` để hiện nhãn giá**

Thay toàn bộ hàm `DecorationOption` bằng:

```tsx
function DecorationOption({ item, unlocked, selected, lockedHint, priceLabel, onPress }: { item: DormDecoration; unlocked: boolean; selected: boolean; lockedHint: string; priceLabel?: string; onPress: () => void }) {
  const { locale } = useL();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: !unlocked }}
      disabled={!unlocked}
      onPress={onPress}
      style={{ flexGrow: 1, flexBasis: 132, minHeight: 82, padding: 9, borderRadius: 9, borderWidth: 1.5, borderColor: selected ? T.goldDark : T.line, backgroundColor: selected ? '#F7EDDA' : '#FFFFFF', opacity: unlocked ? 1 : 0.52 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <Text style={{ fontSize: 22 }}>{unlocked ? item.glyph : '🔒'}</Text>
        <Text numberOfLines={2} className="font-semi" style={{ flex: 1, color: T.ink, fontSize: 12 }}>{bi(item.name, locale)}</Text>
      </View>
      <Text numberOfLines={2} className="font-sans" style={{ marginTop: 4, color: selected ? T.goldDark : priceLabel ? T.goldDark : T.muted, fontSize: 11, lineHeight: 15 }}>
        {unlocked ? (selected ? (locale === 'vi' ? 'Đang đặt' : 'Placed') : priceLabel ?? bi(item.description, locale)) : lockedHint}
      </Text>
    </Pressable>
  );
}
```

- [ ] **Step 6: Hiện thông báo và lối vào màn việc làm**

Ngay trước khối `<PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 14, gap: 9 }}>` của phần "Nghỉ giữa hành trình", thêm:

```tsx
          {notice ? (
            <Text className="font-semi" style={{ marginTop: 10, color: T.goldDark, fontSize: 13, lineHeight: 19 }}>{notice}</Text>
          ) : null}
```

Trong hàng nút cuối của panel "Nghỉ giữa hành trình", thêm nút vào `<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>` (ngay sau nút "Hồ sơ & trang phục"):

```tsx
              <GameButton label={L('Việc làm thêm', 'Part-time work')} tone="gold" onPress={() => router.push('/quest/study-abroad/work' as never)} />
```

- [ ] **Step 7: Kiểm typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "study-abroad|useStudyAbroadStore"`
Expected: không có dòng lỗi nào.

---

## Task 8: Kiểm chứng

**Files:** không sửa file.

- [ ] **Step 1: Chạy toàn bộ test Du học**

Run: `npx tsx --test src/services/study-abroad/*.test.ts src/data/study-abroad*.test.ts`
Expected: PASS toàn bộ.

- [ ] **Step 2: Kiểm typecheck toàn repo, lọc theo file Du học**

Run: `npx tsc --noEmit 2>&1 | grep -E "study-abroad|useStudyAbroadStore|services/sync/stores|travel/economy"`
Expected: không có lỗi mới trong các file trên. Lỗi có sẵn ở file khác không thuộc kế hoạch này.

- [ ] **Step 3: Kiểm trên trình duyệt**

Mở app bằng cấu hình dev server có sẵn trong dự án (kiểm `package.json` và `.claude/launch.json` trước khi thêm cấu hình mới). Đi qua các bước sau và ghi nhận từng bước:

1. Làm nhiệm vụ `arrival` (Changi). Kiểm: màn `/quest/study-abroad/work` mở được, hiện nút "Nhận ca".
2. Làm xong bốn tình huống. Kiểm: số dư tăng đúng theo số câu đúng (10 đồng mỗi câu, chỉ khi đạt 3/4).
3. Kiểm tiền thuê: sau khi đủ 30 đồng, tiền thuê tuần 1 tự chuyển sang "đã đóng".
4. Ở `/quest/study-abroad/dorm`: thử mua "Chậu lan Singapore" khi còn nợ tiền thuê. Kiểm: thông báo "Còn nợ tiền thuê" và món không được đặt.
5. Khi đủ tiền và đã đóng thuê, mua lại. Kiểm: số dư giảm 40, món được đặt, và tải lại trang vẫn còn.
6. Chụp màn `/quest/study-abroad/dorm` và `/quest/study-abroad/work` ở chiều rộng điện thoại (ví dụ 375 px). Kiểm: không tràn ngang, chữ đọc được.

- [ ] **Step 4: Báo kết quả**

Báo đúng những gì đã chạy và kết quả, kể cả bước nào không chạy được. Không tuyên bố hoàn thành nếu chưa có kết quả test và kết quả kiểm trình duyệt.
