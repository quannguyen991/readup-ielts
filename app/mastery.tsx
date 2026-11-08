import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Button, Card, Icon, IconCircle } from '@/components/ui';
import { buildExport } from '@/services/mastery/cohort';
import { explain } from '@/services/mastery/explain';
import { DOMAIN_LABEL, type Domain, type SkillRecord, type SkillStatus } from '@/services/mastery/types';
import { LOCALE_LABEL, type Locale } from '@/i18n';
import { useLocaleStore, useT } from '@/i18n/useT';
import { useMasteryStore } from '@/store/useMasteryStore';
import { AuditPanel } from '@/components/ai-literacy/AuditPanel';
import { CredentialCard } from '@/components/credential/CredentialCard';
import { ARTICLES, getArticleWithBody } from '@/data/articles';
import { useChunkVersion } from '@/data/use-chunk-version';
import { pickTransferSource } from '@/services/proofloop/transfer-source';
import { checkFeature, requiredPlanFor } from '@/lib/billing/entitlements';
import { PLANS, type PlanId } from '@/lib/billing/plans';
import { usePlan } from '@/store/useBillingStore';
import { color } from '@/theme/tokens';
import { MAX_TIER_REFERRALS } from '@/services/referral/rewards';
import { useL, type Bi, bi } from '@/i18n/useL';

/** Tên mảng khi giao diện ở tiếng Anh (bản tiếng Việt ở DOMAIN_LABEL). */
const DOMAIN_LABEL_EN: Record<Domain, string> = {
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  'sat-math': 'SAT Math',
  'sat-verbal': 'SAT Verbal',
  'ai-literacy': 'Reading AI output',
};

/**
 * Sổ bằng chứng: app nghĩ bạn đã làm được gì, và DỰA VÀO ĐÂU.
 *
 * VÌ SAO MÀN NÀY TỒN TẠI. Mọi app học đều có một trang "tiến độ" đầy phần trăm.
 * Phần trăm không trả lời được câu hỏi duy nhất đáng hỏi: dựa vào đâu mà nói tôi
 * đã hiểu? Ở đây mỗi kỹ năng mở ra được thành một chuỗi lập luận — đã quan sát
 * gì, suy ra gì, và cần gì nữa để được công nhận.
 *
 * BỐN TRẠNG THÁI, KHÔNG PHẢI MỘT THANG ĐIỂM. Thang điểm mời người ta tối ưu con
 * số; bốn trạng thái buộc phải trả lời "đã đủ căn cứ chưa". Và "chưa quan sát
 * được" là một trạng thái RIÊNG, không gộp vào "chưa đạt": không đo được khác
 * với đo rồi thấy chưa được, mà gộp hai thứ đó lại là cách nhanh nhất để một
 * bảng tiến độ nói dối.
 */

const STATUS_META: Record<SkillStatus, { tone: string; icon: 'check' | 'info' | 'clock' }> = {
  confirmed: { tone: color.success, icon: 'check' },
  probing: { tone: color.warning, icon: 'clock' },
  'needs-probe': { tone: color.danger, icon: 'info' },
  unobserved: { tone: color.subtle, icon: 'info' },
};

const STATUS_LABEL_KEY = {
  confirmed: 'status.confirmed',
  probing: 'status.probing',
  'needs-probe': 'status.needsProbe',
  unobserved: 'status.unobserved',
} as const;

const ORDER: SkillStatus[] = ['needs-probe', 'probing', 'confirmed', 'unobserved'];

export default function MasteryScreen() {
  const ledger = useMasteryStore((s) => s.ledger);
  const plan = usePlan();
  const credential = checkFeature(plan, 'verifiable_credential');
  const { t } = useT();
  const { en } = useL();

  const records = useMemo(
    () =>
      Object.values(ledger).sort(
        (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || b.observations - a.observations,
      ),
    [ledger],
  );

  const byDomain = useMemo(() => {
    const out = new Map<Domain, SkillRecord[]>();
    for (const r of records) {
      const list = out.get(r.skill.domain) ?? [];
      list.push(r);
      out.set(r.skill.domain, list);
    }
    return out;
  }, [records]);

  return (
    <Screen cat="peace">
      <View className="self-start rounded-pill border border-border bg-surface px-3 py-1.5">
        <Text className="font-semi uppercase tracking-wide text-muted" style={{ fontSize: 12 }}>
          {t('mastery.eyebrow')}
        </Text>
      </View>

      <Text className="mt-3 font-heavy text-pageTitle text-ink">{t('mastery.title')}</Text>
      <Text className="mt-1.5 max-w-[680px] font-sans text-bodyLg text-muted">
        {t('mastery.intro')}
      </Text>

      <LanguageToggle />

      <ExportCard />

      {/*
        CHỨNG CHỈ KÝ SỐ, đặt NGAY DƯỚI bản xuất cho giáo viên — có chủ ý.

        Hai thứ cùng lấy dữ liệu từ một chỗ và trông na ná nhau, nên đặt cạnh
        nhau thì khác biệt tự lộ ra: bản trên là JSON trần, ai sửa cũng được và
        không ai biết; bản dưới ký bằng khoá trên máy người học, sửa một ký tự là
        hỏng chữ ký. Tách chúng ra hai chỗ thì người dùng sẽ dùng cái gặp trước
        và không bao giờ biết cái kia giải quyết vấn đề gì.
      */}
      <View className="mt-4">
        {credential.allowed ? (
          <CredentialCard ledger={ledger} />
        ) : (
          <CredentialLocked need={requiredPlanFor('verifiable_credential')} />
        )}
      </View>

      {/*
        SOI MỘT BẢN CỦA AI — dời từ màn xem lại về đây (07/09/2026).

        Ở màn xem lại nó chen vào giữa lúc người học đang muốn biết mình sai câu
        nào, nên đọc ra như một thứ lạc đề. Ở đây thì đúng chỗ: đây là sổ ghi cả
        mảng `ai-literacy`, và bài soi chính là bài sinh ra những dòng trong sổ ấy.
      */}
      <AuditSection />

      <Card className="mt-4">
        <Text className="font-strong text-body text-ink">{t('mastery.whyStrictTitle')}</Text>
        <Text className="mt-1.5 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
          {t('mastery.whyStrictBody')}
        </Text>
      </Card>

      {records.length === 0 ? (
        <Card className="mt-5">
          <Text className="font-strong text-body text-ink">{t('mastery.emptyTitle')}</Text>
          <Text className="mt-1.5 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
            {t('mastery.emptyBody')}
          </Text>
        </Card>
      ) : (
        [...byDomain.entries()].map(([domain, list]) => (
          <View key={domain} className="mt-6">
            <Text className="font-strong text-cardTitle text-ink">{(en ? DOMAIN_LABEL_EN : DOMAIN_LABEL)[domain]}</Text>
            <View className="mt-3">
              <Grid columns={2} tabletColumns={1} mobileColumns={1} gap={12}>
                {list.map((r) => (
                  <SkillCard key={`${r.skill.domain}:${r.skill.key}`} rec={r} />
                ))}
              </Grid>
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}

function SkillCard({ rec }: { rec: SkillRecord }) {
  const [open, setOpen] = useState(false);
  const { t, locale } = useT();
  const meta = STATUS_META[rec.status];
  const e = useMemo(() => explain(rec, locale), [rec, locale]);

  return (
    <View className="h-full overflow-hidden rounded-card border border-border bg-surface">
      <Pressable
        accessibilityRole="button"
        aria-expanded={open}
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-start gap-3 p-3.5"
      >
        <View className="pt-0.5">
          <Icon name={meta.icon} size={17} color={meta.tone} strokeWidth={2.2} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-strong text-body text-ink">{rec.skill.key}</Text>
          <Text className="mt-0.5 font-sans text-label" style={{ color: meta.tone }}>
            {t(STATUS_LABEL_KEY[rec.status])}
          </Text>
          <Text className="mt-0.5 font-sans text-label text-subtle">
            {t('mastery.observations', { n: rec.observed ?? 0 })}
            {rec.transfers > 0 ? ` · ${t('mastery.transfers', { n: rec.transfers })}` : ''}
          </Text>
        </View>
        <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} color={color.subtle} strokeWidth={2} />
      </Pressable>

      {open ? (
        <View className="border-t border-border px-3.5 py-3">
          <Text className="font-semi uppercase tracking-wide text-subtle" style={{ fontSize: 12 }}>
            {t('mastery.whyThink')}
          </Text>

          {e.steps.map((step) => (
            <View key={step.label} className="mt-2.5">
              <Text className="font-strong text-label text-ink">{step.label}</Text>
              <Text className="mt-0.5 font-sans text-label text-muted" style={{ lineHeight: 19 }}>
                {step.detail}
              </Text>
            </View>
          ))}

          <View className="mt-3 rounded-panel bg-primary-50 p-3">
            <Text className="font-strong text-label text-primary-900">{t('mastery.nextStep')}</Text>
            <Text className="mt-0.5 font-sans text-label text-primary-800" style={{ lineHeight: 19 }}>
              {e.nextVi}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Nút đổi ngôn ngữ.
 *
 * Đặt ngay trên màn này chứ không giấu trong Cài đặt: đây là màn giải thích cơ
 * chế, và người cần bản tiếng Anh chính là người đang muốn hiểu cơ chế — bắt họ
 * đi tìm trong Cài đặt là đặt rào ngay trước thứ họ tới để xem.
 */
function LanguageToggle() {
  const { locale } = useT();
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <View className="mt-4 flex-row flex-wrap items-center gap-1.5">
      {(['vi', 'en'] as Locale[]).map((code) => (
        <Pressable
          key={code}
          accessibilityRole="button"
          aria-selected={locale === code}
          onPress={() => setLocale(code)}
          className={[
            'rounded-pill border px-3 py-1.5',
            locale === code ? 'border-primary-600 bg-primary-600' : 'border-border bg-surface',
          ].join(' ')}
        >
          <Text
            className={['font-semi text-label', locale === code ? 'text-white' : 'text-muted'].join(' ')}
          >
            {LOCALE_LABEL[code]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Xuất sổ để gửi cho giáo viên.
 *
 * MÃ DO CHÍNH NGƯỜI HỌC ĐẶT, không phải tên. Bản xuất cũng bỏ hẳn `lastSourceId`
 * — id bài đọc là dấu vết ai đã làm gì lúc nào, không cần cho bức tranh lớp học
 * và không nên rời khỏi máy họ. Xem `services/mastery/cohort.ts`.
 *
 * Hiện ra chuỗi JSON để chép tay chứ không tải file: chép được ở mọi trình duyệt
 * và mọi máy, kể cả máy trường bị khoá quyền tải xuống — mà đó chính là loại máy
 * cần dùng tính năng này nhất.
 */
function ExportCard() {
  const ledger = useMasteryStore((s) => s.ledger);
  const [code, setCode] = useState('');
  const [payload, setPayload] = useState<string | null>(null);
  const { L } = useL();

  const skills = Object.keys(ledger).length;
  if (skills === 0) return null;

  return (
    <Card className="mt-4">
      <View className="flex-row items-center gap-2">
        <Icon name="clipboard" size={16} color={color.primary} strokeWidth={2.1} />
        <Text className="font-strong text-body text-ink">{L('Gửi sổ cho giáo viên', 'Send your ledger to a teacher')}</Text>
      </View>
      <Text className="mt-1 font-sans text-label text-muted" style={{ lineHeight: 19 }}>
        {L(
          `Bản xuất chỉ mang mã bạn tự đặt và trạng thái ${skills} kỹ năng — không có tên, không có bài nào bạn đã làm.`,
          `The export only carries a code you choose and the status of ${skills} skills — no name, and none of the passages you've done.`,
        )}
      </Text>

      <View className="mt-3 flex-row flex-wrap items-center gap-2">
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder={L('Mã của bạn, ví dụ HS-01', 'Your code, e.g. HS-01')}
          placeholderTextColor={color.subtle}
          className="min-w-[180px] flex-1 rounded-panel border border-border bg-surface px-3 py-2 font-sans text-body text-ink"
        />
        <Button
          label={L('Tạo bản xuất', 'Create export')}
          disabled={code.trim() === ''}
          onPress={() => setPayload(JSON.stringify(buildExport(ledger, code)))}
        />
      </View>

      {payload ? (
        <View className="mt-3">
          <Text className="font-sans text-label text-muted">{L('Chép toàn bộ dòng dưới rồi gửi đi:', 'Copy the whole line below and send it:')}</Text>
          <TextInput
            value={payload}
            editable={false}
            multiline
            className="mt-1.5 rounded-panel border border-border bg-surfaceAlt px-3 py-2 font-sans text-label text-ink"
            style={{ minHeight: 84 }}
          />
        </View>
      ) : null}
    </Card>
  );
}


/**
 * Khối soi bản AI, tự lấy bài của mình.
 *
 * Chọn bài TẤT ĐỊNH theo bài đầu kho, nên mở lại màn này thì vẫn là bản cũ chứ
 * không đổi bài mỗi lần vẽ lại — đổi mỗi lần vẽ thì người đang đọc dở một bản sẽ
 * mất nó ngay khi chạm vào thứ khác trên màn.
 */
function AuditSection() {
  const chunkVer = useChunkVersion();
  const source = useMemo(() => {
    const first = ARTICLES.find((a) => a.exam === 'ielts' && a.licenseType !== 'headline_only');
    if (!first) return null;
    const pick = pickTransferSource(first, ARTICLES);
    const full = pick ? getArticleWithBody(pick.id) : undefined;
    return full ? { origin: getArticleWithBody(first.id), audit: full } : null;
  }, [chunkVer]);

  if (!source?.origin || !source.audit) return null;
  const { origin, audit } = source;

  return (
    <AuditPanel
      paragraphs={audit.paragraphs}
      seed={audit.id}
      sourceId={audit.id}
      fetchDraft={async () => {
        const res = await fetch('/api/proofloop/probe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answerCorrect: true,
            mark: { paragraphIndex: 0, phrase: origin.paragraphs[0] ?? '', startOffset: 0, endOffset: 1 },
            truthParagraphIndex: 0,
            passage: origin.paragraphs.join('\n\n'),
            questionPrompt: `What is the main idea of "${origin.title}"?`,
            correctAnswer: origin.title,
            truthEvidenceText: origin.paragraphs[0] ?? '',
            sourceId: origin.id,
            transferPassage: audit.paragraphs.join('\n\n'),
            transferSourceId: audit.id,
          }),
        });
        const json = await res.json();
        return json?.draft ?? null;
      }}
    />
  );
}

/**
 * Chỗ đứng của chứng chỉ ký số khi gói chưa mở.
 *
 * NÓI RÕ NÓ LÀ GÌ TRƯỚC KHI ĐÒI TIỀN. Một cái khoá với dòng "nâng cấp để mở"
 * không cho người ta cơ sở nào để quyết; mà thứ này lại đúng loại khó hình dung
 * — "chứng chỉ ký số" nghe như một cái huy hiệu trang trí. Ba dòng dưới đây nói
 * đúng ba việc nó làm được, và chúng đều là việc thật.
 *
 * KHÔNG GIẤU SỔ BẰNG CHỨNG. Toàn bộ dữ liệu học vẫn hiện đầy đủ ở trên, và bản
 * xuất JSON cho giáo viên vẫn dùng được ở mọi gói. Cái bị khoá là TỜ GIẤY ở
 * cuối, không phải cái đã học.
 */
function CredentialLocked({ need }: { need: PlanId }) {
  const { L, locale } = useL();
  return (
    <Card>
      <View className="flex-row items-start gap-3">
        <IconCircle name="lock" tone="warning" size={40} />
        <View className="min-w-0 flex-1">
          <Text className="font-strong text-cardTitle text-ink">
            {L(`Chứng chỉ ký số — gói ${PLANS[need].name}`, `Signed credential — ${PLANS[need].name} plan`)}
          </Text>
          <Text className="mt-1.5 font-sans text-body text-muted" style={{ lineHeight: 22 }}>
            {L(
              `Sổ bằng chứng ở trên là của bạn ở mọi gói, và bản xuất cho giáo viên cũng vậy. Cái nằm sau gói ${PLANS[need].name} là tờ giấy ở cuối: một bản ghi được KÝ bằng khoá nằm trên máy bạn.`,
              `The evidence ledger above is yours on every plan, and so is the teacher export. What ${PLANS[need].name} adds is the final certificate: a record SIGNED with a key that lives on your device.`,
            )}
          </Text>
          <View className="mt-3">
            {CREDENTIAL_POINTS.map((line) => (
              <View key={line.vi} className="mt-1.5 flex-row gap-2.5">
                <Icon name="check" size={15} color={color.success} strokeWidth={2.4} />
                <Text className="min-w-0 flex-1 font-sans text-body text-body">{bi(line, locale)}</Text>
              </View>
            ))}
          </View>
          <View className="mt-4 flex-row flex-wrap gap-2">
            <Button
              label={L(`Xem gói ${PLANS[need].name}`, `See the ${PLANS[need].name} plan`)}
              iconRight="chevron-right"
              onPress={() => router.push('/upgrade' as never)}
            />
            <Button
              label={L(
                `Mời ${MAX_TIER_REFERRALS} bạn, nhận ${PLANS[need].name} miễn phí`,
                `Invite ${MAX_TIER_REFERRALS} friends, get ${PLANS[need].name} free`,
              )}
              variant="outline"
              iconLeft="sparkle"
              onPress={() => router.push('/invite' as never)}
            />
          </View>
        </View>
      </View>
    </Card>
  );
}

/** Ba việc chứng chỉ làm được — mỗi dòng ứng với code đã chạy, không phải lời quảng cáo. */
const CREDENTIAL_POINTS: Bi[] = [
  {
    vi: 'Sửa một ký tự trong bản ghi là chữ ký hỏng ngay, ai kiểm cũng thấy.',
    en: 'Change a single character in the record and the signature breaks — anyone checking will see it.',
  },
  {
    vi: 'Người kiểm không cần tin Band 9: có sẵn trình kiểm chạy độc lập ngoài app.',
    en: "Verifiers don't have to trust Band 9: there's a standalone checker that runs outside the app.",
  },
  {
    vi: 'Theo chuẩn W3C Verifiable Credential, không phải một định dạng riêng của app.',
    en: 'Follows the W3C Verifiable Credential standard, not an app-specific format.',
  },
];
