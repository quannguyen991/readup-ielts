import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { NeonWindow } from '@/components/neon/Neon';
import { IELTS_QUESTION_TYPES } from '@/data/ielts-question-types';
import { useL } from '@/i18n/useL';
import { accuracyVerdict, bandSpectrum, spectrumRowFor, type DrillReport, type ReportItem } from '@/services/ielts/drill-report';

/**
 * Báo cáo chấm điểm chi tiết sau một lượt luyện: band ước tính, phổ điểm, độ chính xác từng dạng
 * và từng câu (đáp án của bạn, đáp án đúng, bằng chứng trong bài, giải thích).
 */

const VERDICT_COLOR = { strong: '#15803D', ok: '#B45309', weak: '#B91C1C' } as const;
const VERDICT_BG = { strong: '#DCFCE7', ok: '#FEF3C7', weak: '#FEE2E2' } as const;

export function typeTitle(typeId: string, vi = true): string {
  const t = IELTS_QUESTION_TYPES.find((x) => x.id === typeId);
  return t ? (vi ? t.titleVi : t.titleEn) : typeId;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const shownAnswer = (a: string) => (a.split('|')[0] ?? '').trim();

export function DrillReportView({
  report,
  items,
  title,
  seconds,
  actions,
}: {
  report: DrillReport;
  items: ReportItem[];
  title: string;
  seconds: number;
  actions?: React.ReactNode;
}) {
  const { L } = useL();
  const [filter, setFilter] = useState<'all' | 'wrong' | 'blank'>('all');
  const [open, setOpen] = useState<Record<number, boolean>>({});

  const spectrum = useMemo(() => bandSpectrum(report.skill), [report.skill]);
  const row = spectrumRowFor(report.skill, report.scaled40);
  const rowIdx = row ? spectrum.indexOf(row) : -1;
  const next = rowIdx > 0 ? spectrum[rowIdx - 1] : null;
  const needScaled = next ? next.minRaw : null;
  const needNow = needScaled === null ? null : Math.max(0, Math.ceil((needScaled * report.total) / 40) - report.correct);

  const shown = items.filter((i) => (filter === 'all' ? true : filter === 'wrong' ? !i.correct && i.given !== null : i.given === null));
  const bandText = report.bandLow === report.bandHigh ? report.band.toFixed(1) : `${report.bandLow.toFixed(1)}–${report.bandHigh.toFixed(1)}`;
  const weakMeta = report.weakest ? IELTS_QUESTION_TYPES.find((t) => t.id === report.weakest!.typeId) : undefined;

  return (
    <View className="gap-4 pb-12">
      {/* Band ước tính */}
      <NeonWindow title={L('Kết quả', 'Result')} icon="medal" padded={false}>
        <View className="items-center p-6">
        <Text className="font-strong text-label text-muted">{title}</Text>
        <Text className="mt-2 font-strong text-label text-muted">{report.fullLength ? L('BAND ƯỚC TÍNH', 'ESTIMATED BAND') : L('BAND ƯỚC LƯỢNG (từ ' + report.total + ' câu)', 'ROUGH BAND (from ' + report.total + ' questions)')}</Text>
        <Text className="font-heavy" style={{ fontSize: 56, lineHeight: 64, color: '#6A4BD9' }}>{bandText}</Text>
        <Text className="font-strong text-body text-ink">
          {L(`Đúng ${report.correct}/${report.total} câu · ${report.pct}%`, `${report.correct}/${report.total} correct · ${report.pct}%`)}
          {report.total !== 40 ? ` ${L('≈', '≈')} ${report.scaled40}/40` : ''}
        </Text>
        <Text className="mt-1 font-sans text-label text-muted">
          {L(`Thời gian ${fmtTime(seconds)}`, `Time ${fmtTime(seconds)}`)}
          {report.unanswered > 0 ? ` · ${L(`${report.unanswered} câu chưa làm`, `${report.unanswered} unanswered`)}` : ''}
        </Text>
        {!report.fullLength ? (
          <Text className="mt-3 text-center font-sans text-label text-muted">
            {L('Band chỉ là ước lượng vì mới làm ' + report.total + ' câu: quy tỉ lệ lên 40 câu, sai số khoảng ±1 câu. Làm bài tổng hợp 40 câu để có band chắc hơn.', 'This is a rough estimate from ' + report.total + ' questions scaled to 40 (±1 question). Take the 40-question test for a firmer band.')}
          </Text>
        ) : null}
        </View>
      </NeonWindow>

      {/* Phổ điểm */}
      <NeonWindow title={L('Phổ điểm', 'Score spectrum')} icon="gem" padded={false}>
        <View className="gap-3 p-4">
        <Text className="font-strong text-label text-muted">{L('PHỔ ĐIỂM · SỐ CÂU ĐÚNG TRÊN THANG 40 CHO TỪNG BAND', 'SCORE SPECTRUM · CORRECT ANSWERS OUT OF 40 PER BAND')}</Text>
        <View style={{ gap: 6 }}>
          {spectrum.map((r) => {
            const here = r === row;
            const width = Math.max(14, Math.round((r.maxRaw / 40) * 100));
            return (
              <View key={r.band} className="flex-row items-center gap-3">
                <Text className="w-10 font-heavy text-body" style={{ color: here ? '#6A4BD9' : '#64748B' }}>{r.band.toFixed(1)}</Text>
                <View style={{ flex: 1, height: 26, borderRadius: 8, backgroundColor: '#F1ECFF', overflow: 'hidden' }}>
                  <View style={{ width: `${width}%`, height: '100%', backgroundColor: here ? '#6A4BD9' : '#D9CCFF', justifyContent: 'center', paddingHorizontal: 10 }}>
                    <Text className="font-strong text-[12px]" style={{ color: here ? '#FFFFFF' : '#4B3A99' }}>{r.minRaw === r.maxRaw ? r.minRaw : `${r.minRaw}–${r.maxRaw}`}</Text>
                  </View>
                </View>
                {here ? <Text className="w-16 text-right font-strong text-label" style={{ color: '#6A4BD9' }}>{L('Bạn', 'You')} {report.scaled40}/40</Text> : <View className="w-16" />}
              </View>
            );
          })}
        </View>
        {needScaled !== null && next ? (
          <Text className="font-sans text-body text-ink">
            {L(`Để lên band ${next.band.toFixed(1)} cần đạt ${needScaled}/40`, `To reach band ${next.band.toFixed(1)} you need ${needScaled}/40`)}
            {report.total !== 40 ? ` (${L(`khoảng thêm ${needNow} câu ở bài ${report.total} câu này`, `about ${needNow} more here`)})` : ` (${L(`thêm ${needNow} câu`, `${needNow} more`)})`}.
          </Text>
        ) : row ? (
          <Text className="font-sans text-body text-ink">{L('Bạn đang ở mức cao nhất của phổ điểm.', 'You are at the top of the spectrum.')}</Text>
        ) : (
          <Text className="font-sans text-body text-muted">{L('Điểm dưới band 4: tập trung nắm chắc từng dạng bên dưới trước.', 'Below band 4: build up each question type below first.')}</Text>
        )}
        </View>
      </NeonWindow>

      {/* Độ chính xác từng dạng */}
      <NeonWindow title={L('Độ chính xác từng dạng', 'Accuracy by type')} icon="star5" padded={false}>
        <View className="gap-3 p-4">
        <Text className="font-strong text-label text-muted">{L('ĐỘ CHÍNH XÁC TỪNG DẠNG CÂU HỎI', 'ACCURACY BY QUESTION TYPE')}</Text>
        {report.byType.map((t) => {
          const v = accuracyVerdict(t.pct);
          return (
            <Pressable key={t.typeId} onPress={() => router.push(`/ielts/skills/${t.typeId}` as never)} className="gap-1.5">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="flex-1 font-strong text-body text-ink" numberOfLines={2}>{typeTitle(t.typeId)}</Text>
                <Text className="font-heavy text-body" style={{ color: VERDICT_COLOR[v] }}>{t.correct}/{t.total} · {t.pct}%</Text>
              </View>
              <View style={{ height: 10, borderRadius: 5, backgroundColor: '#EEE9FB', overflow: 'hidden' }}>
                <View style={{ width: `${t.pct}%`, height: '100%', borderRadius: 5, backgroundColor: VERDICT_COLOR[v] }} />
              </View>
            </Pressable>
          );
        })}
        {report.weakest && report.weakest.pct < 80 ? (
          <View className="mt-1 rounded-xl border p-3" style={{ borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }}>
            <Text className="font-strong text-label" style={{ color: '#92400E' }}>{L('NÊN LUYỆN THÊM', 'PRACTISE NEXT')}: {typeTitle(report.weakest.typeId)} ({report.weakest.pct}%)</Text>
            {weakMeta?.traps[0] ? <Text className="mt-1 font-sans text-body" style={{ color: '#78350F' }}>{L('Bẫy hay gặp', 'Common trap')}: {weakMeta.traps[0]}</Text> : null}
            {weakMeta?.tips[0] ? <Text className="mt-1 font-sans text-body" style={{ color: '#78350F' }}>{L('Mẹo', 'Tip')}: {weakMeta.tips[0]}</Text> : null}
            <Pressable onPress={() => router.push(`/ielts/skills/${report.weakest!.typeId}` as never)} className="mt-2 self-start">
              <Text className="font-strong text-label" style={{ color: '#6A4BD9' }}>{L('Mở mẹo và bài luyện riêng của dạng này →', 'Open tips and drills for this type →')}</Text>
            </Pressable>
          </View>
        ) : null}
        </View>
      </NeonWindow>

      {/* Từng câu */}
      <NeonWindow title={L('Chi tiết từng câu', 'Question by question')} icon="note" padded={false}>
        <View className="gap-3 p-4">
        <Text className="font-strong text-label text-muted">{L('CHI TIẾT TỪNG CÂU', 'QUESTION BY QUESTION')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {([['all', L('Tất cả', 'All'), items.length], ['wrong', L('Làm sai', 'Wrong'), items.filter((i) => !i.correct && i.given !== null).length], ['blank', L('Bỏ trống', 'Blank'), report.unanswered]] as const).map(([k, label, n]) => (
            <Pressable key={k} onPress={() => setFilter(k)} className="rounded-full border px-3 py-1.5" style={{ borderColor: filter === k ? '#6A4BD9' : '#E2E8F0', backgroundColor: filter === k ? '#6A4BD9' : '#FFFFFF' }}>
              <Text className="font-strong text-label" style={{ color: filter === k ? '#FFFFFF' : '#334155' }}>{label} ({n})</Text>
            </Pressable>
          ))}
        </View>
        {shown.length === 0 ? <Text className="font-sans text-body text-muted">{L('Không có câu nào trong mục này.', 'Nothing here.')}</Text> : null}
        {shown.map((it) => {
          const isOpen = !!open[it.index];
          return (
            <View key={it.index} className="overflow-hidden rounded-xl border" style={{ borderColor: it.correct ? '#BBF7D0' : it.given === null ? '#E2E8F0' : '#FECACA' }}>
              <Pressable onPress={() => setOpen((o) => ({ ...o, [it.index]: !o[it.index] }))} className="flex-row items-start gap-3 p-3" style={{ backgroundColor: it.correct ? '#F0FDF4' : it.given === null ? '#F8FAFC' : '#FEF2F2' }}>
                <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: it.correct ? '#DCFCE7' : it.given === null ? '#E2E8F0' : '#FEE2E2' }}>
                  <Text className="font-heavy text-label" style={{ color: it.correct ? '#15803D' : it.given === null ? '#64748B' : '#B91C1C' }}>{it.index}</Text>
                </View>
                <View className="flex-1 gap-1">
                  <Text className="font-strong text-[12px]" style={{ color: '#6A4BD9' }} numberOfLines={1}>{typeTitle(it.typeId)}</Text>
                  <Text className="font-sans text-body text-ink" numberOfLines={isOpen ? undefined : 2}>{it.prompt}</Text>
                  <Text className="font-sans text-label text-muted">
                    {L('Bạn', 'You')}: <Text className="font-strong" style={{ color: it.correct ? '#15803D' : '#B91C1C' }}>{it.given ?? L('(bỏ trống)', '(blank)')}</Text>
                    {!it.correct ? <Text>{'  ·  '}{L('Đúng', 'Correct')}: <Text className="font-strong" style={{ color: '#15803D' }}>{shownAnswer(it.answer)}</Text></Text> : null}
                  </Text>
                </View>
                <Text className="font-strong text-label" style={{ color: '#6A4BD9' }}>{isOpen ? '−' : '+'}</Text>
              </Pressable>
              {isOpen ? (
                <View className="gap-2 border-t p-3" style={{ borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
                  {it.options ? (
                    <View className="gap-1">
                      {it.options.map((o) => (
                        <Text key={o} className="font-sans text-label" style={{ color: o === it.answer ? '#15803D' : o === it.given ? '#B91C1C' : '#64748B' }}>
                          {o === it.answer ? '✓ ' : o === it.given ? '✗ ' : '• '}{o}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  {it.quote ? (
                    <View className="rounded-lg border p-2.5" style={{ borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }}>
                      <Text className="font-strong text-[12px]" style={{ color: '#92400E' }}>{L('BẰNG CHỨNG TRONG BÀI', 'EVIDENCE')}</Text>
                      <Text className="mt-0.5 font-sans text-body italic" style={{ color: '#78350F' }}>“{it.quote}”</Text>
                    </View>
                  ) : null}
                  <View className="rounded-lg border p-2.5" style={{ borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' }}>
                    <Text className="font-strong text-[12px]" style={{ color: '#5B21B6' }}>{L('GIẢI THÍCH', 'EXPLANATION')}</Text>
                    <Text className="mt-0.5 font-sans text-body text-ink leading-relaxed">{it.why}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
        </View>
      </NeonWindow>

      {actions}
    </View>
  );
}

export { VERDICT_BG };
