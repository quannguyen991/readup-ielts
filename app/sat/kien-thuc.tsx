import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { MindMap } from '@/components/illust/MindMap';
import { Badge, CuteBook, CuteClock, CuteGlobe, CutePencil } from '@/components/illust/Cute';
import { CuteBulb, CuteCalculator, CuteChat, CuteMagnifier, CuteNotebook, CuteRocket, CuteStar, CuteTrophy, Motion, Sparkles } from '@/components/illust/CuteMore';
import { SAT_DOMAINS, SAT_FACTS, SAT_SECTIONS, SAT_STRATEGY, type Domain } from '@/data/sat-knowledge';

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
const LINE = '#E2E8F0';

export default function SatKnowledge() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const math = SAT_DOMAINS.filter((d) => d.section === 'math');
  const rw = SAT_DOMAINS.filter((d) => d.section === 'rw');

  return (
    <Screen>
      {/* ------------------------------------------------ khối đầu */}
      <Appear>
        <View style={{ borderRadius: 28, padding: wide ? 32 : 20, backgroundColor: '#4A7FE8', overflow: 'hidden' }}>
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
            KIẾN THỨC SAT · DIGITAL SAT
          </Text>
          <Text className="font-heavy" style={{ marginTop: 8, fontSize: wide ? 44 : 30, lineHeight: wide ? 50 : 36, color: '#FFFFFF' }}>
            Toàn bộ SAT trong một khung.
          </Text>
          <Text className="font-sans" style={{ marginTop: 8, fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.88)', maxWidth: 620 }}>
            Cấu trúc đề · 8 mảng · công thức · bẫy hay gặp.
          </Text>
          <View style={{ marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {SAT_FACTS.map((f, i) => {
              const Icon = FACT_ICONS[i % FACT_ICONS.length]!;
              return (
                <View key={f.k} accessibilityLabel={`${f.k}: ${f.v}. ${f.d}`} style={{ flexGrow: 1, flexBasis: wide ? 200 : 150, borderRadius: 20, padding: 14, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Motion kind="float" delay={i * 0.35}>
                    <Icon size={48} />
                  </Motion>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text className="font-semi" style={{ fontSize: 12, letterSpacing: 1, color: MUTED }}>
                      {f.k.toUpperCase()}
                    </Text>
                    <Text className="font-heavy" style={{ marginTop: 2, fontSize: 19, color: INK }}>
                      {f.v}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </Appear>

      {/* ------------------------------------------------ bản đồ tổng */}
      <BigSection color="#FFFFFF" ink={INK} kicker="SƠ ĐỒ TƯ DUY" title="Bản đồ SAT." icon={<CuteGlobe size={56} />}>
        <MindMap
          height={wide ? 480 : 420}
          center={{ label: 'Digital SAT', sub: '400 – 1600', color: '#4A7FE8', icon: <CuteStar size={34} /> }}
          branches={SAT_DOMAINS.map((d) => ({
            label: d.vi,
            sub: `${d.section === 'math' ? 'Toán' : 'Đọc & Viết'} · ≈${d.share}%`,
            color: d.color,
            icon: <DomainIcon id={d.id} size={30} />,
          }))}
        />
      </BigSection>

      {/* ------------------------------------------------ cấu trúc đề */}
      <BigSection color="#FFF7E6" ink="#7A4B00" kicker="CẤU TRÚC ĐỀ" title="Hai phần, bốn module." icon={<CuteClock size={56} />}>
        <Structure wide={wide} />
      </BigSection>

      {/* ------------------------------------------------ Toán */}
      <PartHeader color="#F2B632" title="Toán." sub="44 câu · 70 phút · Desmos" icon={<CuteCalculator size={70} />} />
      {math.map((d) => (
        <DomainSection key={d.id} d={d} wide={wide} />
      ))}

      {/* ------------------------------------------------ Đọc & Viết */}
      <PartHeader color="#0EA5E9" title="Đọc & Viết." sub="54 câu · 64 phút · đoạn ngắn" icon={<CuteBook size={80} />} />
      {rw.map((d) => (
        <DomainSection key={d.id} d={d} wide={wide} />
      ))}

      {/* ------------------------------------------------ chiến lược */}
      <BigSection color="#FFFFFF" ink={INK} kicker="LÀM BÀI" title="Chiến lược." icon={<CuteTrophy size={56} />}>
        <Strategy wide={wide} />
      </BigSection>
      <View style={{ height: 36 }} />
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
              {d.vi}.
            </Text>
            <Text className="font-semi" style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
              {d.en}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text className="font-heavy" style={{ fontSize: 28, color: '#FFFFFF' }}>
              ≈{d.share}%
            </Text>
            <Text className="font-semi" style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>
              {d.questions}
            </Text>
          </View>
        </View>
        <View style={{ padding: 18, flexDirection: wide ? 'row' : 'column', gap: 18 }}>
          <View style={{ flex: wide ? 1.1 : undefined }}>
            <MindMap
              height={d.lessons.length > 5 ? 380 : 320}
              narrowBelow={440}
              center={{ label: d.vi, color: d.color, icon: <DomainIcon id={d.id} size={28} /> }}
              branches={d.lessons.map((l) => ({ label: l.label, color: d.color, onPress: () => router.push(l.href as never) }))}
            />
          </View>
          <View style={{ flex: wide ? 1 : undefined, gap: 12 }}>
            <InfoCard emoji="💡" title="Cốt lõi" tone="#EEF6FF">
              {d.core.slice(0, 3).map((c) => (
                <Bullet key={c} text={c} color={d.color} />
              ))}
            </InfoCard>
            {d.formulas ? (
              <InfoCard emoji="📌" title="Cần thuộc" tone="#F8FAFC">
                {d.formulas.map((f) => (
                  <Text key={f} className="font-semi" style={{ fontSize: 14, lineHeight: 20, color: INK }}>
                    {f}
                  </Text>
                ))}
              </InfoCard>
            ) : null}
            <InfoCard emoji="⚠️" title="Bẫy" tone="#FFF1F0">
              {d.traps.slice(0, 2).map((t) => (
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
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 14 }}>
        {SAT_SECTIONS.map((s) => {
          const domains = SAT_DOMAINS.filter((d) => d.section === s.id);
          const color = s.id === 'rw' ? '#0EA5E9' : '#F2B632';
          return (
            <View key={s.id} style={{ flex: 1, borderRadius: 22, padding: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
                <Text className="font-heavy" style={{ fontSize: 19, color: INK }}>
                  {s.vi}
                </Text>
              </View>
              <View style={{ marginTop: 14, flexDirection: 'row', gap: 8 }}>
                <Big value={`${s.modules * s.perModule}`} label="câu" />
                <Big value={`${s.modules * s.minutesPerModule}'`} label="phút" />
                <Big value={`${s.modules}×${s.perModule}`} label="module × câu" />
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
                      {d.vi}
                    </Text>
                    <Text className="font-sans" style={{ fontSize: 14, color: MUTED }}>
                      ≈{d.share}% · {d.questions}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
      <View style={{ borderRadius: 22, padding: 18, backgroundColor: '#FFF7E6', borderWidth: 1, borderColor: '#F6D9A0' }}>
        <Text className="font-heavy" style={{ fontSize: 16, color: '#7A4B00' }}>
          Thi thích ứng theo module
        </Text>
        <Text className="font-sans" style={{ marginTop: 6, fontSize: 14, lineHeight: 21, color: '#7A4B00' }}>
          Mỗi phần có 2 module. Module 1 có độ khó trộn lẫn; kết quả module 1 quyết định module 2 là bản dễ hay bản khó. Chỉ bản khó mới mở được mức điểm cao nhất — vì vậy làm chắc module 1 quan trọng hơn làm nhanh.
        </Text>
      </View>
    </View>
  );
}

function Strategy({ wide }: { wide: boolean }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {SAT_STRATEGY.map((s, i) => (
        <View key={s.t} style={{ flexGrow: 1, flexBasis: wide ? 300 : 260, borderRadius: 22, padding: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE, flexDirection: 'row', gap: 14 }}>
          <Badge icon={STRAT_ICON[i % STRAT_ICON.length]!} color={STRAT_COLOR[i % STRAT_COLOR.length]!} size={42} />
          <View style={{ flex: 1 }}>
            <Text className="font-heavy" style={{ fontSize: 16, color: INK }}>
              {s.t}
            </Text>
            <Text className="font-sans" style={{ marginTop: 4, fontSize: 14, lineHeight: 21, color: MUTED }}>
              {s.d}
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
const STRAT_COLOR = ['#F2B632', '#22A06B', '#0EA5E9', '#4A7FE8', '#E0533D', '#2FA3A0'];

function Big({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, borderRadius: 16, padding: 12, backgroundColor: '#F8FAFC' }}>
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
