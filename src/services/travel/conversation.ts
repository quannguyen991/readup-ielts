import type { CityId, Npc } from './types';

export type TravelNpcPersona = 'staff' | 'local' | 'traveller' | 'vendor' | 'student' | 'elder' | 'guide';

export type TravelConversationContext = {
  cityId: CityId;
  poiId?: string;
  npcId: string;
  persona: TravelNpcPersona;
  displayName: { vi: string; en: string };
};

export type TravelConversationTurn = { role: 'user' | 'assistant'; content: string };

export function conversationContextForNpc(input: {
  cityId: CityId;
  npc: Pick<Npc, 'id' | 'sprite' | 'chatName' | 'chatPersona'>;
  poiId?: string;
}): TravelConversationContext {
  const persona = input.npc.chatPersona ?? personaForSprite(input.npc.sprite);
  const cityAliases: Partial<Record<CityId, { vi: string; en: string }>> = {
    singapore: { vi: 'Người Singapore', en: 'Singaporean local' },
    london: { vi: 'Người London', en: 'London local' },
    paris: { vi: 'Người Paris', en: 'Paris local' },
    amsterdam: { vi: 'Người Amsterdam', en: 'Amsterdam local' },
    rome: { vi: 'Người Rome', en: 'Rome local' },
    hanoi: { vi: 'Người Hà Nội', en: 'Hanoi local' },
    hochiminh: { vi: 'Người TP. Hồ Chí Minh', en: 'Ho Chi Minh City local' },
    danang: { vi: 'Người Đà Nẵng', en: 'Da Nang local' },
    tokyo: { vi: 'Người Tokyo', en: 'Tokyo local' },
    seoul: { vi: 'Người Seoul', en: 'Seoul local' },
    newyork: { vi: 'Người New York', en: 'New Yorker' },
    istanbul: { vi: 'Người Istanbul', en: 'Istanbul local' },
    cairo: { vi: 'Người Cairo', en: 'Cairo local' },
    sydney: { vi: 'Người Sydney', en: 'Sydney local' },
    mexicocity: { vi: 'Người Mexico City', en: 'Mexico City local' },
    rio: { vi: 'Người Rio', en: 'Rio local' },
    capetown: { vi: 'Người Cape Town', en: 'Cape Town local' },
    marrakech: { vi: 'Người Marrakech', en: 'Marrakech local' },
  };
  const defaultName: Record<TravelNpcPersona, { vi: string; en: string }> = {
    staff: { vi: 'Nhân viên', en: 'Staff member' },
    local: cityAliases[input.cityId] ?? { vi: 'Người địa phương', en: 'Local resident' },
    traveller: { vi: 'Du khách quốc tế', en: 'Fellow traveller' },
    vendor: { vi: 'Người bán hàng', en: 'Local shopkeeper' },
    student: { vi: 'Sinh viên địa phương', en: 'Local student' },
    elder: { vi: 'Người dân địa phương', en: 'Local resident' },
    guide: { vi: 'Hướng dẫn viên', en: 'Local guide' },
  };
  return {
    cityId: input.cityId,
    ...(input.poiId ? { poiId: input.poiId } : {}),
    npcId: input.npc.id,
    persona,
    displayName: input.npc.chatName ?? defaultName[persona],
  };
}

function personaForSprite(sprite: string): TravelNpcPersona {
  if (sprite === 'npc_staff' || sprite === 'npc_guard') return 'staff';
  if (sprite === 'npc_vendor') return 'vendor';
  if (sprite === 'npc_tourist') return 'traveller';
  if (sprite === 'npc_kid') return 'student';
  if (sprite === 'npc_elder') return 'elder';
  return 'local';
}
