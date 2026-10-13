import type { Bi } from '@/i18n/useL';

/** Một đơn khách: khách nói một câu, gọi một món; sau khi đưa đồ, người bán đáp một câu. */
export type ShopOrder = {
  id: string;
  npc: Bi;
  line: string;
  drinkId: string;
  replyOptions: readonly string[];
  replyAnswer: number;
  hint: Bi;
  explanation: Bi;
};

export const SHOP_ORDERS: readonly ShopOrder[] = [
  {
    id: 'sg-order-coffee',
    npc: { vi: 'Aisha', en: 'Aisha' },
    line: 'Hi, one iced milk coffee, please.',
    drinkId: 'ca-phe-sua-da',
    replyOptions: ['Here you go. Enjoy your coffee!', 'I am going to the station.', 'The coffee is in the sea.', 'Ten dollars, no thanks.'],
    replyAnswer: 0,
    hint: { vi: 'Đưa đồ uống và chúc khách ngon miệng.', en: 'Hand over the drink and wish the customer well.' },
    explanation: { vi: '“Here you go” là lúc đưa đồ; “Enjoy your coffee” là lời chúc tự nhiên.', en: '“Here you go” hands the drink over; “Enjoy your coffee” is a natural wish.' },
  },
  {
    id: 'sg-order-tea',
    npc: { vi: 'Mei', en: 'Mei' },
    line: 'Could I get a cup of iced tea, please?',
    drinkId: 'tra-da',
    replyOptions: ['Sure, that is two dollars, please.', 'I went to the bowl yesterday.', 'Tea is a very long train.', 'Please wait for the bus.'],
    replyAnswer: 0,
    hint: { vi: 'Đồng ý nhận đơn, rồi báo giá.', en: 'Agree to the order, then state the price.' },
    explanation: { vi: '“Sure” nhận đơn; “that is two dollars” báo giá.', en: '“Sure” accepts the order; “that is two dollars” states the price.' },
  },
  {
    id: 'sg-order-bubble',
    npc: { vi: 'Luca', en: 'Luca' },
    line: 'I would like a bubble milk tea, please.',
    drinkId: 'tra-sua-tran-chau',
    replyOptions: ['Here you go. Would you like some ice?', 'The milk tea is in the station.', 'I do not like tea yesterday.', 'Pearls are a train.'],
    replyAnswer: 0,
    hint: { vi: 'Đưa đồ uống, rồi hỏi khách có cần thêm đá không.', en: 'Hand over the drink, then ask whether the customer wants ice.' },
    explanation: { vi: '“Here you go” đưa đồ; “Would you like some ice?” là câu hỏi lịch sự thêm.', en: '“Here you go” hands it over; “Would you like some ice?” is a polite follow-up.' },
  },
];
