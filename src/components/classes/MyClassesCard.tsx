import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { P, SHEET_SHADOW, fmtDay } from '@/components/classes/ClassKit';
import { assignmentTitle } from '@/components/classes/assignment-text';
import { useLocalStudentData } from '@/components/classes/useLocalStudentData';
import { assignmentHref, assignmentStatus } from '@/services/classes/assignments';
import { deckWords } from '@/services/classes/catalog';
import { classApi, readPendingCode, type MyClasses } from '@/services/classes/client';
import { formatClassCode, isValidClassCode } from '@/services/classes/code';
import { vnDay } from '@/services/classes/progress';
import { useNow } from '@/lib/clock';
import { useAuthStore } from '@/store/useAuthStore';
import { useL } from '@/i18n/useL';

/**
 * "LỚP CỦA TÔI" trên trang Hôm nay — chỉ hiện khi có gì để nói: học sinh đang ở
 * trong một lớp, hoặc vừa bấm link mời trước khi đăng nhập (còn mã chờ). Liệt kê
 * bài chưa xong (hạn gần nhất trước) kèm đường tới chỗ làm. Trạng thái tính từ
 * dữ liệu trên máy này nên vừa làm xong là bài biến khỏi danh sách.
 */
export function MyClassesCard() {
  const { L, en } = useL();
  const token = useAuthStore((s) => s.session?.access_token ?? null);
  const local = useLocalStudentData();
  const [data, setData] = useState<MyClasses | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let live = true;
    classApi<MyClasses>('/api/classes', { token })
      .then((d) => {
        if (!live) return;
        const p = readPendingCode();
        setPending(p && isValidClassCode(p) ? p : null);
        setData(d);
      })
      .catch(() => undefined); // chưa bật lớp học trên máy chủ, mất mạng… → không hiện thẻ
    return () => {
      live = false;
    };
  }, [token]);

  const today = vnDay(useNow());
  const classes = useMemo(() => (data?.joined ?? []).filter((c) => !c.archived), [data]);
  const todo = useMemo(
    () =>
      classes
        .flatMap((c) => c.assignments.map((a) => ({ c, a, st: assignmentStatus(a, local, { deckWords }) })))
        .filter((x) => x.st.state !== 'done')
        .sort((x, y) => (x.a.due_on ?? '9999').localeCompare(y.a.due_on ?? '9999')),
    [classes, local],
  );

  const pendingNotJoined = pending && token && data;
  if (!token || (!classes.length && !pendingNotJoined)) return null;

  return (
    <View style={[{ marginTop: 16, borderRadius: 22, backgroundColor: P.paper, borderWidth: 1, borderColor: P.line, padding: 18 }, SHEET_SHADOW]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 2, color: P.goldDeep }}>
          {L('LỚP CỦA TÔI', 'MY CLASSES')}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: P.line }} />
      </View>

      {pendingNotJoined ? (
        <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <Text className="font-sans" style={{ flex: 1, minWidth: 200, fontSize: 14, color: P.navy }}>
            {L(`Bạn có mã lớp ${formatClassCode(pending)} đang chờ.`, `You have a class code ${formatClassCode(pending)} waiting.`)}
          </Text>
          <Button size="sm" variant="brand" iconRight="arrow-right" label={L('Vào lớp', 'Join class')} onPress={() => router.push(`/join?ma=${pending}` as never)} />
        </View>
      ) : null}

      {classes.map((c) => {
        const mine = todo.filter((x) => x.c.id === c.id);
        return (
          <View key={c.id} style={{ marginTop: 12 }}>
            <Pressable role="link" onPress={() => router.push(`/class/${c.id}` as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text className="font-heavy" numberOfLines={1} style={{ flexShrink: 1, fontSize: 17, color: P.navy }}>
                {c.name}
              </Text>
              <Text className="font-sans" style={{ fontSize: 13, color: P.muted }}>
                {mine.length ? L(`· ${mine.length} bài chưa xong`, `· ${mine.length} to do`) : c.assignments.length ? L('· đã xong hết bài', '· all done') : L('· chưa có bài giao', '· nothing assigned')}
              </Text>
              <Icon name="chevron-right" size={15} color={P.muted} />
            </Pressable>
            {mine.slice(0, 3).map(({ a }) => {
              const overdue = !!a.due_on && a.due_on < today;
              return (
                <Pressable
                  key={a.id}
                  role="link"
                  onPress={() => router.push(assignmentHref(a.kind, a.ref) as never)}
                  style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: P.line }}
                >
                  <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: overdue ? P.red : P.gold }} />
                  <Text className="font-semi" numberOfLines={1} style={{ flex: 1, fontSize: 14, color: P.navy }}>
                    {assignmentTitle(a, en)}
                  </Text>
                  <Text className="font-sans" style={{ fontSize: 12, color: overdue ? P.red : P.muted }}>
                    {a.due_on ? L(`Hạn ${fmtDay(a.due_on, today)}`, `Due ${fmtDay(a.due_on, today)}`) : ''}
                  </Text>
                  <Icon name="arrow-right" size={14} color={P.gold} />
                </Pressable>
              );
            })}
            {mine.length > 3 ? (
              <Text className="font-sans" style={{ marginTop: 4, fontSize: 12, color: P.muted }}>
                {L(`và ${mine.length - 3} bài nữa`, `and ${mine.length - 3} more`)}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
