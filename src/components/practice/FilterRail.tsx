import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { color } from '@/theme/tokens';

/**
 * Thanh lọc phân cấp bên trái trang Luyện tập.
 *
 * BA TẦNG, thu gọn dần: KỸ NĂNG → kiểu bài → khổ bài. Chỉ kỹ năng đang chọn mới
 * mở ra các tầng dưới; bốn kỹ năng mở hết cùng lúc là một cột dài ba chục dòng
 * mà chín phần mười không liên quan tới việc đang làm.
 *
 * KỸ NĂNG CHƯA CÓ NỘI DUNG được hiện MỜ kèm chữ "Sắp có", không giấu đi. Giấu
 * thì người dùng không biết app định làm tới đâu; bày ra như thật rồi bấm vào
 * trống trơn thì tệ hơn nhiều.
 */

export type RailOption = {
  key: string;
  label: string;
  /** Tầng thứ ba — hiện thụt vào, chỉ mở khi tầng hai đang chọn. */
  children?: Array<{ key: string; label: string }>;
};

export type RailSkill = {
  key: string;
  label: string;
  icon: IconName;
  tint: string;
  options: RailOption[];
  /** Chưa có nội dung — hiện mờ, không bấm được. */
  comingSoon?: boolean;
  /** Bấm vào là đi sang trang khác thay vì lọc tại chỗ. */
  href?: string;
};

export type RailSelection = { skill: string; option: string | null; child: string | null };

export function FilterRail({
  skills,
  selection,
  onSelect,
  onNavigate,
  groups,
}: {
  skills: RailSkill[];
  selection: RailSelection;
  onSelect: (next: RailSelection) => void;
  onNavigate: (href: string) => void;
  /** Các nhóm lọc phụ dạng đánh dấu nhiều lựa chọn. */
  groups?: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      {skills.map((skill) => {
        const active = selection.skill === skill.key;
        const disabled = !!skill.comingSoon;

        return (
          <View
            key={skill.key}
            className="overflow-hidden rounded-card border"
            style={{
              borderColor: active ? skill.tint : color.border,
              backgroundColor: color.surface,
              opacity: disabled ? 0.55 : 1,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled }}
              disabled={disabled}
              onPress={() => {
                if (skill.href) {
                  onNavigate(skill.href);
                  return;
                }
                onSelect({ skill: skill.key, option: skill.options[0]?.key ?? null, child: null });
              }}
              className="flex-row items-center gap-2.5 px-3 py-2.5"
              style={{ backgroundColor: active ? `${skill.tint}14` : color.surfaceAlt }}
            >
              <Icon name={skill.icon} size={17} color={disabled ? color.subtle : skill.tint} />
              <Text
                className="flex-1 font-strong text-body"
                style={{ color: disabled ? color.subtle : color.ink }}
              >
                {skill.label}
              </Text>
              {disabled ? (
                <Text className="font-mid text-label text-subtle">Sắp có</Text>
              ) : skill.href ? (
                <Icon name="chevron-right" size={15} color={color.subtle} />
              ) : null}
            </Pressable>

            {active && !disabled && skill.options.length > 0 ? (
              <View className="px-3 py-2">
                {skill.options.map((option) => {
                  const optionActive = selection.option === option.key;
                  return (
                    <View key={option.key}>
                      <Radio
                        label={option.label}
                        selected={optionActive}
                        tint={skill.tint}
                        onPress={() =>
                          onSelect({ skill: skill.key, option: option.key, child: null })
                        }
                      />

                      {/* Tầng ba chỉ mở dưới đúng lựa chọn đang chọn. */}
                      {optionActive && option.children?.length ? (
                        <View
                          className="ml-3 mt-0.5 border-l pl-3"
                          style={{ borderColor: color.border }}
                        >
                          {option.children.map((child) => (
                            <Radio
                              key={child.key}
                              label={child.label}
                              selected={selection.child === child.key}
                              tint={skill.tint}
                              small
                              onPress={() =>
                                onSelect({
                                  skill: skill.key,
                                  option: option.key,
                                  // Bấm lại đúng mục đang chọn thì bỏ chọn — nếu
                                  // không thì không có cách nào quay về "tất cả".
                                  child: selection.child === child.key ? null : child.key,
                                })
                              }
                            />
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}

      {groups}
    </View>
  );
}

function Radio({
  label,
  selected,
  tint,
  small = false,
  onPress,
}: {
  label: string;
  selected: boolean;
  tint: string;
  small?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="flex-row items-center gap-2.5 py-1.5"
    >
      <View
        className="items-center justify-center rounded-pill border"
        style={{
          width: small ? 15 : 17,
          height: small ? 15 : 17,
          borderColor: selected ? tint : color.borderStrong,
          borderWidth: selected ? 5 : 1.5,
        }}
      />
      <Text
        className={selected ? 'font-strong text-body' : 'font-sans text-body'}
        style={{ color: selected ? color.ink : color.body }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Nhóm lọc nhiều lựa chọn — Nguồn tài liệu, Loại câu hỏi, Trình độ. */
export function CheckGroup({
  title,
  note,
  options,
  selected,
  onToggle,
}: {
  title: string;
  /** Một dòng giải thích nhóm lọc này làm gì, khi tên nhóm chưa đủ rõ. */
  note?: string;
  options: Array<{ key: string; label: string; count?: number }>;
  selected: string[];
  onToggle: (key: string) => void;
}) {
  const [open, setOpen] = React.useState(true);

  return (
    <View className="rounded-card border border-border bg-surface">
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between px-3 py-2.5"
      >
        <Text className="font-strong text-body text-ink">{title}</Text>
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={15} color={color.subtle} />
      </Pressable>

      {open ? (
        <View className="px-3 pb-2.5">
          {note ? (
            <Text className="mb-1.5 font-sans text-label text-subtle">{note}</Text>
          ) : null}
          {options.map((option) => {
            const on = selected.includes(option.key);
            return (
              <Pressable
                key={option.key}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                onPress={() => onToggle(option.key)}
                className="flex-row items-center gap-2.5 py-1.5"
              >
                <View
                  className="h-[17px] w-[17px] items-center justify-center rounded-[5px] border"
                  style={{
                    borderColor: on ? color.primary : color.borderStrong,
                    backgroundColor: on ? color.primary : 'transparent',
                    borderWidth: 1.5,
                  }}
                >
                  {on ? <Icon name="check" size={11} color={color.white} strokeWidth={3} /> : null}
                </View>
                <Text className="flex-1 font-sans text-body text-body">{option.label}</Text>
                {option.count !== undefined ? (
                  <Text className="font-mid text-label text-subtle">{option.count}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
