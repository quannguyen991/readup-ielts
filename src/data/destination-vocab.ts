import b1 from './seed/destination/b1.json';
import b2 from './seed/destination/b2.json';
import type { VocabTopic } from './vocab-topics';

export type DestinationCourse = 'b1' | 'b2';
export type DestinationDeck = VocabTopic & { course: DestinationCourse; unit: number };

export const DESTINATION_B1_DECKS = b1 as unknown as DestinationDeck[];
export const DESTINATION_B2_DECKS = b2 as unknown as DestinationDeck[];
export const DESTINATION_DECKS = [...DESTINATION_B1_DECKS, ...DESTINATION_B2_DECKS];

export const DESTINATION_TOTALS = {
  b1: DESTINATION_B1_DECKS.reduce((sum, deck) => sum + deck.words.length, 0),
  b2: DESTINATION_B2_DECKS.reduce((sum, deck) => sum + deck.words.length, 0),
};
