import type { QuestMap, QuestMapId, QuestNode } from './types';

function nodes(mapId: QuestMapId, titles: string[], bossTitle: string): QuestNode[] {
  return titles.map((title, index) => {
    const kind = index === titles.length - 1 ? 'boss' : index === titles.length - 2 ? 'treasure' : index % 3 === 2 ? 'elite' : 'battle';
    return {
      id: `${mapId}-node-${index + 1}`,
      mapId,
      index: index + 1,
      kind,
      title: kind === 'boss' ? bossTitle : title,
      subtitle: kind === 'boss' ? 'Trận quyết định' : kind === 'treasure' ? 'Kho báu' : kind === 'elite' ? 'Địch tinh nhuệ' : 'Đụng độ',
      questions: kind === 'boss' ? 10 : kind === 'elite' ? 9 : 8,
      difficulty: kind === 'elite' || kind === 'boss' ? 'hard' : 'standard',
      ...(index > 0 ? { prerequisite: `${mapId}-node-${index}` } : {}),
    };
  });
}

export const QUEST_MAPS: QuestMap[] = [
  {
    id: 'iron-frontier',
    title: 'Iron Frontier',
    eyebrow: 'KHU VỰC 01 · THIẾT GIÁP',
    description: 'Vượt qua sa mạc thép bằng mỗi đáp án đúng.',
    accent: '#F59E0B',
    deep: '#172554',
    player: 'Xe tăng ReadUp',
    boss: 'The Examiner Tank',
    nodes: nodes('iron-frontier', ['Cổng bụi đỏ', 'Đường ray bỏ hoang', 'Drone canh gác', 'Kho đạn cuối'], 'The Examiner Tank'),
  },
  {
    id: 'fjord-runes',
    title: 'Fjord of Runes',
    eyebrow: 'KHU VỰC 02 · BĂNG RUNE',
    description: 'Gọi sấm rune, phá tan lớp băng của Frost Jarl.',
    accent: '#67E8F9',
    deep: '#172554',
    player: 'Chiến binh Viking',
    boss: 'Frost Jarl',
    nodes: nodes('fjord-runes', ['Bến thuyền băng', 'Rừng sói trắng', 'Tảng đá rune', 'Làng phía bắc'], 'Frost Jarl'),
  },
  {
    id: 'infinite-dungeon',
    title: 'Infinite Dungeon',
    eyebrow: 'KHU VỰC 03 · HẦM NGỤC',
    description: 'Mỗi câu hỏi mở thêm một bậc thang trong mê cung.',
    accent: '#C4B5FD',
    deep: '#1E1B4B',
    player: 'Pháp sư ReadUp',
    boss: 'The Final Question',
    nodes: nodes('infinite-dungeon', ['Cửa đá xanh', 'Phòng dơi', 'Cầu thang vô tận', 'Kho báu bị nguyền'], 'The Final Question'),
  },
];

export function getQuestMap(id: string | undefined): QuestMap {
  return QUEST_MAPS.find((map) => map.id === id) ?? QUEST_MAPS[0]!;
}

export function getQuestNode(nodeId: string | undefined): QuestNode | undefined {
  return QUEST_MAPS.flatMap((map) => map.nodes).find((node) => node.id === nodeId);
}
