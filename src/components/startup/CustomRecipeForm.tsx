import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { GameButton, PixelPanel, T } from '@/components/travel/ui/kit';
import { CUSTOM_NAMES, INGREDIENTS } from '@/data/startup-menu';
import { bi, useL } from '@/i18n/useL';
import { CUSTOM_RULES } from '@/services/startup/recipes';
import type { CustomOutcome } from '@/store/useStartupStore';
import { Chip } from './Chip';

export function CustomRecipeForm({ onCreate }: { onCreate: (nameIndex: number, ingredients: readonly string[]) => CustomOutcome }) {
  const { L, locale } = useL();
  const [nameIndex, setNameIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const toggle = (id: string) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < CUSTOM_RULES.maxIngredients ? [...prev, id] : prev));

  const press = () => {
    const outcome = onCreate(nameIndex, picked);
    if (outcome.ok) {
      setNotice(L('Đã thêm món mới vào thực đơn.', 'New drink added to the menu.'));
      setPicked([]);
      return;
    }
    const texts: Record<string, [string, string]> = {
      'bad-name': ['Chọn tên món trong danh sách.', 'Pick a name from the list.'],
      limit: ['Giai đoạn này mỗi quán chỉ có một món riêng.', 'At this stage each shop has one own recipe.'],
      empty: ['Chọn ít nhất một nguyên liệu.', 'Pick at least one ingredient.'],
      'too-many': [`Tối đa ${CUSTOM_RULES.maxIngredients} nguyên liệu.`, `At most ${CUSTOM_RULES.maxIngredients} ingredients.`],
      'repeat-ingredient': ['Mỗi nguyên liệu chỉ chọn một lần.', 'Each ingredient only once.'],
      'unknown-ingredient': ['Có nguyên liệu không có trong kho.', 'An ingredient is not in stock.'],
      'no-base': ['Cần ít nhất một nguyên liệu nền (cà phê hoặc trà).', 'Add at least one base (coffee or tea).'],
      'same-as-menu': ['Món này đã có trong thực đơn.', 'This drink is already on the menu.'],
    };
    const [vi, en] = texts[outcome.reason] ?? ['Không tạo được món.', 'Could not create the drink.'];
    setNotice(L(vi, en));
  };

  return (
    <PixelPanel tone="paper" style={{ marginTop: 14 }} inner={{ padding: 14, gap: 10 }}>
      <Text className="font-heavy" style={{ color: T.ink, fontSize: 16 }}>{L('Tạo món riêng', 'Create your own drink')}</Text>
      <Text className="font-sans" style={{ color: T.muted, fontSize: 13, lineHeight: 19 }}>
        {L(`Tối đa ${CUSTOM_RULES.maxIngredients} nguyên liệu, phải có một nguyên liệu nền. Giá bán = giá vốn + ${CUSTOM_RULES.markup}.`, `Up to ${CUSTOM_RULES.maxIngredients} ingredients, at least one base. Price = cost + ${CUSTOM_RULES.markup}.`)}
      </Text>
      <Text className="font-semi" style={{ color: T.ink, fontSize: 13 }}>{L('Tên món', 'Drink name')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CUSTOM_NAMES.map((name, i) => (
          <Chip key={`cname-${i}`} label={bi(name, locale)} selected={nameIndex === i} onPress={() => setNameIndex(i)} />
        ))}
      </View>
      <Text className="font-semi" style={{ color: T.ink, fontSize: 13 }}>{L('Nguyên liệu', 'Ingredients')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {INGREDIENTS.map((item) => (
          <Chip key={item.id} label={bi(item.name, locale)} selected={picked.includes(item.id)} onPress={() => toggle(item.id)} />
        ))}
      </View>
      <GameButton label={L('Tạo món', 'Create drink')} tone="gold" onPress={press} disabled={picked.length === 0} />
      {notice ? <Text className="font-semi" style={{ color: T.goldDark, fontSize: 13, lineHeight: 19 }}>{notice}</Text> : null}
    </PixelPanel>
  );
}
