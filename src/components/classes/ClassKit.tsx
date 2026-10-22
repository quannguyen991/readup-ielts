import React, { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { HEADER_ART_MIN } from '@/components/three/hero-star-policy';
import { Motion } from '@/components/illust/CuteMore';
import { Sticker } from '@/components/illust/Sticker';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useL } from '@/i18n/useL';
import type { AssignmentState } from '@/services/classes/assignments';

/**
 * Bộ mảnh giao diện của Lớp học — cùng ngôn ngữ với "phiếu lộ trình" (`app/plan.tsx`):
 * tờ giấy kem kẻ chỉ vàng, mục đánh số ở lề, cuống vé xanh đậm. Không khối màu
 * phẳng to, không hàng chip tròn.
 */
export const P = {
  navy: '#0F1D33',
  gold: '#6A4BD9',
  goldDeep: '#6A4BD9',
  goldLight: '#E2C88F',
  paper: '#F3F0FB',
  line: '#E8DCC0',
  muted: '#6B6250',
  canvas: '#F3F0FB',
  green: '#1F7A4D',
  greenSoft: '#E6F2EA',
  amber: '#6A4BD9',
  amberSoft: '#F3F0FB',
  red: '#B4432F',
  redSoft: '#F8E5DF',
};

export const SHEET_SHADOW = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 12px 30px rgba(94,72,35,0.10)' } as object;

/** Đầu trang: dòng nhỏ chữ vàng, tiêu đề to, câu phụ; hình trang trí chỉ ở màn rộng. */
export function PageHead({ kicker, title, subtitle, art }: { kicker: string; title: string; subtitle?: string; art?: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 2.4, color: P.goldDeep }}>
          {kicker}
        </Text>
        <Text className="font-heavy" style={{ marginTop: 2, fontSize: wide ? 36 : 27, lineHeight: wide ? 42 : 33, color: P.navy }}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="font-sans" style={{ marginTop: 4, fontSize: 15, lineHeight: 22, color: P.muted, maxWidth: 680 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {art && width >= HEADER_ART_MIN ? (
        <View aria-hidden>
          <Motion kind="float">
            <Sticker tilt={8}>{art}</Sticker>
          </Motion>
        </View>
      ) : null}
    </View>
  );
}

/** Tờ giấy kem có viền chỉ vàng. */
export function Sheet({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ borderRadius: 22, backgroundColor: P.paper, borderWidth: 1, borderColor: P.line, paddingHorizontal: 20, paddingVertical: 4 }, SHEET_SHADOW, style ?? {}]}>
      {children}
    </View>
  );
}

/** Một mục của tờ phiếu: số ở lề, tiêu đề, nội dung; ngăn bằng chỉ vàng. */
export function Section({ n, title, hint, right, first, children }: { n?: string; title: string; hint?: string; right?: React.ReactNode; first?: boolean; children?: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const wide = width >= 700;
  return (
    <View style={{ flexDirection: wide && n ? 'row' : 'column', gap: wide ? 18 : 4, paddingVertical: 18, borderTopWidth: first ? 0 : 1, borderColor: P.line }}>
      {n ? (
        <Text className="font-heavy" style={{ width: wide ? 36 : undefined, fontSize: wide ? 20 : 12, lineHeight: wide ? 26 : 16, letterSpacing: wide ? 0 : 1.6, color: P.gold }}>
          {n}
        </Text>
      ) : null}
      <View style={{ flex: wide && n ? 1 : undefined, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <View style={{ flexShrink: 1, minWidth: 0 }}>
            <Text className="font-heavy" style={{ fontSize: 18, lineHeight: 24, color: P.navy }}>
              {title}
            </Text>
            {hint ? (
              <Text className="font-sans" style={{ fontSize: 13, lineHeight: 19, color: P.muted }}>
                {hint}
              </Text>
            ) : null}
          </View>
          {right}
        </View>
        {children ? <View style={{ marginTop: 12 }}>{children}</View> : null}
      </View>
    </View>
  );
}

/** Ô nhập trên giấy kem. */
export function Field({ value, onChange, placeholder, label, maxLength, onSubmit, big }: { value: string; onChange: (v: string) => void; placeholder?: string; label: string; maxLength?: number; onSubmit?: () => void; big?: boolean }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#B7AC95"
      maxLength={maxLength}
      aria-label={label}
      onSubmitEditing={onSubmit}
      autoCapitalize={big ? 'characters' : 'sentences'}
      autoCorrect={!big}
      className={big ? 'font-heavy' : 'font-sans'}
      style={{
        height: big ? 60 : 46,
        borderWidth: 1,
        borderColor: P.line,
        borderRadius: 12,
        paddingHorizontal: 14,
        fontSize: big ? 28 : 15,
        letterSpacing: big ? 6 : 0,
        color: P.navy,
        backgroundColor: '#FFFFFF',
        width: '100%',
      }}
    />
  );
}

/** Ô chọn ngày (web: input date của trình duyệt). */
export function DateField({ value, min, onChange, label }: { value: string; min?: string; onChange: (iso: string) => void; label: string }) {
  const style = { height: 44, borderWidth: 1, borderColor: P.line, borderRadius: 10, paddingLeft: 12, paddingRight: 12, fontSize: 15, color: P.navy, backgroundColor: '#FFFFFF', width: '100%' as const, maxWidth: 240 };
  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: 'date',
      value,
      min,
      'aria-label': label,
      onChange: (e: { target: { value: string } }) => onChange(e.target.value),
      style: { ...style, fontFamily: 'inherit', borderStyle: 'solid', boxSizing: 'border-box' },
    });
  }
  return <TextInput value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" aria-label={label} style={style} />;
}

/** Ô vuông chọn (radio/checkbox) như trên phiếu. */
export function CheckSquare({ on, round }: { on: boolean; round?: boolean }) {
  return (
    <View style={{ width: 20, height: 20, borderRadius: round ? 10 : 5, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: on ? P.gold : '#C9B78F', backgroundColor: on ? P.gold : 'transparent' }}>
      {on ? <Icon name="check" size={13} color="#FFFFFF" strokeWidth={3} /> : null}
    </View>
  );
}

/** Thanh chọn gạch chân (thay cho hàng chip tròn). */
export function UnderlineTabs<K extends string>({ value, onChange, items }: { value: K; onChange: (k: K) => void; items: { key: K; label: string }[] }) {
  return (
    <View role="tablist" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18, borderBottomWidth: 1, borderColor: P.line }}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <Pressable key={it.key} role="tab" aria-selected={on} onPress={() => onChange(it.key)} style={{ paddingVertical: 10, marginBottom: -1, borderBottomWidth: 2, borderColor: on ? P.gold : 'transparent' }}>
            <Text className={on ? 'font-heavy' : 'font-semi'} style={{ fontSize: 14, color: on ? P.navy : P.muted }}>
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Nút chữ nhỏ có biểu tượng (thao tác phụ trên tờ phiếu). */
export function TextAction({ label, icon, onPress, tone = 'navy', disabled }: { label: string; icon?: IconName; onPress: () => void; tone?: 'navy' | 'red' | 'light'; disabled?: boolean }) {
  const c = tone === 'red' ? P.red : tone === 'light' ? P.goldLight : P.navy;
  return (
    <Pressable role="button" aria-label={label} onPress={onPress} disabled={disabled} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, opacity: disabled ? 0.5 : 1 }}>
      {icon ? <Icon name={icon} size={15} color={c} /> : null}
      <Text className="font-semi" style={{ fontSize: 13, color: c, textDecorationLine: 'underline', textDecorationColor: tone === 'light' ? 'rgba(226,200,143,0.5)' : P.line } as object}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Chép vào bộ nhớ tạm, đổi chữ nút thành "Đã chép" trong chốc lát. */
export function useCopy(): [string | null, (key: string, text: string) => void] {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, text: string) => {
    void Clipboard.setStringAsync(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied((k) => (k === key ? null : k)), 1800);
    });
  };
  return [copied, copy];
}

/** Dấu trạng thái của một bài giao. */
export function StateMark({ state, compact }: { state: AssignmentState; compact?: boolean }) {
  const { L } = useL();
  const look: Record<AssignmentState, { fg: string; bg: string; icon: IconName | null; vi: string; en: string }> = {
    done: { fg: P.green, bg: P.greenSoft, icon: 'check', vi: 'Xong', en: 'Done' },
    started: { fg: P.amber, bg: P.amberSoft, icon: 'clock', vi: 'Đang làm', en: 'In progress' },
    todo: { fg: P.muted, bg: '#F3F0FB', icon: null, vi: 'Chưa làm', en: 'Not started' },
    unknown: { fg: '#9A8F78', bg: 'transparent', icon: null, vi: '—', en: '—' },
  };
  const s = look[state];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: compact ? 6 : 8, paddingVertical: 3, borderRadius: 6, backgroundColor: s.bg, alignSelf: 'flex-start' }}>
      {s.icon ? <Icon name={s.icon} size={12} color={s.fg} strokeWidth={2.6} /> : null}
      <Text className="font-strong" style={{ fontSize: 12, color: s.fg }}>
        {L(s.vi, s.en)}
      </Text>
    </View>
  );
}

/** Số hoặc "—" khi không biết. Không bao giờ đổi null thành 0. */
export function num(v: number | null | undefined, unit = ''): string {
  return v === null || v === undefined ? '—' : `${v}${unit}`;
}

/** "01/10" hoặc "01/10/2026" nếu khác năm hiện tại. */
export function fmtDay(iso: string | null | undefined, today = new Date().toISOString().slice(0, 10)): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return '—';
  return y === today.slice(0, 4) ? `${d}/${m}` : `${d}/${m}/${y}`;
}

/** Thông báo lỗi / trạng thái nhỏ trên giấy. */
export function Note({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'error' | 'ok' }) {
  const c = tone === 'error' ? P.red : tone === 'ok' ? P.green : P.muted;
  return (
    <Text role={tone === 'error' ? 'alert' : undefined} className="font-sans" style={{ marginTop: 8, fontSize: 13, lineHeight: 19, color: c }}>
      {text}
    </Text>
  );
}
