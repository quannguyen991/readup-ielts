import task2Data from './task2.json';
import { adaptTidTask2Records, type TidTask2Record } from './adapter';
import task1Data from './task1.json';
import { adaptTidTask1Records, tidTask1Prompts, type TidTask1Record } from './task1-adapter';

const task2Records = (task2Data as { records: TidTask2Record[] }).records;
const task1Records = (task1Data as { records: TidTask1Record[] }).records;

/** Licensed bilingual samples collected from the user's authenticated TID account. */
export const TID_TASK2_SAMPLES = adaptTidTask2Records(task2Records);
export const TID_TASK1_SAMPLES = adaptTidTask1Records(task1Records);
export const TID_TASK1_PROMPTS = tidTask1Prompts(task1Records);

