import React, { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Badge, Button, Card, Icon } from '@/components/ui';
import {
  parseExport,
  summariseCohort,
  worthTeaching,
  type LearnerExport,
  type SkillSummary,
} from '@/services/mastery/cohort';
import { DOMAIN_LABEL, type Domain } from '@/services/mastery/types';
import { color } from '@/theme/tokens';
import { PageStickers, SealIcon } from '@/components/illust/HeroArt';
import { Label } from '@/components/illust/Sticker';
import { Motion } from '@/components/illust/CuteMore';
import { useL } from '@/i18n/useL';

/** Tên mảng khi giao diện ở tiếng Anh (bản tiếng Việt ở DOMAIN_LABEL). */
const DOMAIN_LABEL_EN: Record<Domain, string> = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  'sat-math': 'SAT Math',
  'sat-verbal': 'SAT Verbal',
  'ai-literacy': 'Reading AI output',
};

/** Lý do từ chối của parseExport (tiếng Việt) → tiếng Anh. */
const REJECT_EN: Record<string, string> = {
  'không phải JSON hợp lệ': 'not valid JSON',
  'thiếu mã người học': 'missing learner code',
  'thiếu mốc thời gian': 'missing timestamp',
  'thiếu sổ': 'missing ledger',
};

/**
 * Màn giáo viên: lớp đang vướng chung ở đâu.
 *
 * VÌ SAO KHÔNG PHẢI BẢNG ĐIỂM. Bảng điểm nói ai cao ai thấp — thứ giáo viên đã
 * biết trước khi mở app. Cái họ chưa biết là DẠY GÌ VÀO BUỔI SAU, và câu ấy chỉ
 * trả lời được khi thấy chỗ vướng CHUNG: mười tám em cùng chỉ sai đoạn ở dạng
 * câu suy luận là một tiết dạy, còn mười tám em vướng mười tám chỗ khác nhau là
 * mười tám cuộc trò chuyện riêng. Hai tình huống ấy cần hai cách xử lý khác hẳn,
 * và một cột điểm trung bình cho chúng cùng một con số.
 *
 * KHÔNG CẦN TÀI KHOẢN, KHÔNG CẦN MÁY CHỦ. Học sinh xuất một file từ máy mình,
 * giáo viên mở lên. Không có gì rời khỏi máy ai cả. Đây không phải bản rút gọn
 * tạm thời — đó là điều kiện để dùng được ở lớp không có hạ tầng, và cũng là
 * cách rẻ nhất để không phải giữ dữ liệu học tập của trẻ em trên một máy chủ.
 *
 * KHÔNG CÓ TÊN HỌC SINH. Bản xuất chỉ mang một mã do chính các em đặt. Xếp hạng
 * học sinh không phải việc mà cơ chế này sinh ra để làm.
 */
export default function TeacherScreen() {
  const { L } = useL();
  const [raw, setRaw] = useState('');
  const [exports, setExports] = useState<LearnerExport[]>([]);
  const [error, setError] = useState<string | null>(null);

  const summaries = useMemo(() => summariseCohort(exports), [exports]);
  const teachable = useMemo(() => worthTeaching(summaries, 3), [summaries]);

  const add = () => {
    setError(null);
    const text = raw.trim();
    if (!text) return;

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(text);
    } catch {
      setError(L('Không đọc được JSON. Dán nguyên nội dung file học sinh gửi.', "Couldn't read the JSON. Paste the student's file exactly as sent."));
      return;
    }

    // Chấp nhận cả một bản lẫn một mảng nhiều bản: giáo viên thường gom sẵn.
    const list = Array.isArray(parsedJson) ? parsedJson : [parsedJson];
    const ok: LearnerExport[] = [];
    const bad: string[] = [];
    for (const item of list) {
      const got = parseExport(item);
      if ('rejected' in got) bad.push(got.rejected);
      else ok.push(got);
    }

    if (ok.length === 0) {
      setError(
        L(
          `Không nhận được bản nào (${bad[0] ?? 'sai hình dạng'}).`,
          `No exports accepted (${bad[0] ? (REJECT_EN[bad[0]] ?? bad[0]) : 'wrong format'}).`,
        ),
      );
      return;
    }
    setExports((prev) => [...prev, ...ok]);
    setRaw('');
    if (bad.length > 0) {
      setError(
        L(
          `Đã nhận ${ok.length} bản, bỏ qua ${bad.length} bản sai hình dạng.`,
          `Added ${ok.length}, skipped ${bad.length} with the wrong format.`,
        ),
      );
    }
  };

  const learners = new Set(exports.map((e) => e.learnerCode)).size;

  return (
    <Screen>
      <View className="flex-row items-start justify-between gap-3">
      <View className="min-w-0 flex-1">
      <View className="self-start rounded-pill border border-border bg-surface px-3 py-1.5">
        <Text className="font-semi uppercase tracking-wide text-muted" style={{ fontSize: 10 }}>
          Teacher view
        </Text>
      </View>

      <Text className="mt-3 font-heavy text-pageTitle text-ink">{L('Lớp đang vướng ở đâu', 'Where the class is stuck')}</Text>
      </View>
      <PageStickers scene="review" />
      </View>
      <Text className="mt-1.5 max-w-[680px] font-sans text-bodyLg text-muted">
        {L(
          'Học sinh xuất sổ bằng chứng từ máy mình rồi gửi cho bạn; dán vào đây để xem chỗ vướng chung. Không cần tài khoản, không có gì rời khỏi máy bạn, và bản xuất không mang tên ai — chỉ có mã do chính các em đặt.',
          "Students export their evidence ledger on their own device and send it to you; paste it here to see where they're stuck together. No account needed, nothing leaves your device, and exports carry no names — only codes the students chose themselves.",
        )}
      </Text>

      <Card className="mt-5">
        <View className="flex-row items-center gap-2.5">
          <View aria-hidden>
            <SealIcon name="clipboard" color="#A8843F" size={36} />
          </View>
          <Text className="min-w-0 flex-1 font-strong text-body text-ink">{L('Dán bản xuất của học sinh', 'Paste student exports')}</Text>
        </View>
        <Text className="mt-1 font-sans text-label text-muted">
          {L('Mỗi lần một bản, hoặc dán cả một mảng JSON nhiều bản.', 'One at a time, or paste a JSON array of several.')}
        </Text>
        <TextInput
          value={raw}
          onChangeText={setRaw}
          multiline
          placeholder='{"learnerCode":"HS-01", ...}'
          placeholderTextColor={color.subtle}
          className="mt-3 rounded-panel border border-border bg-surface px-3 py-2.5 font-sans text-label text-ink"
          style={{ minHeight: 96 }}
        />
        <View className="mt-3 flex-row flex-wrap items-center gap-2">
          <Button label={L('Thêm vào lớp', 'Add to class')} iconRight="plus" onPress={add} />
          {exports.length > 0 ? (
            <Button
              variant="outline"
              label={L('Xoá hết', 'Clear all')}
              onPress={() => {
                setExports([]);
                setError(null);
              }}
            />
          ) : null}
          <View className="flex-1" />
          <Badge label={L(`${learners} học sinh`, `${learners} student${learners === 1 ? '' : 's'}`)} tone={learners > 0 ? 'success' : 'neutral'} />
        </View>
        {error ? <Text className="mt-2 font-sans text-label text-warning-ink">{error}</Text> : null}
      </Card>

      {summaries.length === 0 ? null : (
        <>
          <View className="mt-6">
            <View className="flex-row flex-wrap items-center gap-2.5">
              <View aria-hidden>
                <SealIcon name="target" color="#F0703F" size={38} />
              </View>
              <Text className="font-strong text-cardTitle text-ink">{L('Đáng dạy chung buổi tới', 'Worth teaching next lesson')}</Text>
              {teachable.length > 0 ? (
                <View aria-hidden>
                  <Motion kind="pop">
                    <Label text={L('Buổi tới 🎯', 'Next lesson 🎯')} color="#F2B632" ink="#2A1B02" tilt={-4} size={11} />
                  </Motion>
                </View>
              ) : null}
            </View>
            <Text className="mt-1 max-w-[640px] font-sans text-body text-muted">
              {L(
                'Những kỹ năng có từ ba em trở lên đang vướng. Dưới ngưỡng đó thì nói riêng với từng em hiệu quả hơn là dừng cả lớp lại.',
                'Skills where three or more students are stuck. Below that, talking to each student works better than stopping the whole class.',
              )}
            </Text>
            {teachable.length === 0 ? (
              <Card className="mt-3">
                <Text className="font-sans text-body text-muted">
                  {L(
                    'Chưa có kỹ năng nào đủ đông người vướng. Cả lớp đang vướng ở những chỗ khác nhau — danh sách đầy đủ ở dưới.',
                    'No skill has enough students stuck yet. The class is stuck in different places — see the full list below.',
                  )}
                </Text>
              </Card>
            ) : (
              <View className="mt-3 gap-2.5">
                {teachable.map((s) => (
                  <SkillRow key={`${s.domain}:${s.key}`} summary={s} highlight />
                ))}
              </View>
            )}
          </View>

          <View className="mt-6">
            <View className="flex-row items-center gap-2.5">
              <View aria-hidden>
                <SealIcon name="list" color="#B07A3A" size={38} />
              </View>
              <Text className="min-w-0 flex-1 font-strong text-cardTitle text-ink">{L('Toàn bộ kỹ năng đã quan sát', 'All observed skills')}</Text>
            </View>
            <View className="mt-3 gap-2">
              {summaries.map((s) => (
                <SkillRow key={`all-${s.domain}:${s.key}`} summary={s} />
              ))}
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

function SkillRow({ summary, highlight }: { summary: SkillSummary; highlight?: boolean }) {
  const { L, en } = useL();
  const stuck = summary.counts['needs-probe'] + summary.counts.probing;

  return (
    <View
      className={[
        'rounded-panel border p-3.5',
        highlight ? 'border-warning bg-warning-soft' : 'border-border bg-surface',
      ].join(' ')}
    >
      <View className="flex-row flex-wrap items-center gap-2">
        <Text className="font-strong text-body text-ink">{summary.key}</Text>
        <Text className="font-sans text-label text-muted">
          {(en ? DOMAIN_LABEL_EN : DOMAIN_LABEL)[summary.domain as Domain] ?? summary.domain}
        </Text>
        <View className="flex-1" />
        <Text className="font-strong text-body" style={{ color: stuck > 0 ? color.warning : color.success }}>
          {stuck}/{summary.learners}
        </Text>
      </View>

      <Text className="mt-1 font-sans text-label text-muted">
        {L(
          `đang vướng · ${Math.round(summary.stuckRatio * 100)}% · ${summary.observations} lượt làm bài`,
          `stuck · ${Math.round(summary.stuckRatio * 100)}% · ${summary.observations} attempts`,
        )}
      </Text>

      {/*
        Thanh trạng thái thay cho một con số phần trăm.

        Bốn màu cạnh nhau cho thấy ngay hình dạng của lớp: một dải vàng dài là
        cả lớp cùng mắc, còn một dải xanh dài kèm vài vạch đỏ là vài em tụt lại —
        hai tình huống cần hai cách xử lý, mà một con số trung bình thì không
        phân biệt được.
      */}
      <View className="mt-2 h-2 flex-row overflow-hidden rounded-pill">
        <Bar n={summary.counts['needs-probe']} total={summary.learners} tone={color.danger} />
        <Bar n={summary.counts.probing} total={summary.learners} tone={color.warning} />
        <Bar n={summary.counts.confirmed} total={summary.learners} tone={color.success} />
        <Bar n={summary.counts.unobserved} total={summary.learners} tone={color.borderStrong} />
      </View>
    </View>
  );
}

function Bar({ n, total, tone }: { n: number; total: number; tone: string }) {
  if (n === 0 || total === 0) return null;
  return <View style={{ flex: n / total, backgroundColor: tone }} />;
}
