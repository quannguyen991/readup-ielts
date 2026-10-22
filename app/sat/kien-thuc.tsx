import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { MindMap } from '@/components/illust/MindMap';
import { Badge, CuteBook, CuteClock, CuteGlobe, CutePencil } from '@/components/illust/Cute';
import { CuteBulb, CuteCalculator, CuteChat, CuteMagnifier, CuteNotebook, CuteRocket, CuteStar, CuteTrophy, Motion, Sparkles } from '@/components/illust/CuteMore';
import { SAT_DOMAINS, SAT_FACTS, SAT_SECTIONS, SAT_STRATEGY, type Domain } from '@/data/sat-knowledge';
import {
  SAT_5_STEP_METHOD,
  SAT_CONTEXT_CLUES,
  SAT_TRANSITION_GROUPS,
  SAT_DESMOS_TECHNIQUES,
  SAT_RW_16_WEEK_ROADMAP,
  SAT_MATH_20_WEEK_ROADMAP,
  SAT_BOOK_CATALOG,
} from '@/data/sat-methods';
import { useL } from '@/i18n/useL';

/** Bản tiếng Anh của bốn ô số liệu đầu trang (dữ liệu gốc `SAT_FACTS` giữ tiếng Việt), theo thứ tự. */
const FACTS_EN: readonly { k: string; v: string; d: string }[] = [
  { k: 'Total time', v: '2 h 14 min', d: 'Reading & Writing 64 min + 10-min break + Math 70 min.' },
  { k: 'Score scale', v: '400 – 1600', d: "Each section 200 – 800. No penalty for wrong answers — don't leave anything blank." },
  { k: 'Module-adaptive', v: 'Module 2 changes difficulty', d: 'Do well on module 1 and module 2 gets harder, unlocking the top scores; module 1 matters most.' },
  { k: 'Pretest questions', v: '4 per section', d: "Unscored and unmarked — answer them all like real questions." },
];

const SECTION_EN: Record<string, string> = { rw: 'Reading and Writing', math: 'Math' };

/** "13–15 câu" → "13–15 questions" khi giao diện tiếng Anh. */
function questionsLabel(q: string, en: boolean): string {
  return en ? q.replace(/ câu$/, ' questions') : q;
}

/**
 * KIẾN THỨC SAT — toàn bộ lý thuyết SAT trong MỘT khung (người dùng yêu cầu
 * 30/09/2026: "bổ sung kiến thức, lý thuyết các phần cho vào 1 khung, thiết kế
 * mạch lạc, rõ ràng", làm SAT trước).
 *
 * Bố cục (30/09, theo mẫu The IELTS Dictionary): mỗi phần một KHỐI LỚN xếp
 * dần xuống, không dồn vào tab — khối đầu, sơ đồ tư duy tổng (8 mảng quanh
 * "Digital SAT"), cấu trúc đề, dải "Toán." rồi từng mảng (sơ đồ các bài bấm
 * được + cốt lõi / cần thuộc / bẫy), dải "Đọc & Viết.", chiến lược.
 * Dữ liệu: `src/data/sat-knowledge.ts` (có test đối chiếu số câu, tỉ trọng, link).
 */

const INK = '#0F172A';
const MUTED = '#64748B';
const LINE = '#F3F0FB';

export default function SatKnowledge() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const math = SAT_DOMAINS.filter((d) => d.section === 'math');
  const rw = SAT_DOMAINS.filter((d) => d.section === 'rw');
  const { L, en } = useL();

  return (
    <Screen>
      {/* ------------------------------------------------ khối đầu */}
      <Appear>
        <View style={{ borderRadius: 28, padding: wide ? 32 : 20, backgroundColor: '#6A4BD9', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -60, top: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.10)' }} />
          <Sparkles count={7} />
          {wide ? (
            <View aria-hidden style={{ position: 'absolute', right: 28, top: 24, flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
              <Motion kind="float" delay={0.4}>
                <CuteGlobe size={70} />
              </Motion>
              <Motion kind="float">
                <CuteBook size={96} />
              </Motion>
              <Motion kind="wobble" delay={0.2}>
                <CutePencil size={70} />
              </Motion>
            </View>
          ) : null}
          <Text className="font-strong" style={{ fontSize: 13, letterSpacing: 2, color: 'rgba(255,255,255,0.85)' }}>
            {L('KIẾN THỨC SAT · DIGITAL SAT', 'SAT KNOWLEDGE · DIGITAL SAT')}
          </Text>
          <Text className="font-heavy" style={{ marginTop: 8, fontSize: wide ? 44 : 30, lineHeight: wide ? 50 : 36, color: '#FFFFFF' }}>
            {L('Toàn bộ SAT trong một khung.', 'The whole SAT in one frame.')}
          </Text>
          <Text className="font-sans" style={{ marginTop: 8, fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.88)', maxWidth: 620 }}>
            {L('Cấu trúc đề · 8 mảng · công thức · bẫy hay gặp.', 'Test structure · 8 domains · formulas · common traps.')}
          </Text>
          <View style={{ marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {SAT_FACTS.map((f, i) => {
              const Icon = FACT_ICONS[i % FACT_ICONS.length]!;
              const fact = en ? (FACTS_EN[i] ?? f) : f;
              return (
                <View key={f.k} accessibilityLabel={`${fact.k}: ${fact.v}. ${fact.d}`} style={{ flexGrow: 1, flexBasis: wide ? 200 : 150, borderRadius: 20, padding: 14, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Motion kind="float" delay={i * 0.35}>
                    <Icon size={48} />
                  </Motion>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text className="font-semi" style={{ fontSize: 12, letterSpacing: 1, color: MUTED }}>
                      {fact.k.toUpperCase()}
                    </Text>
                    <Text className="font-heavy" style={{ marginTop: 2, fontSize: 19, color: INK }}>
                      {fact.v}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </Appear>

      {/* ------------------------------------------------ bản đồ tổng */}
      <BigSection color="#FFFFFF" ink={INK} kicker={L('SƠ ĐỒ TƯ DUY', 'MIND MAP')} title={L('Bản đồ SAT.', 'The SAT map.')} icon={<CuteGlobe size={56} />}>
        <MindMap
          height={wide ? 480 : 420}
          center={{ label: 'Digital SAT', sub: '400 – 1600', color: '#6A4BD9', icon: <CuteStar size={34} /> }}
          branches={SAT_DOMAINS.map((d) => ({
            label: en ? d.en : d.vi,
            sub: `${d.section === 'math' ? L('Toán', 'Math') : L('Đọc & Viết', 'Reading & Writing')} · ≈${d.share}%`,
            color: d.color,
            icon: <DomainIcon id={d.id} size={30} />,
          }))}
        />
      </BigSection>

      {/* ------------------------------------------------ cấu trúc đề */}
      <BigSection color="#F3F0FB" ink="#2B2350" kicker={L('CẤU TRÚC ĐỀ', 'TEST STRUCTURE')} title={L('Hai phần, bốn module.', 'Two sections, four modules.')} icon={<CuteClock size={56} />}>
        <Structure wide={wide} />
      </BigSection>

      {/* ------------------------------------------------ Toán */}
      <PartHeader color="#F2B632" title={L('Toán.', 'Math.')} sub={L('44 câu · 70 phút · Desmos', '44 questions · 70 min · Desmos')} icon={<CuteCalculator size={70} />} />
      {math.map((d) => (
        <DomainSection key={d.id} d={d} wide={wide} />
      ))}

      {/* ------------------------------------------------ Đọc & Viết */}
      <PartHeader color="#6A4BD9" title={L('Đọc & Viết.', 'Reading & Writing.')} sub={L('54 câu · 64 phút · đoạn ngắn', '54 questions · 64 min · short passages')} icon={<CuteBook size={80} />} />
      {rw.map((d) => (
        <DomainSection key={d.id} d={d} wide={wide} />
      ))}

      {/* ------------------------------------------------ chiến lược */}
      <BigSection color="#FFFFFF" ink={INK} kicker={L('LÀM BÀI', 'TEST DAY')} title={L('Chiến lược làm bài.', 'Strategy.')} icon={<CuteTrophy size={56} />}>
        <Strategy wide={wide} />
      </BigSection>

      {/* ------------------------------------------------ phương pháp 5 bước */}
      <BigSection color="#F3F0FB" ink={INK} kicker={L('PHƯƠNG PHÁP', 'METHODOLOGY')} title={L('Quy trình 5 bước giải mọi câu hỏi SAT.', 'Universal 5-Step SAT Method.')} icon={<CuteBulb size={56} />}>
        <Method5StepSection wide={wide} />
      </BigSection>

      {/* ------------------------------------------------ Tuyệt chiêu Desmos */}
      <BigSection color="#F4F8FA" ink="#1E3A8A" kicker={L('CÔNG CỤ TOÁN', 'MATH TOOL')} title={L('Tuyệt chiêu máy tính Desmos SAT Math.', 'Desmos Calculator Power Techniques.')} icon={<CuteCalculator size={56} />}>
        <DesmosPowerSection wide={wide} />
      </BigSection>

      {/* ------------------------------------------------ 6 Bẫy Đọc hiểu Kinh điển */}
      <BigSection color="#FFF5F5" ink="#991B1B" kicker={L('CHIẾN THUẬT ĐỌC HIỂU', 'READING TRAPS')} title={L('6 Bẫy đọc hiểu SAT kinh điển (Erica Meltzer & College Board).', '6 Classic SAT Reading Traps.')} icon={<CuteBulb size={56} />}>
        <ReadingTrapsSection wide={wide} />
      </BigSection>

      {/* ------------------------------------------------ Bảng công thức vàng Math 800 */}
      <BigSection color="#F0FDF4" ink="#166534" kicker={L('CÔNG THỨC VÀNG', 'GOLDEN FORMULAS')} title={L('Bảng công thức vàng SAT Math 800 (The College Panda & 1600.io).', 'SAT Math 800 Golden Formulas.')} icon={<CuteCalculator size={56} />}>
        <MathFormulasSection wide={wide} />
      </BigSection>

      {/* ------------------------------------------------ Lộ trình 16 tuần R&W & 20 tuần Math */}
      <BigSection color="#F3F0FB" ink="#2B2350" kicker={L('LỘ TRÌNH CHUẨN', 'MASTER ROADMAPS')} title={L('Lộ trình 16 tuần R&W & 20 tuần Math.', '16-Week R&W & 20-Week Math Plans.')} icon={<CuteRocket size={56} />}>
        <RoadmapPlansSection wide={wide} />
      </BigSection>

      {/* ------------------------------------------------ Tủ sách SAT & Đề thi thật */}
      <BigSection color="#FFFFFF" ink={INK} kicker={L('TỦ SÁCH & ĐỀ THI', 'BOOK & TEST REPOSITORY')} title={L('27 tài liệu sách SAT kinh điển & Đề thi thật.', '27 Core SAT Books & Real Test Bank.')} icon={<CuteBook size={56} />}>
        <BookCatalogSection wide={wide} />
      </BigSection>

      <View style={{ height: 48 }} />
    </Screen>
  );
}

/** Khối lớn chiếm trọn chiều ngang — mỗi phần một khối, xếp dần xuống (không dồn tab). */
function BigSection({ color, ink, kicker, title, icon, children }: { color: string; ink: string; kicker: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Appear>
      <View style={{ marginTop: 18, borderRadius: 28, padding: 22, backgroundColor: color, borderWidth: color === '#FFFFFF' ? 1 : 0, borderColor: LINE, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text className="font-strong" style={{ fontSize: 12, letterSpacing: 2, color: MUTED }}>
              {kicker}
            </Text>
            <Text className="font-heavy" style={{ fontSize: 30, color: ink }}>
              {title}
            </Text>
          </View>
          <Motion kind="float">{icon}</Motion>
        </View>
        {children}
      </View>
    </Appear>
  );
}

/** Dải mở đầu một phần của đề (Toán / Đọc & Viết): khối màu lớn, chữ trắng, hình to. */
function PartHeader({ color, title, sub, icon }: { color: string; title: string; sub: string; icon: React.ReactNode }) {
  return (
    <Appear>
      <View style={{ marginTop: 28, borderRadius: 28, paddingHorizontal: 24, paddingVertical: 26, backgroundColor: color, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Sparkles count={6} />
        <View style={{ flex: 1 }}>
          <Text className="font-heavy" style={{ fontSize: 40, lineHeight: 46, color: '#FFFFFF' }}>
            {title}
          </Text>
          <View style={{ marginTop: 8, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.22)' }}>
            <Text className="font-strong" style={{ fontSize: 14, color: '#FFFFFF' }}>
              {sub}
            </Text>
          </View>
        </View>
        <Motion kind="wobble">{icon}</Motion>
      </View>
    </Appear>
  );
}

/** Một mảng kiến thức: bên trái sơ đồ các bài, bên phải cốt lõi / cần thuộc / bẫy. */
function DomainSection({ d, wide }: { d: Domain; wide: boolean }) {
  const { L, en } = useL();
  return (
    <Appear>
      <View style={{ marginTop: 14, borderRadius: 28, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE }}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 16, backgroundColor: d.color, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)' }}>
            <Motion kind="wobble">
              <DomainIcon id={d.id} size={46} />
            </Motion>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text className="font-heavy" style={{ fontSize: 24, color: '#FFFFFF' }}>
              {en ? d.en : d.vi}.
            </Text>
            {/* Dòng phụ tên tiếng Anh cho người học Việt; giao diện English thì bỏ. */}
            {en ? null : (
              <Text className="font-semi" style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
                {d.en}
              </Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text className="font-heavy" style={{ fontSize: 28, color: '#FFFFFF' }}>
              ≈{d.share}%
            </Text>
            <Text className="font-semi" style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>
              {questionsLabel(d.questions, en)}
            </Text>
          </View>
        </View>
        <View style={{ padding: 18, flexDirection: wide ? 'row' : 'column', gap: 18 }}>
          <View style={{ flex: wide ? 1.1 : undefined }}>
            <MindMap
              height={d.lessons.length > 5 ? 380 : 320}
              narrowBelow={440}
              center={{ label: en ? d.en : d.vi, color: d.color, icon: <DomainIcon id={d.id} size={28} /> }}
              branches={d.lessons.map((l) => ({ label: en ? l.labelEn : l.label, color: d.color, onPress: () => router.push(l.href as never) }))}
            />
          </View>
          <View style={{ flex: wide ? 1 : undefined, gap: 12 }}>
            <InfoCard emoji="💡" title={L('Cốt lõi', 'Core ideas')} tone="#F3F0FB">
              {(en ? d.coreEn : d.core).slice(0, 3).map((c) => (
                <Bullet key={c} text={c} color={d.color} />
              ))}
            </InfoCard>
            {d.formulas ? (
              <InfoCard emoji="📌" title={L('Cần thuộc', 'Must know')} tone="#F3F0FB">
                {(en ? (d.formulasEn ?? d.formulas) : d.formulas).map((f) => (
                  <Text key={f} className="font-semi" style={{ fontSize: 14, lineHeight: 20, color: INK }}>
                    {f}
                  </Text>
                ))}
              </InfoCard>
            ) : null}
            <InfoCard emoji="⚠️" title={L('Bẫy', 'Traps')} tone="#FFF1F0">
              {(en ? d.trapsEn : d.traps).slice(0, 2).map((t) => (
                <Bullet key={t} text={t} color="#E0533D" />
              ))}
            </InfoCard>
          </View>
        </View>
      </View>
    </Appear>
  );
}

function InfoCard({ emoji, title, tone, children }: { emoji: string; title: string; tone: string; children: React.ReactNode }) {
  return (
    <View style={{ borderRadius: 18, padding: 14, backgroundColor: tone, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
        <Text className="font-heavy" style={{ fontSize: 15, color: INK }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function Structure({ wide }: { wide: boolean }) {
  const { L, en } = useL();
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 14 }}>
        {SAT_SECTIONS.map((s) => {
          const domains = SAT_DOMAINS.filter((d) => d.section === s.id);
          const color = s.id === 'rw' ? '#6A4BD9' : '#F2B632';
          return (
            <View key={s.id} style={{ flex: 1, borderRadius: 22, padding: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
                <Text className="font-heavy" style={{ fontSize: 19, color: INK }}>
                  {en ? (SECTION_EN[s.id] ?? s.vi) : s.vi}
                </Text>
              </View>
              <View style={{ marginTop: 14, flexDirection: 'row', gap: 8 }}>
                <Big value={`${s.modules * s.perModule}`} label={L('câu', 'questions')} />
                <Big value={`${s.modules * s.minutesPerModule}'`} label={L('phút', 'minutes')} />
                <Big value={`${s.modules}×${s.perModule}`} label={L('module × câu', 'modules × questions')} />
              </View>
              {/* Tỉ trọng các mảng: một thanh chồng màu + chú giải */}
              <View style={{ marginTop: 14, flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' }}>
                {domains.map((d) => (
                  <View key={d.id} style={{ flex: d.share, backgroundColor: d.color }} />
                ))}
              </View>
              <View style={{ marginTop: 10, gap: 6 }}>
                {domains.map((d) => (
                  <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: d.color }} />
                    <Text className="font-semi" style={{ flex: 1, fontSize: 14, color: INK }}>
                      {en ? d.en : d.vi}
                    </Text>
                    <Text className="font-sans" style={{ fontSize: 14, color: MUTED }}>
                      ≈{d.share}% · {questionsLabel(d.questions, en)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ borderRadius: 22, padding: 18, backgroundColor: '#F3F0FB', borderWidth: 1, borderColor: '#F6D9A0' }}>
        <Text className="font-heavy" style={{ fontSize: 16, color: '#2B2350' }}>
          {L('Thi thích ứng theo module', 'Module-adaptive testing')}
        </Text>
        <Text className="font-sans" style={{ marginTop: 6, fontSize: 14, lineHeight: 21, color: '#2B2350' }}>
          {L('Mỗi phần 2 module. Module 1 tốt thì module 2 khó hơn và mới đạt được điểm cao.', 'Each section has 2 modules. Do well in module 1 to unlock the harder, higher-scoring module 2.')}
        </Text>
      </View>
    </View>
  );
}

function Strategy({ wide }: { wide: boolean }) {
  const { en } = useL();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {SAT_STRATEGY.map((s, i) => (
        <View key={s.t} style={{ flexGrow: 1, flexBasis: wide ? 300 : 260, borderRadius: 22, padding: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE, flexDirection: 'row', gap: 14 }}>
          <Badge icon={STRAT_ICON[i % STRAT_ICON.length]!} color={STRAT_COLOR[i % STRAT_COLOR.length]!} size={42} />
          <View style={{ flex: 1 }}>
            <Text className="font-heavy" style={{ fontSize: 16, color: INK }}>
              {en ? s.tEn : s.t}
            </Text>
            <Text className="font-sans" style={{ marginTop: 4, fontSize: 14, lineHeight: 21, color: MUTED }}>
              {en ? s.dEn : s.d}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const FACT_ICONS = [CuteClock, CuteTrophy, CuteRocket, CuteStar];

const DOMAIN_ICON: Record<string, (p: { size?: number }) => React.ReactElement> = {
  algebra: CuteCalculator,
  advanced: CuteRocket,
  psda: CuteNotebook,
  geometry: CuteGlobe,
  craft: CuteBulb,
  info: CuteMagnifier,
  conventions: CutePencil,
  expression: CuteChat,
};

function DomainIcon({ id, size = 44 }: { id: string; size?: number }) {
  const I = DOMAIN_ICON[id] ?? CuteBook;
  return <I size={size} />;
}

const STRAT_ICON = ['clock', 'check', 'star', 'bolt', 'question', 'target'] as const;
const STRAT_COLOR = ['#F2B632', '#22A06B', '#6A4BD9', '#6A4BD9', '#E0533D', '#2FA3A0'];

function Big({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, borderRadius: 16, padding: 12, backgroundColor: '#F3F0FB' }}>
      <Text className="font-heavy" style={{ fontSize: 24, color: INK }}>
        {value}
      </Text>
      <Text className="font-semi" style={{ fontSize: 12, color: MUTED }}>
        {label}
      </Text>
    </View>
  );
}

function Bullet({ text, color, glyph = '•' }: { text: string; color: string; glyph?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Text className="font-heavy" style={{ fontSize: 14, lineHeight: 21, color }}>
        {glyph}
      </Text>
      <Text className="font-sans" style={{ flex: 1, fontSize: 14, lineHeight: 21, color: INK }}>
        {text}
      </Text>
    </View>
  );
}

function Method5StepSection({ wide }: { wide: boolean }) {
  const { L, en } = useL();
  return (
    <View style={{ gap: 20 }}>
      <Text className="font-sans text-body text-paper-muted" style={{ lineHeight: 22 }}>
        {L(
          'Quy trình giải quyết vạn năng đúc kết từ giáo trình 16 tuần R&W và kinh nghiệm các thủ khoa 1550+: không bao giờ đọc đoạn văn một cách thụ động, luôn đi từ câu hỏi để tìm bằng chứng xác đáng.',
          'The universal question-solving workflow extracted from the 16-week R&W curriculum: never read passively; always begin with the question stem to locate conclusive evidence.'
        )}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {SAT_5_STEP_METHOD.map((s) => (
          <View
            key={s.step}
            style={{
              flexGrow: 1,
              flexBasis: wide ? 320 : '100%',
              borderRadius: 22,
              padding: 18,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: LINE,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#B94A70',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text className="font-heavy" style={{ color: '#FFFFFF', fontSize: 15 }}>
                  {s.step}
                </Text>
              </View>
              <Text className="font-heavy text-subTitle text-ink" style={{ flex: 1 }}>
                {en ? s.titleEn : s.titleVi}
              </Text>
            </View>

            <Text className="font-sans text-body" style={{ color: MUTED, lineHeight: 20 }}>
              {en ? s.summaryEn : s.summaryVi}
            </Text>

            <View style={{ marginTop: 4, gap: 6, borderTopWidth: 1, borderTopColor: '#FBE3EC', paddingTop: 8 }}>
              {s.tips.map((tip, idx) => (
                <Bullet key={idx} text={tip} color="#B94A70" glyph="✓" />
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* 7 Context Clues & 9 Transitions */}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 14 }}>
        <View style={{ flex: 1, borderRadius: 22, padding: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE, gap: 10 }}>
          <Text className="font-heavy text-cardTitle text-ink">
            {L('7 Manh Mối Ngữ Cảnh (Context Clues)', '7 Context Clues in Reading')}
          </Text>
          <View style={{ gap: 8 }}>
            {SAT_CONTEXT_CLUES.map((c, i) => (
              <View key={i} style={{ borderRadius: 14, padding: 10, backgroundColor: '#F3F0FB' }}>
                <Text className="font-strong text-caption" style={{ color: '#B94A70' }}>
                  {c.nameVi}
                </Text>
                <Text className="font-mono text-tiny" style={{ color: MUTED, marginTop: 2 }}>
                  Dấu hiệu: {c.signal}
                </Text>
                <Text className="font-sans text-caption" style={{ color: INK, marginTop: 2 }}>
                  {c.ruleVi}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ flex: 1, borderRadius: 22, padding: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE, gap: 10 }}>
          <Text className="font-heavy text-cardTitle text-ink">
            {L('9 Nhóm Từ Nối Chuẩn SAT (Transitions)', '9 Official SAT Transition Groups')}
          </Text>
          <View style={{ gap: 8 }}>
            {SAT_TRANSITION_GROUPS.map((g, i) => (
              <View key={i} style={{ borderRadius: 14, padding: 10, backgroundColor: '#F8F9FA' }}>
                <Text className="font-strong text-caption text-ink">{g.groupVi}</Text>
                <Text className="font-mono text-tiny" style={{ color: '#3B82F6', marginTop: 3 }}>
                  {g.words.join(' · ')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function DesmosPowerSection({ wide }: { wide: boolean }) {
  const { L } = useL();
  return (
    <View style={{ gap: 14 }}>
      <Text className="font-sans text-body text-paper-muted" style={{ lineHeight: 22 }}>
        {L(
          'Trong Digital SAT, Desmos được tích hợp sẵn 100% phần thi Math. Nắm vững 4 tuyệt chiêu sau sẽ giúp giải quyết hơn 50% câu hỏi hóc búa chỉ trong 10 đến 20 giây mà không lo tính nhầm.',
          'In Digital SAT, Desmos is built-in for 100% of the Math section. Mastering these 4 core techniques solves over 50% of tough questions in 10-20 seconds without arithmetic slips.'
        )}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {SAT_DESMOS_TECHNIQUES.map((tech, idx) => (
          <View
            key={idx}
            style={{
              flexGrow: 1,
              flexBasis: wide ? 320 : '100%',
              borderRadius: 20,
              padding: 16,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#DBEAFE',
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text className="font-heavy text-body text-ink">{tech.nameVi}</Text>
              <View style={{ borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#EFF6FF' }}>
                <Text className="font-mono text-tiny" style={{ color: '#1D4ED8' }}>
                  Desmos Pro
                </Text>
              </View>
            </View>
            <Text className="font-sans text-caption" style={{ color: MUTED, lineHeight: 19 }}>
              {tech.useVi}
            </Text>
            <View style={{ borderRadius: 10, padding: 8, backgroundColor: '#1E293B' }}>
              <Text className="font-mono text-tiny" style={{ color: '#38BDF8' }}>
                {tech.shortcut}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function RoadmapPlansSection({ wide }: { wide: boolean }) {
  const { L } = useL();
  return (
    <View style={{ gap: 20 }}>
      {/* 16-Week R&W */}
      <View style={{ borderRadius: 22, padding: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#C97A9A' }} />
          <Text className="font-heavy text-cardTitle text-ink">
            {L('Lộ trình 16 tuần Reading & Writing (Chinh phục 700+)', '16-Week R&W Mastery Roadmap (Target 700+)')}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {SAT_RW_16_WEEK_ROADMAP.map((phase, idx) => (
            <View
              key={idx}
              style={{
                flexGrow: 1,
                flexBasis: wide ? 280 : '100%',
                borderRadius: 16,
                padding: 14,
                backgroundColor: '#F3F0FB',
                borderWidth: 1,
                borderColor: '#F3F0FB',
                gap: 6,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text className="font-heavy text-caption" style={{ color: '#B94A70' }}>
                  {phase.weeks}
                </Text>
                <View style={{ borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#B94A70' }}>
                  <Text className="font-heavy text-tiny" style={{ color: '#FFFFFF' }}>
                    Chặng {idx + 1}
                  </Text>
                </View>
              </View>
              <Text className="font-strong text-body text-ink">{phase.phase}</Text>
              <Text className="font-sans text-caption" style={{ color: '#22A06B', fontWeight: '600' }}>
                Mục tiêu: {phase.target}
              </Text>
              <View style={{ marginTop: 4, gap: 4 }}>
                {phase.items.map((it, i) => (
                  <Bullet key={i} text={it} color="#B94A70" glyph="•" />
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 20-Week Math */}
      <View style={{ borderRadius: 22, padding: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#F2B632' }} />
          <Text className="font-heavy text-cardTitle text-ink">
            {L('Lộ trình 20 tuần SAT Math (Chinh phục 750 – 800)', '20-Week Math Mastery Roadmap (Target 750–800)')}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {SAT_MATH_20_WEEK_ROADMAP.map((phase, idx) => (
            <View
              key={idx}
              style={{
                flexGrow: 1,
                flexBasis: wide ? 280 : '100%',
                borderRadius: 16,
                padding: 14,
                backgroundColor: '#F3F0FB',
                borderWidth: 1,
                borderColor: '#FBE8B5',
                gap: 6,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text className="font-heavy text-caption" style={{ color: '#6A4BD9' }}>
                  {phase.weeks}
                </Text>
                <View style={{ borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#F2B632' }}>
                  <Text className="font-heavy text-tiny" style={{ color: '#FFFFFF' }}>
                    Chặng {idx + 1}
                  </Text>
                </View>
              </View>
              <Text className="font-strong text-body text-ink">{phase.phase}</Text>
              <Text className="font-sans text-caption" style={{ color: '#22A06B', fontWeight: '600' }}>
                Mục tiêu: {phase.target}
              </Text>
              <View style={{ marginTop: 4, gap: 4 }}>
                {phase.items.map((it, i) => (
                  <Bullet key={i} text={it} color="#F2B632" glyph="•" />
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function BookCatalogSection({ wide }: { wide: boolean }) {
  const { L } = useL();
  return (
    <View style={{ gap: 14 }}>
      <Text className="font-sans text-body text-paper-muted" style={{ lineHeight: 22 }}>
        {L(
          'Danh mục 27 cuốn sách kinh điển và tài liệu đề thi thật từ Google Spreadsheet (SAT by Springboard & College Board), được tuyển chọn để tích hợp lộ trình, phương pháp và câu hỏi vào Band 9.',
          'Catalog of 27 core SAT books and real test archives from the official spreadsheet, integrated into Band 9 with roadmaps, methods, and curated question banks.'
        )}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {SAT_BOOK_CATALOG.map((b) => (
          <View
            key={b.id}
            style={{
              flexGrow: 1,
              flexBasis: wide ? 320 : '100%',
              borderRadius: 18,
              padding: 16,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: LINE,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#FFF4F8' }}>
                <Text className="font-strong text-tiny" style={{ color: '#B94A70' }}>
                  {b.category}
                </Text>
              </View>
              <Text className="font-semi text-tiny text-muted">{b.level}</Text>
            </View>

            <Text className="font-heavy text-body text-ink">{b.title}</Text>
            <Text className="font-sans text-caption text-muted">Tác giả: {b.author}</Text>
            <Text className="font-sans text-caption text-paper-ink" style={{ lineHeight: 18 }}>
              {b.note}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ReadingTrapsSection({ wide }: { wide: boolean }) {
  const { L } = useL();
  const traps = [
    {
      num: 1,
      nameVi: 'Quá rộng (Too Broad) & Quá hẹp (Too Narrow)',
      descVi: 'Phương án đưa ra kết luận khái quát toàn diện vượt xa phạm vi đoạn văn, hoặc chỉ nhắc tới 1 chi tiết nhỏ làm ví dụ mà bỏ qua toàn bộ luận điểm chính.',
      signal: 'Dấu hiệu: Các từ bao quát toàn thể nhân loại, mọi loài; hoặc lặp lại nguyên văn một con số ở câu phụ.',
    },
    {
      num: 2,
      nameVi: 'Đảo ngược quan hệ nhân quả (Reversed Causation)',
      descVi: 'Đoạn văn nói "A kích thích sinh ra B", nhưng phương án lại khẳng định "B là nguyên nhân trực tiếp dẫn tới A". Các danh từ giống hệt trong bài khiến thí sinh dễ chọn nhầm.',
      signal: 'Dấu hiệu: Đọc kỹ chủ ngữ và tân ngữ của động từ chỉ nguyên nhân (caused by, stems from, triggers).',
    },
    {
      num: 3,
      nameVi: 'Từ ngữ tuyệt đối hóa (Extreme Language)',
      descVi: 'Đoạn văn học thuật luôn giữ thái độ dè dặt, thận trọng (suggests, may, likely), nhưng phương án sai lại dùng các từ ngữ cực đoan, tuyệt đối.',
      signal: 'Dấu hiệu: always, never, completely, impossible, solely, exclusively, proven fact.',
    },
    {
      num: 4,
      nameVi: 'So sánh khập khiễng (False Comparison)',
      descVi: 'Đoạn văn nhắc tới 2 đối tượng X và Y độc lập, nhưng phương án lại tự tiện đặt ra phép so sánh hơn/kém (X is more efficient than Y, X evolved earlier than Y).',
      signal: 'Dấu hiệu: Các tính từ so sánh hơn (-er, more than, superior to) mà bài đọc không hề đo lường.',
    },
    {
      num: 5,
      nameVi: 'Kiến thức ngoài đời không có trong bài (Outside Knowledge)',
      descVi: 'Phương án phát biểu một chân lý khoa học hoặc lịch sử hoàn toàn đúng ngoài đời thực, nhưng lại KHÔNG ĐƯỢC ĐOẠN VĂN ĐỀ CẬP HOẶC HỖ TRỢ.',
      signal: 'Dấu hiệu: Đọc nghe rất xuôi tai và hợp lý, nhưng không tìm được dòng nào trong bài chứng minh.',
    },
    {
      num: 6,
      nameVi: 'Nửa đúng nửa sai (Half-Right Half-Wrong)',
      descVi: 'Bẫy tinh vi nhất của College Board: nửa đầu phương án paraphrase rất chuẩn, nhưng 2-3 từ cuối cùng lại gài một thông tin sai lệch hoặc một tính từ sai tông.',
      signal: 'Dấu hiệu: Luôn đọc trọn vẹn cả câu của phương án đến dấu chấm cuối cùng; chỉ cần sai 1 từ là gạch bỏ!',
    },
  ];

  return (
    <View style={{ gap: 14 }}>
      <Text className="font-sans text-body text-paper-muted" style={{ lineHeight: 22 }}>
        {L(
          'Đúc kết từ 27 tựa sách kinh điển (Erica Meltzer The Critical Reader, Barron’s & College Board): 3 phương án sai trong SAT Reading không phải ngẫu nhiên, mà được thiết kế theo đúng 6 công thức bẫy tâm lý sau.',
          'Compiled from classic prep books: wrong answer choices in SAT Reading are engineered according to these 6 psychological trap archetypes.'
        )}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {traps.map((t) => (
          <View
            key={t.num}
            style={{
              flexGrow: 1,
              flexBasis: wide ? 320 : '100%',
              borderRadius: 18,
              padding: 16,
              backgroundColor: '#FFFFFF',
              borderWidth: 1.5,
              borderColor: '#FECACA',
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>{t.num}</Text>
              </View>
              <Text className="font-heavy text-body text-ink" style={{ flex: 1 }}>
                {t.nameVi}
              </Text>
            </View>
            <Text className="font-sans text-caption text-muted" style={{ lineHeight: 19 }}>
              {t.descVi}
            </Text>
            <View style={{ backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8 }}>
              <Text style={{ fontSize: 11.5, color: '#991B1B', fontWeight: '600' }}>
                💡 {t.signal}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function MathFormulasSection({ wide }: { wide: boolean }) {
  const { L } = useL();
  const formulas = [
    {
      group: '1. Phương trình đường tròn & Hình quạt',
      source: 'The College Panda Chapter 24',
      items: [
        'Dạng chuẩn: (x - h)² + (y - k)² = r² (tâm (h, k), bán kính r)',
        'Độ dài cung: s = (θ / 360°) · 2πr',
        'Diện tích hình quạt: A = (θ / 360°) · πr²',
      ],
    },
    {
      group: '2. Parabol, Đỉnh & Trục đối xứng',
      source: '1600.io Orange Book Chapter 8',
      items: [
        'Dạng đỉnh: y = a(x - h)² + k (Đỉnh (h, k); a > 0 thì k là min, a < 0 thì k là max)',
        'Hoành độ đỉnh & Trục đối xứng: x = -b / (2a)',
        'Khoảng cách giữa 2 nghiệm: |x₁ - x₂| = √Δ / |a|',
      ],
    },
    {
      group: '3. Biệt thức Delta & Định lý Vi-et',
      source: 'The College Panda Chapter 12',
      items: [
        'Biệt thức Δ = b² - 4ac: Δ > 0 (2 nghiệm), Δ = 0 (1 nghiệm kép), Δ < 0 (vô nghiệm thực)',
        'Định lý Vi-et: x₁ + x₂ = -b / a',
        'Định lý Vi-et: x₁ · x₂ = c / a',
      ],
    },
    {
      group: '4. Lượng giác & Góc phụ nhau',
      source: 'Barron’s Math Workbook Chapter 18',
      items: [
        'Góc phụ nhau (Complementary): sin(x°) = cos(90° - x°)',
        'Hằng số lượng giác: sin²(x) + cos²(x) = 1',
        'Tam giác đặc biệt 30-60-90: x, x√3, 2x; Tam giác 45-45-90: x, x, x√2',
      ],
    },
    {
      group: '5. Hàm mũ & Tăng trưởng liên tục',
      source: 'Digital SAT Math 800 Secrets',
      items: [
        'Tăng/giảm theo kỳ: y = a(1 ± r)ᵗ (a: giá trị ban đầu, r: tỉ lệ tăng giảm)',
        'Nhân đôi / Chu kỳ bán rã: y = a · 2^(t/d) hoặc y = a · (1/2)^(t/h)',
      ],
    },
    {
      group: '6. Thống kê, Trung vị & Khoảng tin cậy',
      source: 'McGraw-Hill SAT Math Practice',
      items: [
        'Trung vị (Median) và Tứ phân vị (IQR) không bị ảnh hưởng bởi giá trị ngoại lai (outliers)',
        'Khoảng tin cậy: Muốn giảm Margin of Error xuống một nửa, cỡ mẫu n phải tăng gấp 4 lần (√n)',
      ],
    },
  ];

  return (
    <View style={{ gap: 14 }}>
      <Text className="font-sans text-body text-paper-muted" style={{ lineHeight: 22 }}>
        {L(
          'Tổng hợp trọn bộ công thức toán xuất hiện trong 100% đề thi Digital SAT, giúp làm chủ 44 câu hỏi phần Math với độ chính xác tuyệt đối.',
          'Master formula sheet covering all recurring SAT Math concepts from The College Panda and 1600.io.'
        )}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {formulas.map((f, idx) => (
          <View
            key={idx}
            style={{
              flexGrow: 1,
              flexBasis: wide ? 320 : '100%',
              borderRadius: 18,
              padding: 16,
              backgroundColor: '#FFFFFF',
              borderWidth: 1.5,
              borderColor: '#BBF7D0',
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text className="font-heavy text-body" style={{ color: '#166534' }}>
                {f.group}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: '#15803D', fontWeight: '700' }}>
              Nguồn: {f.source}
            </Text>
            <View style={{ gap: 4, marginTop: 4 }}>
              {f.items.map((it, iIdx) => (
                <View key={iIdx} style={{ backgroundColor: '#F0FDF4', padding: 8, borderRadius: 8 }}>
                  <Text className="font-mono text-caption" style={{ color: '#14532D', fontWeight: '600' }}>
                    {it}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

