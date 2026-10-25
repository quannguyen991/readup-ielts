import React, { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuroraBackdrop } from './AuroraBackdrop';
import { StudyBackdrop } from './LightGrid';
import { useSentenceThemeId, useTravelActive } from '@/components/rail/TravelBackdrop';
import { themeOf } from '@/components/vocab/study/study-theme';
import { BackgroundButton } from './BackgroundButton';
import { isTravelLightRoute } from '@/navigation/focus-routes';
import { useTravelPractice } from '@/store/useTravelPractice';
import { Icon } from '@/components/ui/Icon';
import { CuteFor } from '@/components/illust/HeroArt';
import { color, layout, paper } from '@/theme/tokens';
import { useL } from '@/i18n/useL';

export type TaskTone = 'brand' | 'paper';

/**
 * Khung của một màn LÀM BÀI.
 *
 * Ba việc, gom một chỗ vì cả bốn màn tác vụ đều cần đúng ba việc này:
 *
 *   1. Vẽ nền tràn viền (giấy kẻ ô xanh tím, hoặc nền sáng) — kể cả phần chèn
 *      an toàn phía trên, nên `SafeAreaView` nằm BÊN TRONG nền chứ không bọc
 *      ngoài. Bọc ngoài thì máy có tai thỏ sẽ có một dải trắng cắt ngang đỉnh.
 *   2. Một đường về DUY NHẤT ở góc trái. `AppShell` đã bỏ hết thanh điều hướng
 *      ở các đường dẫn này, nên nếu màn nào quên vẽ đường về thì người dùng
 *      thật sự bị kẹt — vì thế nó là tham số bắt buộc, không phải tuỳ chọn.
 *   3. Giới hạn bề ngang nội dung, để dòng chữ không kéo dài hết màn 27 inch.
 *
 * ĐẦU MÀN GỌN LÀ MẶC ĐỊNH (`variant="compact"`): một hàng mảnh — đường về, tên
 * bài chữ nhỏ, phần bên phải. Đã vào làm bài thì ô biểu tượng to, tiêu đề cỡ
 * trang và dòng phụ tiếng Anh ("LISTENING DICTATION PRACTICE") chỉ chiếm chỗ
 * của bài — người dùng bắt bỏ ngày 26/09/2026. `variant="full"` chỉ dành cho
 * màn CHỌN BÀI (danh sách), nơi tiêu đề còn giúp định hướng.
 *
 * Hai tông: `brand` (nền xanh tím, thẻ giấy kem nổi lên — dùng cho màn có nhiều chữ
 * cần đọc kỹ) và `paper` (nền sáng, thẻ trắng — dùng cho màn thao tác nhiều,
 * nơi nền tối làm mỏi mắt khi nhìn lâu vào ô nhập).
 */
export function TaskShell({
  backHref,
  backLabel,
  title,
  subtitle,
  icon = 'book',
  // Band 9 (01/10/2026): nền kem vàng là mặc định cho MỌI màn; chỉ đổi khi người
  // dùng đổi sao lấy Nền học / Giao diện (StudyBackdrop tự đọc lựa chọn đó).
  tone = 'paper',
  paperGrid = true,
  right,
  children,
  variant = 'compact',
}: {
  /** 'full' = đầu màn có biểu tượng + tiêu đề lớn (màn chọn bài); 'compact' = một hàng mảnh (màn làm bài). */
  variant?: 'full' | 'compact';
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Icon>['name'];
  tone?: TaskTone;
  /** Tắt lưới cho các workspace cần nền trang chủ sạch, không bị chia ô. */
  paperGrid?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { L } = useL();
  // Màn làm bài của chép chính tả / viết câu báo "đang làm bài" để nền cảnh bay chạy
  // (trang chọn bộ đề dùng variant 'full' nên không báo — nền giữ như cũ).
  const practice = variant === 'compact' && isTravelLightRoute(pathname);
  useEffect(() => {
    if (!practice) return;
    useTravelPractice.getState().enter();
    return () => useTravelPractice.getState().leave();
  }, [practice]);
  const travel = useTravelActive() && practice;
  // Nền chủ đề / tranh do người học chọn (không phải cảnh bay): nội dung bài nằm trên một tấm giấy sáng; chữ ở đầu màn theo màu chủ đề.
  const themeId = useSentenceThemeId();
  const themed = practice && !travel && themeId !== 'plain';
  const th = themed ? themeOf(themeId) : null;
  // Nền cảnh bay phủ lớp sáng: chữ luôn dùng màu mực tối cho dễ đọc.
  const onBrand = tone === 'brand' && !travel && !themed;
  const titleColor = th ? th.onBg : onBrand ? color.white : paper.ink;
  const subColor = th ? th.onBg : onBrand ? 'rgba(255,255,255,0.72)' : paper.muted;
  const pillBg = th ? th.pill : onBrand ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.75)';
  const pillInk = th ? th.pillInk : onBrand ? color.white : paper.ink;

  const body = (
    <SafeAreaView edges={['top']} className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View
          className="w-full self-center px-4 pb-4 pt-1 lg:px-8"
          style={{ maxWidth: layout.contentMaxWidth }}
        >
          {variant === 'compact' ? (
            <View className="mb-4 flex-row flex-wrap items-center gap-x-3 gap-y-2">
              <Link href={backHref as never} asChild>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={backLabel}
                  className="flex-row items-center gap-1.5 rounded-pill px-3 py-1.5"
                  style={{ backgroundColor: pillBg }}
                >
                  <View style={{ transform: [{ rotate: '180deg' }] }}>
                    <Icon name="arrow-right" size={14} color={pillInk} strokeWidth={2.2} />
                  </View>
                  <Text className="font-semi text-label" style={{ color: pillInk }}>
                    {L('Thoát', 'Exit')}
                  </Text>
                </Pressable>
              </Link>
              <Text className="min-w-0 flex-1 font-strong text-body" style={{ color: titleColor }} numberOfLines={1}>
                {title}
              </Text>
              {right}
              {practice ? <BackgroundButton ink={pillInk} pill={pillBg} /> : null}
            </View>
          ) : null}

          {variant === 'full' ? (
          <>
          <Link href={backHref as never} asChild>
            <Pressable
              accessibilityRole="link"
              className="mb-4 flex-row items-center gap-1.5 self-start py-1"
            >
              <View style={{ transform: [{ rotate: '180deg' }] }}>
                <Icon name="arrow-right" size={15} color={subColor} strokeWidth={2} />
              </View>
              <Text
                className="font-semi uppercase tracking-wide"
                style={{ color: subColor, fontSize: 12 }}
              >
                {backLabel}
              </Text>
            </Pressable>
          </Link>

          <View className="mb-5 flex-row items-center gap-3">
            {CuteFor({ icon, size: 84 }) ?? (
              <View
                className="h-12 w-12 items-center justify-center rounded-panel"
                style={{ backgroundColor: onBrand ? 'rgba(255,255,255,0.16)' : paper.brandMid }}
              >
                <Icon name={icon} size={22} color={color.white} strokeWidth={1.9} />
              </View>
            )}
            <View className="flex-1">
              <Text className="font-heavy text-pageTitle" style={{ color: titleColor }}>
                {title}
              </Text>
              {subtitle ? (
                <Text
                  className="mt-0.5 font-semi uppercase tracking-wide"
                  style={{ color: subColor, fontSize: 12 }}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {right}
          </View>
          </>
          ) : null}

          {themed ? (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 22, padding: 14 }}>{children}</View>
          ) : (
            children
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  /*
    Tông tối dùng nền LOANG, tông giấy vẫn giữ lưới kẻ ô. Đây là chủ ý, không
    phải làm dở dang.

    Tông tối là màn chọn bài và màn xem kết quả — chỗ để nhìn, và ở đó khối loang
    lớn mềm làm nền đẹp mà không tranh chỗ với chữ. Tông giấy là màn ĐANG GÕ: ô
    chữ, ô nhập, bài viết. Ở đó lưới kẻ gợi đúng thứ cần gợi — tờ giấy kẻ để
    viết lên — và một nền đang chuyển động chậm ngay sau con trỏ là thứ gây phân
    tâm đúng vào lúc cần tập trung nhất.
  */
  // Màn có nền cảnh bay (chép chính tả, viết câu): khung trong suốt để cảnh thành phố lộ ra.
  if (travel || themed) return <>{body}</>;
  if (onBrand) return <AuroraBackdrop>{body}</AuroraBackdrop>;

  /*
    Tông sáng CŨNG có lưới, chỉ là lưới nhạt trên nền xanh nước biển rất nhạt.

    Trước đây tông này là một mảng trắng phẳng: thẻ trắng đặt trên nền trắng thì
    không còn ranh giới nào, cả màn hình trông như một tờ giấy trống. Nền xanh
    nhạt kẻ ô vừa tách được thẻ ra khỏi nền, vừa giữ đúng một họa tiết với tông
    tối — hai tông là hai độ sáng của cùng một thứ, không phải hai thiết kế.
  */
  // Nền học đổi bằng sao (nếu đang dùng) — cùng nền với mọi màn học khác.
  return <StudyBackdrop showGrid={paperGrid}>{body}</StudyBackdrop>;
}
