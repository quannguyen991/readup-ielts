import type { BlueprintId, Plots } from './blueprints';

/**
 * Bản đồ thành phố: lưới 5×5 khu đất, ô giữa là QUẢNG TRƯỜNG TRUNG TÂM (không
 * xây). Tám khu quanh quảng trường là VÒNG TRONG — chỗ của tòa cao, để đường
 * chân trời cao ở giữa và thấp dần ra ngoài.
 *
 * Toạ độ tính theo đơn vị cảnh 3D: khu đất `LOT`, đường `ROAD`.
 */
export const GRID = 5;
export const LOT = 16;
export const ROAD = 6;
export const PITCH = LOT + ROAD;
const CENTER = (GRID - 1) / 2;

export type Lot = { id: string; row: number; col: number; x: number; z: number; inner: boolean };

export const PLAZA_ID = `${CENTER}-${CENTER}`;

export const LOTS: readonly Lot[] = (() => {
  const out: Lot[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const id = `${row}-${col}`;
      if (id === PLAZA_ID) continue;
      out.push({
        id,
        row,
        col,
        x: (col - CENTER) * PITCH,
        z: (row - CENTER) * PITCH,
        inner: Math.max(Math.abs(row - CENTER), Math.abs(col - CENTER)) === 1,
      });
    }
  }
  return out;
})();

export function lotById(id: string): Lot | undefined {
  return LOTS.find((l) => l.id === id);
}

export function isInnerLot(id: string): boolean {
  return lotById(id)?.inner ?? false;
}

/** Nửa bề rộng cả thành phố (tới mép đường ngoài cùng). */
export const CITY_HALF = (GRID * PITCH) / 2 + ROAD;

/**
 * THÀNH PHỐ MẪU — xây sẵn đủ 24 khu để người học thấy đích đến. Cao ở giữa
 * (tháp + tòa chọc trời vòng trong), thấp dần ra ngoài (nhà phố, nhà 2 tầng,
 * công viên ở góc).
 */
const SAMPLE_TYPES: Record<string, BlueprintId> = {
  // vòng trong
  '1-2': 'landmark',
  '1-1': 'skyscraper',
  '1-3': 'skyscraper',
  '3-1': 'skyscraper',
  '3-3': 'highrise',
  '2-1': 'highrise',
  '2-3': 'skyscraper',
  '3-2': 'highrise',
  // vòng ngoài
  '0-0': 'park',
  '0-1': 'townhouse',
  '0-2': 'highrise',
  '0-3': 'townhouse',
  '0-4': 'house2',
  '1-0': 'townhouse',
  '1-4': 'highrise',
  '2-0': 'house2',
  '2-4': 'townhouse',
  '3-0': 'highrise',
  '3-4': 'house2',
  '4-0': 'house2',
  '4-1': 'townhouse',
  '4-2': 'park',
  '4-3': 'house2',
  '4-4': 'park',
};

export const SAMPLE_CITY: Plots = Object.fromEntries(
  Object.entries(SAMPLE_TYPES).map(([id, type]) => [id, { type, builtAt: '2026-09-29T00:00:00.000Z' }]),
);
