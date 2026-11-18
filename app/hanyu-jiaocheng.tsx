import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import {
  CHINESE_ADDITIONAL_COURSES,
  CHINESE_OPEN_COURSE,
  CHINESE_SUPPLEMENTAL_SETS,
  HANYU_CATALOG_NOTE,
  HANYU_LOGIN_NOTE,
  HANYU_LOGIN_URL,
  HANYU_REVISED_LESSON_TOTAL,
  HANYU_REVISED_SERIES_URL,
  HANYU_REVISED_VOCAB_BOOK_SLUG,
  HANYU_REVISED_VOLUMES,
  HANYU_SERIES_URL,
  HANYU_VI_GLOSS_SOURCE_URL,
} from '@/data/zh-learn';
import { ZH } from '@/components/vocab/chinese/palette';
import { HanyuCurrentEditionGallery } from '@/components/zh-learn/HanyuCurrentEditionGallery';

function SectionTitle({
  kicker,
  title,
  detail,
}: {
  kicker: string;
  title: string;
  detail: string;
}) {
  return (
    <View style={{ marginBottom: 13 }}>
      <Text style={{ fontSize: 11, letterSpacing: 1.3, fontWeight: '400', color: ZH.seal }}>{kicker}</Text>
      <Text style={{ marginTop: 3, fontSize: 22, lineHeight: 29, fontWeight: '400', color: ZH.ink }}>{title}</Text>
      <Text style={{ marginTop: 4, fontSize: 13, lineHeight: 19, color: ZH.ink2 }}>{detail}</Text>
    </View>
  );
}

function LinkButton({
  label,
  onPress,
  subtle = false,
}: {
  label: string;
  onPress: () => void;
  subtle?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 40,
        alignSelf: 'flex-start',
        justifyContent: 'center',
        paddingHorizontal: 13,
        borderRadius: 11,
        backgroundColor: subtle ? 'transparent' : pressed ? ZH.seal2 : ZH.seal,
        borderWidth: subtle ? 1 : 0,
        borderColor: ZH.line,
        opacity: subtle && pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ fontSize: 13, fontWeight: '400', color: subtle ? ZH.seal : '#FFFBF3' }}>{label}</Text>
    </Pressable>
  );
}

export default function HanyuJiaochengScreen() {
  const [showCurrentEdition, setShowCurrentEdition] = useState(false);

  return (
    <Screen>
      <Pressable accessibilityRole="link" onPress={() => router.back()} style={{ alignSelf: 'flex-start', paddingVertical: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: ZH.seal }}>‹ Quay lại phần học tiếng Trung</Text>
      </Pressable>

      <View style={{ marginTop: 8, padding: 22, borderRadius: 22, backgroundColor: ZH.seal, borderWidth: 1.5, borderColor: ZH.gold2 }}>
        <Text style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: '400', color: ZH.gold2 }}>READUP · 中文学习</Text>
        <Text style={{ marginTop: 6, fontSize: 29, lineHeight: 36, fontWeight: '400', color: '#FFFBF3' }}>Giáo trình Hán ngữ</Text>
        <Text style={{ marginTop: 6, fontSize: 14, lineHeight: 21, color: '#F4E6C2' }}>
          Học theo sáu tập PDF bạn đã gửi. Từ vựng được OCR và sắp theo đúng bài của bản sửa đổi năm 2006.
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 15 }}>
          {[
            `6 tập`,
            `${HANYU_REVISED_LESSON_TOTAL} bài`,
            '3.256 từ OCR',
          ].map((item) => (
            <View key={item} style={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,251,243,0.12)', borderWidth: 1, borderColor: 'rgba(233,201,138,0.4)' }}>
              <Text style={{ fontSize: 12, fontWeight: '400', color: '#FFFBF3' }}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 16, gap: 9 }}>
          <LinkButton
            label="Bắt đầu với Quyển 1 · Tập trên →"
            onPress={() => router.push(`/vocabulary/book/${HANYU_REVISED_VOCAB_BOOK_SLUG}/book-hanyu-revised-2006-vol-1-shang` as never)}
          />
          <Text style={{ fontSize: 12, lineHeight: 18, color: '#F4E6C2' }}>
            Đây là bản 修订本 (2006), không phải bản 第3版 đang được BLCUP giới thiệu.
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 26 }}>
        <SectionTitle
          kicker="01 · HỌC THEO GIÁO TRÌNH"
          title="Chọn tập và vào bài"
          detail="Mở danh sách từ theo từng tập, sau đó chọn bài muốn ôn. Mỗi mục giữ số trang từ bản scan để tiện đối chiếu."
        />

        <View style={{ gap: 10 }}>
          {HANYU_REVISED_VOLUMES.map((volume, index) => (
            <View key={volume.id} style={{ padding: 15, borderRadius: 16, borderWidth: 1, borderColor: ZH.line, backgroundColor: ZH.card }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: ZH.goldSoftBg }}>
                  <Text style={{ fontSize: 15, fontWeight: '400', color: ZH.seal }}>{String(index + 1).padStart(2, '0')}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 17, lineHeight: 23, fontWeight: '400', color: ZH.ink }}>{volume.titleVi}</Text>
                  <Text style={{ marginTop: 2, fontSize: 13, fontWeight: '700', color: ZH.ink2 }}>{volume.title}</Text>
                  <Text style={{ marginTop: 6, fontSize: 12, lineHeight: 18, color: ZH.ink2 }}>{volume.lessonCount} bài · ISBN {volume.isbn}</Text>
                  <Text style={{ marginTop: 5, fontSize: 12, lineHeight: 18, color: ZH.ink2 }}>{volume.focus}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 11 }}>
                    <LinkButton
                      label="Học từ theo bài →"
                      onPress={() => router.push(`/vocabulary/book/${HANYU_REVISED_VOCAB_BOOK_SLUG}/${volume.vocabularyTopicSlug}` as never)}
                    />
                    <LinkButton label="Thông tin sách ↗" subtle onPress={() => void Linking.openURL(volume.publisherUrl)} />
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 12, padding: 15, borderRadius: 15, backgroundColor: ZH.cream2, borderWidth: 1, borderColor: ZH.line }}>
          <Text style={{ fontSize: 13, lineHeight: 19, fontWeight: '700', color: ZH.ink }}>Đối chiếu và cách đọc dữ liệu</Text>
          <Text style={{ marginTop: 4, fontSize: 12, lineHeight: 18, color: ZH.ink2 }}>{HANYU_CATALOG_NOTE}</Text>
          <Text style={{ marginTop: 4, fontSize: 12, lineHeight: 18, color: ZH.ink2 }}>
            Nghĩa Việt chỉ hiện khi khớp chính xác chữ giản thể và pinyin với OpenCidian; mục chưa khớp giữ nghĩa tiếng Anh từ sách.
          </Text>
          <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(HANYU_VI_GLOSS_SOURCE_URL)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            <Text style={{ fontSize: 13, fontWeight: '400', color: ZH.seal }}>Nguồn nghĩa Việt · OpenCidian ↗</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ marginTop: 27 }}>
        <SectionTitle
          kicker="02 · MỞ RỘNG VỐN TỪ"
          title="Các bộ từ bổ trợ"
          detail="Dùng để ôn thi hoặc mở rộng chủ đề. Các bộ này không nằm trong thứ tự bài của Giáo trình Hán ngữ."
        />
        <View style={{ gap: 10 }}>
          {CHINESE_SUPPLEMENTAL_SETS.map((set) => (
            <View key={set.slug} style={{ padding: 15, borderRadius: 16, borderWidth: 1, borderColor: ZH.line, backgroundColor: ZH.card }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <Text style={{ flex: 1, fontSize: 16, lineHeight: 22, fontWeight: '400', color: ZH.ink }}>{set.title}</Text>
                <Text style={{ fontSize: 12, fontWeight: '400', color: ZH.seal }}>{set.wordCount.toLocaleString('vi-VN')} từ</Text>
              </View>
              <Text style={{ marginTop: 4, fontSize: 12, color: ZH.ink2 }}>{set.topicCount} chủ đề · {set.unitCount} buổi</Text>
              <Text style={{ marginTop: 6, fontSize: 12, lineHeight: 18, color: ZH.ink2 }}>{set.note}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 11 }}>
                <LinkButton label="Học trong ReadUp →" onPress={() => router.push(`/vocabulary/book/${set.slug}` as never)} />
                {set.sourceLinks.map((source) => (
                  <LinkButton key={source.label} label={`${source.label} ↗`} subtle onPress={() => void Linking.openURL(source.url)} />
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 27 }}>
        <SectionTitle
          kicker="03 · HỌC LIỆU MIỄN PHÍ"
          title="Khóa học và tài liệu mở"
          detail="Các nguồn bên ngoài có bài học, nghe và đọc bổ sung. Giấy phép được ghi ngay trên từng mục."
        />

        <View style={{ padding: 15, borderRadius: 16, borderWidth: 1, borderColor: ZH.line, backgroundColor: ZH.cream2 }}>
          <Text style={{ fontSize: 16, lineHeight: 22, fontWeight: '400', color: ZH.ink }}>{CHINESE_OPEN_COURSE.title}</Text>
          <Text style={{ marginTop: 4, fontSize: 12, lineHeight: 18, color: ZH.ink2 }}>
            {CHINESE_OPEN_COURSE.chapterCount} chương · có từ vựng và tư liệu nghe/xem · giấy phép {CHINESE_OPEN_COURSE.license}. Mở tại nguồn; chưa sao chép vào ReadUp.
          </Text>
          <View style={{ marginTop: 10 }}>
            <LinkButton label="Mở giáo trình OER ↗" onPress={() => void Linking.openURL(CHINESE_OPEN_COURSE.url)} />
          </View>
        </View>

        <View style={{ gap: 10, marginTop: 10 }}>
          {CHINESE_ADDITIONAL_COURSES.map((course) => (
            <View key={course.title} style={{ padding: 15, borderRadius: 16, borderWidth: 1, borderColor: ZH.line, backgroundColor: ZH.card }}>
              <Text style={{ fontSize: 16, lineHeight: 22, fontWeight: '400', color: ZH.ink }}>{course.title}</Text>
              <Text style={{ marginTop: 4, fontSize: 12, lineHeight: 18, color: ZH.ink2 }}>{course.detail}</Text>
              <View style={{ alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: ZH.goldSoftBg }}>
                <Text style={{ fontSize: 11, lineHeight: 15, fontWeight: '400', color: ZH.seal }}>Giấy phép · {course.license}</Text>
              </View>
              <Text style={{ marginTop: 7, fontSize: 12, lineHeight: 18, color: ZH.ink2 }}>{course.accessNote} Nội dung được mở tại trang nguồn.</Text>
              <View style={{ marginTop: 9 }}>
                <LinkButton label="Mở nguồn học liệu ↗" subtle onPress={() => void Linking.openURL(course.url)} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 27, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: ZH.line, backgroundColor: ZH.card }}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showCurrentEdition }}
          onPress={() => setShowCurrentEdition((visible) => !visible)}
          style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, letterSpacing: 1.2, fontWeight: '400', color: ZH.seal }}>THAM KHẢO · BLCUP</Text>
            <Text style={{ marginTop: 3, fontSize: 17, fontWeight: '400', color: ZH.ink }}>Ấn bản 第3版 hiện hành</Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '400', color: ZH.seal }}>{showCurrentEdition ? 'Thu gọn ↑' : 'Xem 6 tập ↓'}</Text>
        </Pressable>
        <Text style={{ marginTop: 5, fontSize: 12, lineHeight: 18, color: ZH.ink2 }}>
          Danh mục tham khảo riêng. Trang này chưa có nội dung bài học hay từ vựng của bản 第3版; sáu tập bên trên là dữ liệu OCR từ bản 修订本 (2006).
        </Text>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(HANYU_LOGIN_URL)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 13, fontWeight: '400', color: ZH.seal }}>Mở BLCUP ↗</Text>
        </Pressable>
        {showCurrentEdition ? (
          <View style={{ marginTop: 6 }}>
            <HanyuCurrentEditionGallery />
            <View style={{ marginTop: 10, gap: 8 }}>
              <Text style={{ fontSize: 12, lineHeight: 18, color: ZH.ink2 }}>{HANYU_LOGIN_NOTE}</Text>
              <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(HANYU_SERIES_URL)} style={{ alignSelf: 'flex-start' }}>
                <Text style={{ fontSize: 13, fontWeight: '400', color: ZH.seal }}>Mở danh mục 第3版 tại BLCUP ↗</Text>
              </Pressable>
              <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(HANYU_REVISED_SERIES_URL)} style={{ alignSelf: 'flex-start' }}>
                <Text style={{ fontSize: 13, fontWeight: '400', color: ZH.seal }}>Xem danh mục bản 修订本 ↗</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
