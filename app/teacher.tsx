import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
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
import { SealIcon } from '@/components/illust/HeroArt';
import { Label } from '@/components/illust/Sticker';
import { CuteNotebook, Motion } from '@/components/illust/CuteMore';
import { Field, Note, P, PageHead, Section, Sheet, TextAction, UnderlineTabs, useCopy } from '@/components/classes/ClassKit';
import { classApi, ClassApiError, type MyClasses, type TeachingClass } from '@/services/classes/client';
import { formatClassCode } from '@/services/classes/code';
import { CLASS_NAME_MAX, MAX_ACTIVE_CLASSES_PER_TEACHER } from '@/services/classes/rules';
import { useAuthStore } from '@/store/useAuthStore';
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
 * Màn giáo viên — SỔ LỚP.
 *
 * Phần chính (01/10/2026) là LỚP TRỰC TUYẾN: giáo viên tạo lớp, đưa mã 6 ký tự
 * cho học sinh, giao bài và xem tiến độ (`app/class/[id].tsx`). Miễn phí cho giáo
 * viên — đây là cửa vào để sau này bán gói cho trung tâm.
 *
 * Thẻ "Nhập file" giữ nguyên công cụ cũ: học sinh xuất sổ bằng chứng từ máy mình,
 * giáo viên dán vào để xem chỗ vướng chung — không cần tài khoản, không có gì
 * rời khỏi máy ai. Dành cho lớp không muốn (hoặc không thể) dùng tài khoản.
 */
export default function TeacherScreen() {
  const { L } = useL();
  const [tab, setTab] = useState<'online' | 'file'>('online');

  return (
    <Screen>
      <Appear>
        <PageHead
          kicker={L('BAND 9 · SỔ LỚP', 'BAND 9 · CLASS REGISTER')}
          title={L('Lớp học của bạn', 'Your classes')}
          subtitle={L(
            'Tạo lớp, đưa mã cho học sinh, giao bài và xem cả lớp học tới đâu. Miễn phí cho giáo viên.',
            'Create a class, give students the code, assign work and see how far everyone has got. Free for teachers.',
          )}
          art={<CuteNotebook size={72} />}
        />
      </Appear>

      <View style={{ marginTop: 18 }}>
        <UnderlineTabs
          value={tab}
          onChange={setTab}
          items={[
            { key: 'online', label: L('Lớp trực tuyến', 'Online classes') },
            { key: 'file', label: L('Nhập file học sinh gửi', 'Import student files') },
          ]}
        />
      </View>

      <View style={{ marginTop: 18 }}>{tab === 'online' ? <OnlineClasses /> : <CohortImport />}</View>
    </Screen>
  );
}

/* ================================================================ LỚP TRỰC TUYẾN */

function OnlineClasses() {
  const { L } = useL();
  const status = useAuthStore((s) => s.status);
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const { width } = useWindowDimensions();
  const wide = width >= 1000;

  const [data, setData] = useState<MyClasses | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; tone: 'error' | 'ok' } | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const [tick, setTick] = useState(0);
  const load = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!token) return;
    let live = true;
    classApi<MyClasses>('/api/classes', { token })
      .then((d) => {
        if (!live) return;
        setData(d);
        setLoadError(null);
      })
      .catch((e: unknown) => {
        if (!live) return;
        if (e instanceof ClassApiError && e.setupNeeded) setSetupNeeded(true);
        setLoadError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      live = false;
    };
  }, [token, tick]);

  if (status === 'loading') return <Note text={L('Đang mở…', 'Loading…')} />;

  if (!token) {
    return (
      <Sheet>
        <Section first title={L('Đăng nhập để mở lớp', 'Sign in to open a class')} hint={L('Lớp, mã lớp và bài giao gắn với tài khoản giáo viên — đổi máy vẫn còn.', 'Classes, codes and assignments belong to your teacher account, so they follow you across devices.')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <Button label={L('Đăng nhập', 'Sign in')} variant="brand" iconRight="arrow-right" onPress={() => router.push('/auth/sign-in' as never)} />
            <TextAction label={L('Tôi là học sinh, có mã lớp', "I'm a student with a class code")} icon="arrow-right" onPress={() => router.push('/join' as never)} />
          </View>
        </Section>
      </Sheet>
    );
  }

  const active = (data?.teaching ?? []).filter((c) => !c.archived);
  const archived = (data?.teaching ?? []).filter((c) => c.archived);

  const create = async () => {
    const n = name.replace(/\s+/g, ' ').trim();
    if (!n) {
      setNote({ text: L('Đặt tên lớp trước đã (vd. "IELTS tối thứ 3").', 'Give the class a name first (e.g. "Tuesday evening IELTS").'), tone: 'error' });
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      const res = await classApi<{ class: TeachingClass }>('/api/classes', { token, method: 'POST', body: { name: n } });
      setName('');
      router.push(`/class/${res.class.id}` as never);
    } catch (e) {
      setNote({ text: e instanceof Error ? e.message : String(e), tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const createSheet = (
    <Sheet>
      <Section first n="01" title={L('Mở lớp mới', 'Open a new class')} hint={L('Tên chỉ bạn và học sinh trong lớp thấy.', 'Only you and your students see the name.')}>
        <Field value={name} onChange={setName} placeholder={L('vd. IELTS 6.5 — tối thứ 3', 'e.g. IELTS 6.5 — Tuesday evening')} label={L('Tên lớp', 'Class name')} maxLength={CLASS_NAME_MAX} onSubmit={() => void create()} />
        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <Button label={busy ? L('Đang tạo…', 'Creating…') : L('Tạo lớp & lấy mã', 'Create & get code')} variant="brand" iconRight="arrow-right" disabled={busy || setupNeeded} onPress={() => void create()} />
          <Text className="font-sans" style={{ fontSize: 12, color: P.muted }}>
            {L(`${active.length}/${MAX_ACTIVE_CLASSES_PER_TEACHER} lớp đang mở`, `${active.length}/${MAX_ACTIVE_CLASSES_PER_TEACHER} open classes`)}
          </Text>
        </View>
        {note ? <Note text={note.text} tone={note.tone} /> : null}
      </Section>
      <Section n="02" title={L('Đưa mã cho học sinh', 'Give students the code')} hint={L('Học sinh vào Band 9 → "Vào lớp bằng mã", hoặc mở đường dẫn mời bạn gửi.', 'Students open Band 9 → "Join a class", or tap the invite link you send.')} />
      <Section n="03" title={L('Giao bài, xem tiến độ', 'Assign work, track progress')} hint={L('Bộ từ, chương SAT Math, bộ đề, lượt luyện nói — app tự đánh dấu em nào đã xong.', 'Vocabulary decks, SAT Math chapters, practice sets, speaking sessions — the app marks who has finished.')} />
    </Sheet>
  );

  const list = (
    <View>
      {setupNeeded ? (
        <Sheet>
          <Section first title={L('Lớp học chưa bật trên máy chủ', 'Classes are not enabled on the server yet')} hint={L('Cần chạy migration 20261001000200_classes.sql trên Supabase.', 'The 20261001000200_classes.sql migration needs to run on Supabase.')} />
        </Sheet>
      ) : loadError && !data ? (
        <Sheet>
          <Section first title={L('Không tải được danh sách lớp', "Couldn't load your classes")} hint={loadError}>
            <Button label={L('Thử lại', 'Try again')} variant="outline" iconLeft="refresh" onPress={load} />
          </Section>
        </Sheet>
      ) : !data ? (
        <Note text={L('Đang tải lớp…', 'Loading classes…')} />
      ) : active.length === 0 && archived.length === 0 ? (
        <Sheet>
          <Section first title={L('Chưa có lớp nào', 'No classes yet')} hint={L('Tạo lớp đầu tiên ở bên cạnh — mất chưa tới một phút.', 'Create your first class — it takes under a minute.')} />
        </Sheet>
      ) : (
        <Sheet style={{ paddingHorizontal: 0 }}>
          {active.map((c, i) => (
            <ClassRow key={c.id} c={c} index={i} first={i === 0} />
          ))}
          {active.length === 0 ? (
            <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
              <Text className="font-sans" style={{ fontSize: 14, color: P.muted }}>
                {L('Không có lớp đang mở.', 'No open classes.')}
              </Text>
            </View>
          ) : null}
          {archived.length > 0 ? (
            <View style={{ borderTopWidth: 1, borderColor: P.line, paddingHorizontal: 20, paddingVertical: 8 }}>
              <TextAction label={showArchived ? L(`Ẩn lớp đã lưu trữ (${archived.length})`, `Hide archived (${archived.length})`) : L(`Lớp đã lưu trữ (${archived.length})`, `Archived classes (${archived.length})`)} icon={showArchived ? 'chevron-down' : 'chevron-right'} onPress={() => setShowArchived((v) => !v)} />
            </View>
          ) : null}
          {showArchived ? archived.map((c, i) => <ClassRow key={c.id} c={c} index={i} muted />) : null}
        </Sheet>
      )}
      {data && data.joined.length > 0 ? (
        <Text className="font-sans" style={{ marginTop: 12, fontSize: 13, color: P.muted }}>
          {L(`Bạn cũng đang học ${data.joined.length} lớp — xem ở trang Hôm nay.`, `You're also a student in ${data.joined.length} class${data.joined.length === 1 ? '' : 'es'} — see the Today page.`)}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={{ flexDirection: wide ? 'row' : 'column', gap: 18, alignItems: wide ? 'flex-start' : 'stretch' }}>
      <View style={{ flex: wide ? 1 : undefined, minWidth: 0 }}>
        <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 1.6, color: P.goldDeep, marginBottom: 8 }}>
          {L('LỚP ĐANG MỞ', 'OPEN CLASSES')}
        </Text>
        {list}
      </View>
      <View style={wide ? { width: 380 } : undefined}>{createSheet}</View>
    </View>
  );
}

function ClassRow({ c, index, first, muted }: { c: TeachingClass; index: number; first?: boolean; muted?: boolean }) {
  const { L } = useL();
  const [copied, copy] = useCopy();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: first ? 0 : 1, borderColor: P.line, opacity: muted ? 0.7 : 1 }}>
      <Text className="font-heavy" style={{ width: 28, fontSize: 18, color: P.gold }}>
        {String(index + 1).padStart(2, '0')}
      </Text>
      <Pressable role="link" aria-label={c.name} onPress={() => router.push(`/class/${c.id}` as never)} style={{ flex: 1, minWidth: 0 }}>
        <Text className="font-heavy" numberOfLines={1} style={{ fontSize: 17, color: P.navy }}>
          {c.name}
        </Text>
        <Text className="font-sans" style={{ fontSize: 13, color: P.muted }}>
          {L(`${c.memberCount} học sinh`, `${c.memberCount} student${c.memberCount === 1 ? '' : 's'}`)}
          {c.archived ? L(' · đã lưu trữ', ' · archived') : ''}
        </Text>
      </Pressable>
      <Pressable
        role="button"
        aria-label={L(`Chép mã lớp ${c.code}`, `Copy class code ${c.code}`)}
        onPress={() => copy(c.id, c.code)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: '#C9B78F', backgroundColor: '#FFFFFF' }}
      >
        <Text className="font-heavy" style={{ fontSize: 15, letterSpacing: 2, color: P.navy }}>
          {formatClassCode(c.code)}
        </Text>
        <Icon name={copied === c.id ? 'check' : 'clipboard'} size={15} color={copied === c.id ? P.green : P.gold} />
      </Pressable>
      <Pressable role="link" aria-label={L('Mở lớp', 'Open class')} onPress={() => router.push(`/class/${c.id}` as never)} hitSlop={8}>
        <Icon name="chevron-right" size={18} color={P.muted} />
      </Pressable>
    </View>
  );
}

/* ================================================================ NHẬP FILE (công cụ cũ) */

/**
 * Lớp đang vướng ở đâu — từ bản xuất học sinh gửi.
 *
 * VÌ SAO KHÔNG PHẢI BẢNG ĐIỂM. Bảng điểm nói ai cao ai thấp — thứ giáo viên đã
 * biết trước khi mở app. Cái họ chưa biết là DẠY GÌ VÀO BUỔI SAU, và câu ấy chỉ
 * trả lời được khi thấy chỗ vướng CHUNG: mười tám em cùng chỉ sai đoạn ở dạng
 * câu suy luận là một tiết dạy, còn mười tám em vướng mười tám chỗ khác nhau là
 * mười tám cuộc trò chuyện riêng.
 *
 * KHÔNG CẦN TÀI KHOẢN, KHÔNG CẦN MÁY CHỦ, KHÔNG CÓ TÊN HỌC SINH: bản xuất chỉ
 * mang một mã do chính các em đặt, và không có gì rời khỏi máy ai cả.
 */
function CohortImport() {
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
    <View>
      <Text className="font-heavy" style={{ fontSize: 20, color: P.navy }}>
        {L('Lớp đang vướng ở đâu', 'Where the class is stuck')}
      </Text>
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
    </View>
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
        Thanh trạng thái thay cho một con số phần trăm: một dải vàng dài là cả
        lớp cùng mắc, còn một dải xanh dài kèm vài vạch đỏ là vài em tụt lại.
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
