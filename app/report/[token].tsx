import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { type IconName } from '@/components/ui/Icon';
import type { ParentReport } from '@/services/report/parent-report';
import { color } from '@/theme/tokens';
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Sticker } from '@/components/illust/Sticker';
import { CuteMagnifier, Motion } from '@/components/illust/CuteMore';

/** Màu huy hiệu cho từng ô (bảng màu chung). */
const SEAL: Partial<Record<IconName, string>> = { grid: '#A8843F', letters: '#F472B6', book: '#22A06B', trophy: '#F2B632' };

type Payload = { name: string | null; generatedAt: string; hasData: boolean; report: ParentReport };

const CARD = { boxShadow: '0 1px 2px rgba(15,23,42,0.05), 0 12px 30px rgba(94, 72, 35,0.08)' } as object;

const hm = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} giờ ${min % 60} phút` : `${min} phút`);
const pct = (x: number | null) => (x === null ? '—' : `${Math.round(x * 100)}%`);

/**
 * BÁO CÁO TUẦN CHO PHỤ HUYNH — trang chỉ đọc, mở bằng đường dẫn học sinh gửi.
 * Viết cho người không học SAT: câu tóm tắt bằng lời, số liệu ít mà rõ.
 */
export default function ParentReportScreen() {
  const { token = '' } = useLocalSearchParams<{ token: string }>();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/report?t=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const body = (await r.json()) as Payload & { error?: string };
        if (!r.ok) throw new Error(body.error ?? `Lỗi ${r.status}`);
        if (!cancelled) setData(body);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return (
      <Screen>
        <View className="mt-10 w-full self-center rounded-[22px] bg-white p-6" style={[{ maxWidth: 640 }, CARD]}>
          <View aria-hidden className="mb-3 self-start">
            <Motion kind="wobble">
              <Sticker tilt={-8}>
                <CuteMagnifier size={60} />
              </Sticker>
            </Motion>
          </View>
          <Text className="font-heavy text-sectionTitle text-ink">Không mở được báo cáo</Text>
          <Text className="mt-1 font-sans text-bodyLg text-muted">{error} Hãy nhờ con gửi lại đường dẫn mới.</Text>
        </View>
      </Screen>
    );
  }
  if (!data) {
    return (
      <Screen>
        <View className="mt-16 items-center">
          <ActivityIndicator color={color.primary} />
        </View>
      </Screen>
    );
  }

  const r = data.report;
  const who = data.name ?? 'con';
  const diff = r.minutes7 - r.minutesPrev7;
  const summary = !data.hasData
    ? `Chưa có dữ liệu học nào được đồng bộ. Nhờ ${who} đăng nhập và học trên Band 9, báo cáo sẽ tự cập nhật.`
    : `Tuần này ${who} học ${hm(r.minutes7)} trong ${r.activeDays7}/7 ngày${
        r.minutesPrev7 > 0 || r.minutes7 > 0 ? `, ${diff >= 0 ? 'nhiều hơn' : 'ít hơn'} tuần trước ${hm(Math.abs(diff))}` : ''
      }${r.streak > 1 ? `, đang giữ chuỗi ${r.streak} ngày học liên tiếp` : ''}.`;
  const maxMin = Math.max(30, ...r.days.map((d) => d.minutes));

  return (
    <Screen>
      <View className="w-full self-center" style={{ maxWidth: 760 }}>
        <Appear>
          <View className="rounded-[24px] p-6" style={[{ backgroundColor: '#CDA45E' }, CARD]}>
            <View className="flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="font-strong text-label uppercase tracking-[1.4px] text-white/80">Band 9 · Báo cáo tuần</Text>
                <Text className="mt-2 font-heavy text-pageTitle text-white">Báo cáo học tập của {who}</Text>
              </View>
              <PageStickers scene="progress" compact />
            </View>
            <Text className="mt-2 font-sans text-bodyLg text-white/90">{summary}</Text>
          </View>
        </Appear>

        <Appear index={1}>
          <View className="mt-4 rounded-[22px] bg-white p-5" style={CARD}>
            <View className="flex-row items-center gap-2.5">
              <View aria-hidden>
                <SealIcon name="calendar" color="#B07A3A" size={36} />
              </View>
              <Text className="min-w-0 flex-1 font-heavy text-cardTitle text-ink">Thời gian học 7 ngày qua</Text>
            </View>
            <View className="mt-4 flex-row items-end justify-between gap-2" style={{ height: 150 }}>
              {r.days.map((d) => {
                const h = Math.max(4, (d.minutes / maxMin) * 120);
                const label = d.date.slice(8, 10) + '/' + Number(d.date.slice(5, 7));
                return (
                  <View key={d.date} className="flex-1 items-center">
                    <Text className="mb-1 font-semi text-label text-ink">{d.minutes > 0 ? d.minutes : ''}</Text>
                    <View className="w-full rounded-t-lg" style={{ height: h, backgroundColor: d.minutes > 0 ? '#D7B67D' : '#F0EBE2' }} />
                    <Text className="mt-1.5 font-sans text-label text-muted">{label}</Text>
                  </View>
                );
              })}
            </View>
            <Text className="mt-3 font-sans text-label text-muted">Số trên cột là số phút học mỗi ngày.</Text>
          </View>
        </Appear>

        <View className="mt-4 flex-row flex-wrap gap-3">
          <Tile
            icon="grid"
            tone="#CDA45E"
            title="SAT Math"
            lines={[
              `${r.math.questions7} câu tuần này`,
              `Làm đúng ${pct(r.math.accuracy7)} (tuần trước ${pct(r.math.accuracyPrev7)})`,
              r.math.range ? `Điểm dự đoán: ${r.math.range.low}–${r.math.range.high}/800` : 'Chưa đủ dữ liệu để dự đoán điểm',
            ]}
          />
          <Tile
            icon="letters"
            tone="#DB2777"
            title="SAT Verbal"
            lines={[`${r.verbal.questions7} câu tuần này`, `Làm đúng ${pct(r.verbal.accuracy7)} (tuần trước ${pct(r.verbal.accuracyPrev7)})`]}
          />
          <Tile icon="book" tone="#0D9488" title="Từ vựng" lines={[`${r.vocab.saved7} từ mới tuần này`, `${r.vocab.reviews7} lượt ôn tập`, `Tổng ${r.vocab.saved} từ trong sổ`]} />
          <Tile
            icon="trophy"
            tone="#D97706"
            title="Đề của tuần"
            lines={r.weekly ? [`${r.weekly.score}/${r.weekly.total} câu đúng`, 'Đề chung cho mọi học sinh cả nước'] : ['Tuần này chưa làm']}
          />
        </View>

        {r.topErrors.length > 0 ? (
          <Appear index={3}>
            <View className="mt-4 rounded-[22px] bg-white p-5" style={CARD}>
              <View className="flex-row items-center gap-2.5">
                <View aria-hidden>
                  <SealIcon name="target" color="#F0703F" size={36} />
                </View>
                <Text className="min-w-0 flex-1 font-heavy text-cardTitle text-ink">Lỗi {who} đang sửa</Text>
              </View>
              <Text className="mt-1 font-sans text-body text-muted">Những lỗi hay mắc nhất ở SAT Math trong 2 tuần qua — app đã gọi tên và giao bài sửa.</Text>
              <View className="mt-3 gap-2">
                {r.topErrors.map((e) => (
                  <View key={e.title} className="flex-row items-center justify-between rounded-2xl px-4 py-3" style={{ backgroundColor: '#FFF7ED' }}>
                    <Text className="font-semi text-body text-ink">{e.title}</Text>
                    <Text className="font-sans text-label text-muted">{e.count} lần</Text>
                  </View>
                ))}
              </View>
            </View>
          </Appear>
        ) : null}

        <Text className="mt-6 text-center font-sans text-label text-muted">
          Báo cáo do Band 9 tạo lúc {new Date(data.generatedAt).toLocaleString('vi-VN')} từ dữ liệu học thật — chỉ có số đếm, không có bài làm hay tin nhắn.
        </Text>
        <View className="h-8" />
      </View>
    </Screen>
  );
}

function Tile({ icon, tone, title, lines }: { icon: IconName; tone: string; title: string; lines: string[] }) {
  return (
    <View className="rounded-[20px] bg-white p-5" style={[{ flexGrow: 1, flexShrink: 1, flexBasis: 300 }, CARD]}>
      <View className="flex-row items-center gap-2">
        <View aria-hidden>
          <SealIcon name={icon} color={SEAL[icon] ?? tone} size={34} />
        </View>
        <Text className="font-heavy text-bodyLg text-ink">{title}</Text>
      </View>
      <View className="mt-2 gap-1">
        {lines.map((l) => (
          <Text key={l} className="font-sans text-body text-ink">
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}
