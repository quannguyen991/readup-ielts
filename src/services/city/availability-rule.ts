/** Luật thuần của `useCityAvailable()` — tách riêng để test chạy được trên Node. */
export const CITY_MIN_WIDTH = 1024;

export type CityEnv = { os: string; pointerFine: boolean; width: number };

export function cityAvailableFor(env: CityEnv): boolean {
  return env.os === 'web' && env.pointerFine && env.width >= CITY_MIN_WIDTH;
}
