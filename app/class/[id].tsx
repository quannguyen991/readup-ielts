import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { CuteNotebook } from '@/components/illust/CuteMore';
import { CheckSquare, DateField, Field, Note, P, PageHead, SHEET_SHADOW, Section, Sheet, StateMark, TextAction, UnderlineTabs, fmtDay, num, useCopy } from '@/components/classes/ClassKit';
import { assignmentTitle, kindLabel } from '@/components/classes/assignment-text';
import { useLocalStudentData } from '@/components/classes/useLocalStudentData';
import { useNow } from '@/lib/clock';
import { SITE_ORIGIN } from '@/lib/site';
import { ASSIGNMENT_KINDS, assignmentHref, assignmentStatus, type Assignment, type AssignmentKind } from '@/services/classes/assignments';
import { KIND_DONE_RULE, catalogOf, deckWords, searchCatalog, type CatalogItem } from '@/services/classes/catalog';
import { classApi, ClassApiError, type MemberProgress, type StudentDetail, type TeacherDetail } from '@/services/classes/client';
import { formatClassCode } from '@/services/classes/code';
import { attentionReasons, sortMembers, vnDay, type SortKey, type StudentSummary } from '@/services/classes/progress';
import { DISPLAY_NAME_MAX } from '@/services/classes/rules';
import { useAuthStore } from '@/store/useAuthStore';
import { useL } from '@/i18n/useL';

type Detail = TeacherDetail | StudentDetail;

/**
 * MỘT LỚP. Giáo viên thấy mã lớp, bài giao, tiến độ từng em và ai cần chú ý;
 * học sinh thấy bài được giao (trạng thái tính từ dữ liệu trên máy mình) và nút
 * rời lớp. Máy chủ quyết định vai (`/api/classes/detail`) — người ngoài lớp nhận 404.
 */
export default function ClassScreen() {
  const { L } = useL();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const status = useAuthStore((s) => s.status);
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<{ text: string; status: number } | null>(null);

  const [tick, setTick] = useState(0);
  const reload = useCallback(async () => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!token || !id) return;
    let live = true;
    classApi<Detail>(`/api/classes/detail?id=${encodeURIComponent(String(id))}`, { token })
      .then((d) => {
        if (!live) return;
        setDetail(d);
        setError(null);
      })
      .catch((e: unknown) => {
        if (live) setError({ text: e instanceof Error ? e.message : String(e), status: e instanceof ClassApiError ? e.status : 0 });
      });
    return () => {
      live = false;
    };
  }, [token, id, tick]);

  const back = (
    <View style={{ marginBottom: 10 }}>
      <TextAction label={L('Lớp học', 'Classes')} icon="chevron-left" onPress={() => router.push('/teacher' as never)} />
    </View>
  );

  if (status === 'loading' || (token && !detail && !error)) {
    return (
      <Screen>
        {back}
        <Note text={L('Đang mở lớp…', 'Opening class…')} />
      </Screen>
    );
  }

  if (!token) {
    return (
      <Screen>
        {back}
        <Sheet>
          <Section first title={L('Đăng nhập để xem lớp', 'Sign in to see this class')} hint={L('Lớp học gắn với tài khoản của bạn.', 'Classes belong to your account.')}>
            <Button label={L('Đăng nhập', 'Sign in')} variant="brand" iconRight="arrow-right" onPress={() => router.push('/auth/sign-in' as never)} />
          </Section>
        </Sheet>
      </Screen>
    );
  }

  if (error || !detail) {
    return (
      <Screen>
        {back}
        <Sheet>
          <Section first title={error?.status === 404 ? L('Không tìm thấy lớp', 'Class not found') : L('Không mở được lớp', "Couldn't open the class")} hint={error?.text}>
            {error?.status === 404 ? null : <Button label={L('Thử lại', 'Try again')} variant="outline" iconLeft="refresh" onPress={() => void reload()} />}
          </Section>
        </Sheet>
      </Screen>
    );
  }

  return (
    <Screen>
      {back}
      {detail.role === 'teacher' ? <TeacherClass d={detail} token={token} reload={reload} /> : <StudentClass d={detail} token={token} reload={reload} />}
    </Screen>
  );
}

/* ================================================================ GIÁO VIÊN */

function TeacherClass({ d, token, reload }: { d: TeacherDetail; token: string; reload: () => Promise<void> }) {
  const { L } = useL();
  const { width } = useWindowDimensions();
  const wide = width >= 1100;
  const n = d.members.length;

  const ticket = <CodeTicket d={d} token={token} reload={reload} />;
  const assignments = <AssignmentsSheet d={d} token={token} reload={reload} />;
  const attention = <Attention members={d.members} />;
  const progress = <Progress d={d} token={token} reload={reload} />;

  return (
    <View>
      <Appear>
        <PageHead
          kicker={L(`SỔ LỚP · ${n} HỌC SINH`, `CLASS REGISTER · ${n} STUDENT${n === 1 ? '' : 'S'}`)}
          title={d.class.name}
          subtitle={d.class.archived ? L('Lớp đã lưu trữ — học sinh không vào thêm được bằng mã.', 'Archived — new students cannot join with the code.') : undefined}
          art={<CuteNotebook size={68} />}
        />
      </Appear>
      {wide ? (
        <View style={{ marginTop: 18, flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
          <View style={{ flex: 1, minWidth: 0, gap: 18 }}>
            {attention}
            {progress}
          </View>
          <View style={{ width: 360, gap: 18 }}>
            {ticket}
            {assignments}
          </View>
        </View>
      ) : (
        <View style={{ marginTop: 18, gap: 16 }}>
          {ticket}
          {attention}
          {assignments}
          {progress}
        </View>
      )}
    </View>
  );
}

function joinLink(code: string): string {
  const origin = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : SITE_ORIGIN;
  return `${origin}/join?ma=${code}`;
}

/** Cuống vé xanh đậm: mã lớp to, chép mã / chép đường dẫn mời, quản lý lớp. */
function CodeTicket({ d, token, reload }: { d: TeacherDetail; token: string; reload: () => Promise<void> }) {
  const { L } = useL();
  const [copied, copy] = useCopy();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const link = joinLink(d.class.code);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setNote(null);
    try {
      await fn();
    } catch (e) {
      setNote(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const share = () => {
    const text = L(`Vào lớp "${d.class.name}" trên Band 9 — mã lớp ${d.class.code}:`, `Join "${d.class.name}" on Band 9 — class code ${d.class.code}:`);
    const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (x: { text: string; url: string }) => Promise<void> }) : null;
    if (Platform.OS === 'web' && nav?.share) void nav.share({ text, url: link }).catch(() => undefined);
    else copy('link', `${text} ${link}`);
  };

  return (
    <View style={{ borderRadius: 22, backgroundColor: P.navy, overflow: 'hidden' }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(226,200,143,0.35)' }} />
      <View style={{ padding: 22, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text className="font-heavy" style={{ fontSize: 13, letterSpacing: 2.4, color: P.goldLight }}>
            BAND 9
          </Text>
          <Text className="font-strong" style={{ fontSize: 11, letterSpacing: 1.6, color: 'rgba(255,255,255,0.55)' }}>
            {L('VÉ VÀO LỚP', 'CLASS PASS')}
          </Text>
        </View>
        <Text className="font-strong" style={{ marginTop: 18, fontSize: 11, letterSpacing: 1.6, color: 'rgba(255,255,255,0.55)' }}>
          {L('MÃ LỚP', 'CLASS CODE')}
        </Text>
        <Text selectable className="font-heavy" style={{ fontSize: 40, lineHeight: 48, letterSpacing: 6, color: P.goldLight }}>
          {formatClassCode(d.class.code)}
        </Text>
        <Text className="font-sans" style={{ marginTop: 4, fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.72)' }}>
          {L('Học sinh mở Band 9 → "Vào lớp bằng mã", gõ mã này. Hoặc gửi đường dẫn mời:', 'Students open Band 9 → "Join a class" and type this code. Or send the invite link:')}
        </Text>
        <Text selectable numberOfLines={1} className="font-sans" style={{ marginTop: 8, fontSize: 13, color: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)' }}>
          {link}
        </Text>
        <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Button size="sm" variant="onDarkSolid" iconLeft={copied === 'code' ? 'check' : 'clipboard'} label={copied === 'code' ? L('Đã chép mã', 'Code copied') : L('Chép mã', 'Copy code')} onPress={() => copy('code', d.class.code)} />
          <Button size="sm" variant="onDark" iconLeft={copied === 'link' ? 'check' : 'external'} label={copied === 'link' ? L('Đã chép lời mời', 'Invite copied') : L('Gửi lời mời', 'Send invite')} onPress={share} />
        </View>
      </View>

      <View style={{ height: 24, justifyContent: 'center' }}>
        <View style={{ marginHorizontal: 20, borderTopWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.18)' }} />
        <View style={{ position: 'absolute', left: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: P.canvas }} />
        <View style={{ position: 'absolute', right: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: P.canvas }} />
      </View>

      <View style={{ paddingHorizontal: 22, paddingBottom: 18, paddingTop: 6 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16 }}>
          <TextAction
            tone="light"
            icon={d.class.archived ? 'refresh' : 'lock'}
            disabled={busy}
            label={d.class.archived ? L('Mở lại lớp', 'Reopen class') : L('Lưu trữ lớp', 'Archive class')}
            onPress={() => void act(async () => {
              await classApi('/api/classes', { token, method: 'PATCH', body: { id: d.class.id, archived: !d.class.archived } });
              await reload();
            })}
          />
          <TextAction
            tone="light"
            icon="close"
            disabled={busy}
            label={confirmDelete ? L('Bấm lần nữa để xoá hẳn', 'Tap again to delete for good') : L('Xoá lớp', 'Delete class')}
            onPress={() => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                return;
              }
              void act(async () => {
                await classApi('/api/classes', { token, method: 'DELETE', body: { id: d.class.id } });
                router.replace('/teacher' as never);
              });
            }}
          />
        </View>
        {confirmDelete ? (
          <Text className="font-sans" style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
            {L('Xoá lớp là xoá cả danh sách học sinh và bài giao. Dữ liệu học của các em vẫn nguyên.', "Deleting removes the roster and assignments. Students' own study data is untouched.")}
          </Text>
        ) : null}
        {note ? (
          <Text role="alert" className="font-sans" style={{ marginTop: 6, fontSize: 13, color: '#F6C9BD' }}>
            {note}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/* ---------------------------------------------------------------- cần chú ý */

function reasonText(s: StudentSummary, L: (vi: string, en: string) => string): string[] {
  return attentionReasons(s).map((r) => {
    if (r === 'no_data') return L('chưa thấy dữ liệu học (em chưa đăng nhập trên máy đang học?)', 'no study data yet (not signed in on the device they use?)');
    if (r === 'inactive') return s.daysInactive === null ? L('chưa thấy buổi học nào', 'no study sessions seen yet') : L(`${s.daysInactive} ngày chưa học`, `${s.daysInactive} days without study`);
    return L(`${s.assignments.overdue} bài quá hạn`, `${s.assignments.overdue} overdue`);
  });
}

function Attention({ members }: { members: MemberProgress[] }) {
  const { L } = useL();
  if (members.length === 0) return null;
  const flagged = members.map((m) => ({ m, reasons: reasonText(m.summary, L) })).filter((x) => x.reasons.length > 0);

  return (
    <View style={[{ borderRadius: 18, backgroundColor: flagged.length ? '#FFF8EC' : P.paper, borderWidth: 1, borderColor: flagged.length ? '#E9C98C' : P.line, padding: 18 }, SHEET_SHADOW]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: flagged.length ? P.amber : P.green }}>
          <Icon name={flagged.length ? 'bell' : 'check'} size={16} color="#FFFFFF" />
        </View>
        <Text className="font-heavy" style={{ flex: 1, fontSize: 17, color: P.navy }}>
          {flagged.length
            ? L(`Cần chú ý · ${flagged.length} em`, `Needs attention · ${flagged.length}`)
            : L('Cả lớp đang học đều, chưa có bài quá hạn', 'Everyone is studying regularly, nothing overdue')}
        </Text>
      </View>
      {flagged.length ? (
        <View style={{ marginTop: 10, gap: 6 }}>
          {flagged.slice(0, 12).map(({ m, reasons }) => (
            <View key={m.userId} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'baseline' }}>
              <Text className="font-strong" style={{ fontSize: 14, color: P.navy }}>
                {m.displayName}
              </Text>
              <Text className="font-sans" style={{ fontSize: 13, color: P.muted, flexShrink: 1 }}>
                — {reasons.join(' · ')}
              </Text>
            </View>
          ))}
          {flagged.length > 12 ? <Note text={L(`và ${flagged.length - 12} em nữa — xem bảng bên dưới.`, `and ${flagged.length - 12} more — see the table below.`)} /> : null}
        </View>
      ) : null}
    </View>
  );
}

/* ---------------------------------------------------------------- bài giao */

function AssignmentsSheet({ d, token, reload }: { d: TeacherDetail; token: string; reload: () => Promise<void> }) {
  const { L, en } = useL();
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const today = vnDay(useNow());

  const remove = async (a: Assignment) => {
    if (confirm !== a.id) {
      setConfirm(a.id);
      return;
    }
    setNote(null);
    try {
      await classApi('/api/classes/assignments', { token, method: 'DELETE', body: { id: a.id } });
      setConfirm(null);
      await reload();
    } catch (e) {
      setNote(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Sheet>
      <Section
        first
        title={L('Bài đã giao', 'Assignments')}
        hint={d.assignments.length ? L(`${d.assignments.length} bài · app tự đánh dấu em nào xong`, `${d.assignments.length} · the app marks who has finished`) : L('Chưa giao bài nào.', 'Nothing assigned yet.')}
        right={!adding ? <Button size="sm" variant="brand" iconLeft="plus" label={L('Giao bài', 'Assign')} onPress={() => setAdding(true)} /> : null}
      >
        {adding ? (
          <AssignPicker
            classId={d.class.id}
            token={token}
            onDone={async () => {
              setAdding(false);
              await reload();
            }}
            onCancel={() => setAdding(false)}
          />
        ) : null}
        {d.assignments.length ? (
          <View style={{ marginTop: adding ? 14 : 0 }}>
            {d.assignments.map((a, i) => {
              const done = d.members.filter((m) => m.summary.statuses[a.id]?.state === 'done').length;
              const overdue = !!a.due_on && a.due_on < today;
              return (
                <View key={a.id} style={{ paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderColor: P.line }}>
                  <Text className="font-strong" style={{ fontSize: 11, letterSpacing: 1.2, color: P.goldDeep }}>
                    {kindLabel(a.kind, en).toUpperCase()}
                  </Text>
                  <Text className="font-heavy" style={{ marginTop: 2, fontSize: 15, lineHeight: 21, color: P.navy }}>
                    {assignmentTitle(a, en)}
                  </Text>
                  <View style={{ marginTop: 4, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 2 }}>
                    <Text className="font-semi" style={{ fontSize: 13, color: d.members.length && done === d.members.length ? P.green : P.navy }}>
                      {L(`${done}/${d.members.length} em xong`, `${done}/${d.members.length} done`)}
                    </Text>
                    <Text className="font-sans" style={{ fontSize: 13, color: overdue ? P.red : P.muted }}>
                      {a.due_on ? L(`Hạn ${fmtDay(a.due_on, today)}`, `Due ${fmtDay(a.due_on, today)}`) : L('Không hạn', 'No due date')}
                    </Text>
                    <TextAction tone="red" label={confirm === a.id ? L('Bấm lần nữa để gỡ', 'Tap again to remove') : L('Gỡ', 'Remove')} onPress={() => void remove(a)} />
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
        {note ? <Note text={note} tone="error" /> : null}
      </Section>
    </Sheet>
  );
}

/** Bộ chọn bài: loại bài → nội dung có thật trong app → hạn nộp (tuỳ chọn). */
function AssignPicker({ classId, token, onDone, onCancel }: { classId: string; token: string; onDone: () => Promise<void>; onCancel: () => void }) {
  const { L, en } = useL();
  const [kind, setKind] = useState<AssignmentKind>('vocab_deck');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<CatalogItem | null>(null);
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const today = vnDay(useNow());

  const items = useMemo(() => searchCatalog(kind, query), [kind, query]);
  const shown = items.slice(0, 120);

  const submit = async () => {
    if (!picked) {
      setNote(L('Chọn một nội dung trong danh sách trước.', 'Pick something from the list first.'));
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      await classApi('/api/classes/assignments', { token, method: 'POST', body: { classId, kind: picked.kind, ref: picked.ref, dueOn: due || null } });
      await onDone();
    } catch (e) {
      setNote(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  const label = (b: { vi: string; en: string }) => (en ? b.en : b.vi);

  return (
    <View style={{ borderRadius: 14, borderWidth: 1, borderColor: P.line, backgroundColor: '#FFFFFF', paddingHorizontal: 14 }}>
      <View style={{ paddingVertical: 12 }}>
        <Text className="font-heavy" style={{ fontSize: 12, letterSpacing: 1.4, color: P.gold }}>
          {L('01 · LOẠI BÀI', '01 · TYPE')}
        </Text>
        <View role="radiogroup" style={{ marginTop: 6 }}>
          {ASSIGNMENT_KINDS.map((k) => {
            const on = k === kind;
            return (
              <Pressable
                key={k}
                role="radio"
                aria-checked={on}
                onPress={() => {
                  setKind(k);
                  setPicked(null);
                  setQuery('');
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 }}
              >
                <CheckSquare on={on} round />
                <Text className={on ? 'font-heavy' : 'font-semi'} style={{ fontSize: 14, color: P.navy }}>
                  {kindLabel(k, en)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="font-sans" style={{ marginTop: 4, fontSize: 12, lineHeight: 17, color: P.muted }}>
          {label(KIND_DONE_RULE[kind])}
        </Text>
      </View>

      <View style={{ paddingVertical: 12, borderTopWidth: 1, borderColor: P.line }}>
        <Text className="font-heavy" style={{ fontSize: 12, letterSpacing: 1.4, color: P.gold }}>
          {L('02 · NỘI DUNG', '02 · CONTENT')}
        </Text>
        {catalogOf(kind).length > 8 ? (
          <View style={{ marginTop: 8 }}>
            <Field value={query} onChange={setQuery} placeholder={L('Tìm theo tên…', 'Search by name…')} label={L('Tìm nội dung', 'Search content')} />
          </View>
        ) : null}
        <ScrollView style={{ marginTop: 8, maxHeight: 280 }} nestedScrollEnabled>
          {shown.length === 0 ? <Note text={L('Không có nội dung khớp.', 'Nothing matches.')} /> : null}
          {shown.map((it, i) => {
            const on = picked?.ref === it.ref && picked.kind === it.kind;
            const newGroup = i === 0 || shown[i - 1]!.group.vi !== it.group.vi;
            return (
              <View key={`${it.kind}:${it.ref}`}>
                {newGroup ? (
                  <Text className="font-strong" style={{ marginTop: i === 0 ? 0 : 10, marginBottom: 2, fontSize: 11, letterSpacing: 1, color: P.muted }}>
                    {label(it.group).toUpperCase()}
                  </Text>
                ) : null}
                <Pressable role="radio" aria-checked={on} onPress={() => setPicked(it)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 7, paddingHorizontal: 6, borderRadius: 8, backgroundColor: on ? '#FBF5E8' : 'transparent' }}>
                  <View style={{ marginTop: 1 }}>
                    <CheckSquare on={on} round />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text className={on ? 'font-heavy' : 'font-sans'} style={{ fontSize: 14, lineHeight: 20, color: P.navy }}>
                      {label(it.title)}
                    </Text>
                    {it.kind === 'vocab_deck' ? (
                      <Text className="font-sans" style={{ fontSize: 12, color: P.muted }}>
                        {L(`${deckWords(it.ref)?.length ?? 0} từ`, `${deckWords(it.ref)?.length ?? 0} words`)}
                      </Text>
                    ) : null}
                    {it.note ? (
                      <Text className="font-sans" style={{ fontSize: 12, color: P.amber }}>
                        {label(it.note)}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              </View>
            );
          })}
          {items.length > shown.length ? <Note text={L(`Còn ${items.length - shown.length} mục — gõ để tìm.`, `${items.length - shown.length} more — type to search.`)} /> : null}
        </ScrollView>
      </View>

      <View style={{ paddingVertical: 12, borderTopWidth: 1, borderColor: P.line }}>
        <Text className="font-heavy" style={{ fontSize: 12, letterSpacing: 1.4, color: P.gold }}>
          {L('03 · HẠN NỘP (TUỲ CHỌN)', '03 · DUE DATE (OPTIONAL)')}
        </Text>
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <DateField value={due} min={today} onChange={setDue} label={L('Hạn nộp', 'Due date')} />
          {due ? <TextAction label={L('Bỏ hạn', 'No due date')} onPress={() => setDue('')} /> : null}
        </View>
      </View>

      <View style={{ paddingVertical: 12, borderTopWidth: 1, borderColor: P.line, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <Button label={busy ? L('Đang giao…', 'Assigning…') : L('Giao cho cả lớp', 'Assign to class')} variant="brand" iconRight="arrow-right" disabled={busy || !picked} onPress={() => void submit()} />
        <TextAction label={L('Huỷ', 'Cancel')} onPress={onCancel} />
      </View>
      {note ? (
        <View style={{ paddingBottom: 10 }}>
          <Note text={note} tone="error" />
        </View>
      ) : null}
    </View>
  );
}

/* ---------------------------------------------------------------- tiến độ */

function lastActiveText(s: StudentSummary, L: (vi: string, en: string) => string): string {
  if (s.daysInactive === null) return '—';
  if (s.daysInactive === 0) return L('Hôm nay', 'Today');
  if (s.daysInactive === 1) return L('Hôm qua', 'Yesterday');
  return L(`${s.daysInactive} ngày trước`, `${s.daysInactive} days ago`);
}

function Progress({ d, token, reload }: { d: TeacherDetail; token: string; reload: () => Promise<void> }) {
  const { L } = useL();
  const { width } = useWindowDimensions();
  const table = width >= 1180;
  const [sort, setSort] = useState<SortKey>('lastActive');
  const [open, setOpen] = useState<string | null>(null);
  const rows = useMemo(() => sortMembers(d.members, sort), [d.members, sort]);

  return (
    <Sheet>
      <Section first title={L('Tiến độ từng em', 'Progress by student')} hint={L('Số đếm từ dữ liệu các em đã đồng bộ (đăng nhập là tự đồng bộ). "—" là app chưa thấy dữ liệu, không phải 0.', "Counts from each student's synced data (signing in syncs automatically). \"—\" means no data seen yet, not zero.")}>
        {d.members.length === 0 ? (
          <Text className="font-sans" style={{ fontSize: 14, lineHeight: 21, color: P.muted }}>
            {L(`Chưa có học sinh nào. Đưa mã ${formatClassCode(d.class.code)} cho lớp để các em vào.`, `No students yet. Give the class the code ${formatClassCode(d.class.code)}.`)}
          </Text>
        ) : (
          <View>
            <UnderlineTabs
              value={sort}
              onChange={setSort}
              items={[
                { key: 'lastActive', label: L('Học gần nhất', 'Most recent') },
                { key: 'name', label: L('Tên', 'Name') },
                { key: 'assignments', label: L('Bài đã xong', 'Assignments done') },
              ]}
            />
            {table ? <TableHead /> : null}
            {rows.map((m, i) => (
              <MemberRow key={m.userId} m={m} d={d} table={table} first={i === 0 && !table} open={open === m.userId} onToggle={() => setOpen(open === m.userId ? null : m.userId)} token={token} reload={reload} />
            ))}
          </View>
        )}
      </Section>
    </Sheet>
  );
}

const COLS: { key: string; vi: string; en: string; flex: number }[] = [
  { key: 'name', vi: 'Học sinh', en: 'Student', flex: 2.8 },
  { key: 'last', vi: 'Học gần nhất', en: 'Last active', flex: 1.3 },
  { key: 'streak', vi: 'Chuỗi ngày', en: 'Streak', flex: 0.9 },
  { key: 'min', vi: 'Phút · 7 ngày', en: 'Min · 7d', flex: 1 },
  { key: 'q', vi: 'Câu · 7 ngày', en: 'Qs · 7d', flex: 1 },
  { key: 'rev', vi: 'Lượt ôn từ · 7 ngày', en: 'Word reviews · 7d', flex: 1.2 },
  { key: 'learned', vi: 'Từ đã nhớ', en: 'Words learned', flex: 1 },
  { key: 'asg', vi: 'Bài xong', en: 'Done', flex: 0.9 },
];

function TableHead() {
  const { L } = useL();
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderColor: P.line }}>
      {COLS.map((c) => (
        <Text key={c.key} className="font-strong" style={{ flex: c.flex, fontSize: 11, letterSpacing: 0.6, color: P.muted }}>
          {L(c.vi, c.en).toUpperCase()}
        </Text>
      ))}
    </View>
  );
}

function MemberRow({ m, d, table, first, open, onToggle, token, reload }: { m: MemberProgress; d: TeacherDetail; table: boolean; first: boolean; open: boolean; onToggle: () => void; token: string; reload: () => Promise<void> }) {
  const { L } = useL();
  const s = m.summary;
  const flagged = attentionReasons(s).length > 0;
  // Chưa thấy dữ liệu thì không nói "0/2" — app không biết em đã làm hay chưa.
  const asg = s.synced && s.assignments.total ? `${s.assignments.done}/${s.assignments.total}` : '—';
  const values = [lastActiveText(s, L), num(s.streak), num(s.minutes7), num(s.questions7), num(s.wordsReviewed7), num(s.wordsLearned), asg];

  const name = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }}>
      {flagged ? <View aria-label={L('Cần chú ý', 'Needs attention')} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: P.amber }} /> : null}
      <Text className="font-heavy" numberOfLines={1} style={{ fontSize: 15, color: P.navy, flexShrink: 1 }}>
        {m.displayName}
      </Text>
      <Icon name={open ? 'chevron-down' : 'chevron-right'} size={14} color={P.muted} />
    </View>
  );

  return (
    <View style={{ borderTopWidth: first ? 0 : table ? 0 : 1, borderBottomWidth: table ? 1 : 0, borderColor: P.line }}>
      <Pressable role="button" aria-expanded={open} aria-label={m.displayName} onPress={onToggle}>
        {table ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 12 }}>
            <View style={{ flex: COLS[0]!.flex, minWidth: 0 }}>{name}</View>
            {values.map((v, i) => (
              <Text key={COLS[i + 1]!.key} className="font-semi" style={{ flex: COLS[i + 1]!.flex, fontSize: 14, color: v === '—' ? '#B7AC95' : P.navy }}>
                {v}
              </Text>
            ))}
          </View>
        ) : (
          <View style={{ paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1, minWidth: 0 }}>{name}</View>
              <Text className="font-semi" style={{ fontSize: 13, color: P.muted }}>
                {lastActiveText(s, L)}
              </Text>
            </View>
            <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 }}>
              {COLS.slice(2).map((c, i) => (
                <View key={c.key} style={{ width: '33.33%', paddingRight: 6 }}>
                  <Text className="font-sans" style={{ fontSize: 11, color: P.muted }} numberOfLines={1}>
                    {L(c.vi, c.en)}
                  </Text>
                  <Text className="font-heavy" style={{ fontSize: 16, color: values[i + 1] === '—' ? '#B7AC95' : P.navy }}>
                    {values[i + 1]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Pressable>
      {open ? <MemberDetail m={m} d={d} token={token} reload={reload} /> : null}
    </View>
  );
}

function MemberDetail({ m, d, token, reload }: { m: MemberProgress; d: TeacherDetail; token: string; reload: () => Promise<void> }) {
  const { L, en } = useL();
  const [confirm, setConfirm] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const today = vnDay(useNow());
  const reasons = reasonText(m.summary, L);

  const removeMember = async () => {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    try {
      await classApi('/api/classes/members', { token, method: 'DELETE', body: { classId: d.class.id, userId: m.userId } });
      await reload();
    } catch (e) {
      setNote(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <View style={{ marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: '#FBF7EE', gap: 8 }}>
      <Text className="font-sans" style={{ fontSize: 12, color: P.muted }}>
        {L(`Vào lớp ${fmtDay(m.joinedAt.slice(0, 10), today)}`, `Joined ${fmtDay(m.joinedAt.slice(0, 10), today)}`)}
        {m.summary.lastActive ? L(` · học gần nhất ${fmtDay(m.summary.lastActive, today)}`, ` · last active ${fmtDay(m.summary.lastActive, today)}`) : ''}
        {reasons.length ? ` · ${reasons.join(' · ')}` : ''}
      </Text>
      {d.assignments.length === 0 ? (
        <Text className="font-sans" style={{ fontSize: 13, color: P.muted }}>
          {L('Lớp chưa có bài giao.', 'No assignments yet.')}
        </Text>
      ) : (
        d.assignments.map((a) => {
          const st = m.summary.statuses[a.id] ?? { state: 'unknown' as const };
          return (
            <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <StateMark state={st.state} compact />
              <Text className="font-sans" numberOfLines={2} style={{ flex: 1, fontSize: 13, color: P.navy }}>
                {assignmentTitle(a, en)}
                {st.have !== undefined && st.need !== undefined && st.state !== 'done' ? L(` · nhớ ${st.have}/${st.need} từ`, ` · ${st.have}/${st.need} words learned`) : ''}
              </Text>
            </View>
          );
        })
      )}
      <TextAction tone="red" icon="close" label={confirm ? L('Bấm lần nữa để mời em ra khỏi lớp', 'Tap again to remove from class') : L('Mời ra khỏi lớp', 'Remove from class')} onPress={() => void removeMember()} />
      {note ? <Note text={note} tone="error" /> : null}
    </View>
  );
}

/* ================================================================ HỌC SINH */

function StudentClass({ d, token, reload }: { d: StudentDetail; token: string; reload: () => Promise<void> }) {
  const { L, en } = useL();
  const local = useLocalStudentData();
  const today = vnDay(useNow());
  const [name, setName] = useState(d.me.displayName);
  const [note, setNote] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const saveName = async () => {
    setNote(null);
    try {
      await classApi('/api/classes/members', { token, method: 'PATCH', body: { classId: d.class.id, displayName: name } });
      setNote({ text: L('Đã lưu tên.', 'Name saved.'), tone: 'ok' });
      await reload();
    } catch (e) {
      setNote({ text: e instanceof Error ? e.message : String(e), tone: 'error' });
    }
  };

  const leave = async () => {
    if (!confirmLeave) {
      setConfirmLeave(true);
      return;
    }
    try {
      await classApi('/api/classes/members', { token, method: 'DELETE', body: { classId: d.class.id } });
      router.replace('/dashboard' as never);
    } catch (e) {
      setNote({ text: e instanceof Error ? e.message : String(e), tone: 'error' });
    }
  };

  const rows = d.assignments.map((a) => ({ a, st: assignmentStatus(a, local, { deckWords }) }));
  const doneCount = rows.filter((r) => r.st.state === 'done').length;

  return (
    <View>
      <Appear>
        <PageHead
          kicker={L('LỚP CỦA TÔI', 'MY CLASS')}
          title={d.class.name}
          subtitle={d.class.teacherName ? L(`Giáo viên: ${d.class.teacherName}`, `Teacher: ${d.class.teacherName}`) : undefined}
          art={<CuteNotebook size={68} />}
        />
      </Appear>
      <View style={{ marginTop: 18, gap: 16 }}>
        <Sheet>
          <Section first title={L('Bài được giao', 'Assignments')} hint={rows.length ? L(`Xong ${doneCount}/${rows.length} — tính từ dữ liệu trên máy này.`, `${doneCount}/${rows.length} done — counted from this device.`) : L('Giáo viên chưa giao bài nào.', 'Your teacher has not assigned anything yet.')}>
            {rows.map(({ a, st }, i) => {
              const overdue = !!a.due_on && a.due_on < today && st.state !== 'done';
              return (
                <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderColor: P.line }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text className="font-strong" style={{ fontSize: 11, letterSpacing: 1.2, color: P.goldDeep }}>
                      {kindLabel(a.kind, en).toUpperCase()}
                    </Text>
                    <Text className="font-heavy" style={{ marginTop: 2, fontSize: 15, lineHeight: 21, color: P.navy }}>
                      {assignmentTitle(a, en)}
                    </Text>
                    <View style={{ marginTop: 4, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                      <StateMark state={st.state} compact />
                      {st.have !== undefined && st.need !== undefined && st.state !== 'done' ? (
                        <Text className="font-sans" style={{ fontSize: 12, color: P.muted }}>
                          {L(`nhớ ${st.have}/${st.need} từ`, `${st.have}/${st.need} words learned`)}
                        </Text>
                      ) : null}
                      <Text className="font-sans" style={{ fontSize: 12, color: overdue ? P.red : P.muted }}>
                        {a.due_on ? L(`Hạn ${fmtDay(a.due_on, today)}`, `Due ${fmtDay(a.due_on, today)}`) : L('Không hạn', 'No due date')}
                      </Text>
                    </View>
                  </View>
                  {st.state !== 'done' ? <Button size="sm" variant="brandOutline" label={L('Làm bài', 'Start')} iconRight="arrow-right" onPress={() => router.push(assignmentHref(a.kind, a.ref) as never)} /> : null}
                </View>
              );
            })}
          </Section>
        </Sheet>

        <Sheet>
          <Section first title={L('Tên của bạn trong lớp', 'Your name in this class')} hint={L('Giáo viên thấy tên này, thời gian học, chuỗi ngày, số từ và bài đã xong — không thấy email hay bài làm của bạn.', 'Your teacher sees this name, study time, streak, word counts and finished assignments — never your email or your actual answers.')}>
            <Field value={name} onChange={setName} label={L('Tên trong lớp', 'Name in class')} maxLength={DISPLAY_NAME_MAX} onSubmit={() => void saveName()} />
            <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
              <Button size="sm" variant="brandOutline" label={L('Lưu tên', 'Save name')} disabled={!name.trim() || name.trim() === d.me.displayName} onPress={() => void saveName()} />
              <TextAction tone="red" icon="close" label={confirmLeave ? L('Bấm lần nữa để rời lớp', 'Tap again to leave') : L('Rời lớp', 'Leave class')} onPress={() => void leave()} />
            </View>
            {note ? <Note text={note.text} tone={note.tone} /> : null}
          </Section>
        </Sheet>
      </View>
    </View>
  );
}
