import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { CHINESE_ADDITIONAL_COURSES, CHINESE_OPEN_COURSE, CHINESE_SUPPLEMENTAL_SETS, HANYU_CATALOG_NOTE, HANYU_LESSON_TOTAL, HANYU_LOGIN_NOTE, HANYU_LOGIN_URL, HANYU_REVISED_LESSON_TOTAL, HANYU_REVISED_SERIES_URL, HANYU_REVISED_VOCAB_BOOK_SLUG, HANYU_REVISED_VOLUMES, HANYU_SERIES_URL, HANYU_VI_GLOSS_SOURCE_URL } from '@/data/zh-learn';
import { ZH } from '@/components/vocab/chinese/palette';
import { HanyuCurrentEditionGallery } from '@/components/zh-learn/HanyuCurrentEditionGallery';

export default function HanyuJiaochengScreen() {
  return (
    <Screen>
      <Pressable accessibilityRole="link" onPress={() => router.back()} style={{ alignSelf: 'flex-start', paddingVertical: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: ZH.seal }}>‹ Quay lại phần học tiếng Trung</Text>
      </Pressable>

      <View style={{ marginTop: 8, padding: 20, borderRadius: 22, backgroundColor: ZH.seal, borderWidth: 1.5, borderColor: ZH.gold2 }}>
        <Text style={{ fontSize: 13, letterSpacing: 1.1, fontWeight: '700', color: ZH.gold2 }}>ẤN BẢN HIỆN HÀNH TẠI BLCUP · 第3版</Text>
        <Text style={{ marginTop: 5, fontSize: 28, lineHeight: 36, fontWeight: '800', color: '#FFFBF3' }}>汉语教程（第3版）</Text>
        <Text style={{ marginTop: 6, fontSize: 15, lineHeight: 22, color: '#F4E6C2' }}>
          6 tập · {HANYU_LESSON_TOTAL} bài · bộ BLCUP đang liệt kê
        </Text>
        <Text style={{ marginTop: 7, fontSize: 13, lineHeight: 19, color: '#F4E6C2' }}>
          BLCUP hiện liệt kê 6 tập của ấn bản 第3版. Bộ từ đã OCR từ PDF 2006 được đặt riêng bên dưới.
        </Text>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(HANYU_SERIES_URL)} style={{ marginTop: 10, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: ZH.gold2 }}>Xem danh mục 第3版 tại BLCUP ↗</Text>
        </Pressable>
      </View>

      <HanyuCurrentEditionGallery />

      <View style={{ marginTop: 8, padding: 20, borderRadius: 22, backgroundColor: ZH.seal, borderWidth: 1.5, borderColor: ZH.gold2 }}>
        <Text style={{ fontSize: 13, letterSpacing: 1.1, fontWeight: '700', color: ZH.gold2 }}>TỪ VỰNG ĐÃ OCR · 修订本 (2006)</Text>
        <Text style={{ marginTop: 5, fontSize: 30, lineHeight: 38, fontWeight: '800', color: '#FFFBF3' }}>汉语教程（修订本）</Text>
        <Text style={{ marginTop: 6, fontSize: 15, lineHeight: 22, color: '#F4E6C2' }}>
          6 tập · {HANYU_REVISED_LESSON_TOTAL} bài · dữ liệu từ sáu PDF đã OCR
        </Text>
      </View>

      <View style={{ marginTop: 14, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: ZH.line, backgroundColor: ZH.cream2 }}>
        <Text style={{ fontSize: 14, lineHeight: 21, color: ZH.ink }}>{HANYU_CATALOG_NOTE}</Text>
        <Text style={{ marginTop: 7, fontSize: 13, lineHeight: 19, color: ZH.ink2 }}>{HANYU_LOGIN_NOTE}</Text>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(HANYU_REVISED_SERIES_URL)} style={{ marginTop: 10, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: ZH.seal }}>Mở danh mục bộ sách tại BLCUP ↗</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(HANYU_LOGIN_URL)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: ZH.seal }}>Mở trang đăng nhập BLCUP ↗</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(HANYU_VI_GLOSS_SOURCE_URL)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: ZH.seal }}>Nguồn nghĩa Việt · OpenCidian (CC BY-SA 4.0) ↗</Text>
        </Pressable>
      </View>

      <View style={{ gap: 12, marginTop: 18 }}>
        {HANYU_REVISED_VOLUMES.map((volume, index) => (
          <View key={volume.id} style={{ padding: 16, borderRadius: 18, borderWidth: 1.5, borderColor: ZH.line, backgroundColor: ZH.card }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: ZH.goldSoftBg }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: ZH.seal }}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 18, lineHeight: 24, fontWeight: '800', color: ZH.seal }}>{volume.title}</Text>
                <Text style={{ marginTop: 2, fontSize: 14, fontWeight: '700', color: ZH.ink }}>{volume.titleVi}</Text>
                <Text style={{ marginTop: 7, fontSize: 13, lineHeight: 19, color: ZH.ink2 }}>{volume.focus}</Text>
                <Text style={{ marginTop: 8, fontSize: 13, color: ZH.ink2 }}>
                  {volume.lessonCount} bài · ISBN {volume.isbn}
                </Text>
                <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(volume.publisherUrl)} style={{ marginTop: 10, alignSelf: 'flex-start' }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: ZH.seal }}>Xem trang tập sách chính thức ↗</Text>
                </Pressable>
                {volume.vocabularyTopicSlug ? (
                  <Pressable accessibilityRole="link" onPress={() => router.push(`/vocabulary/book/${HANYU_REVISED_VOCAB_BOOK_SLUG}/${volume.vocabularyTopicSlug}` as never)} style={{ marginTop: 9, alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: ZH.seal }}>Học từ vựng theo bài →</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 22 }}>
        <Text style={{ fontSize: 21, fontWeight: '800', color: ZH.seal }}>Nguồn từ vựng bổ trợ</Text>
        <Text style={{ marginTop: 4, fontSize: 13, lineHeight: 19, color: ZH.ink2 }}>
          Các bộ này đã có trong ReadUp để học thêm; giữ riêng khỏi thứ tự bài của Giáo trình Hán ngữ.
        </Text>
        <View style={{ gap: 10, marginTop: 10 }}>
          {CHINESE_SUPPLEMENTAL_SETS.map((set) => (
            <View key={set.slug} style={{ padding: 15, borderRadius: 16, borderWidth: 1, borderColor: ZH.line, backgroundColor: ZH.card }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: ZH.ink }}>{set.title}</Text>
              <Text style={{ marginTop: 4, fontSize: 13, color: ZH.ink2 }}>{set.wordCount.toLocaleString('vi-VN')} từ · {set.topicCount} chủ đề · {set.unitCount} buổi</Text>
              <Text style={{ marginTop: 5, fontSize: 13, lineHeight: 19, color: ZH.ink2 }}>{set.note}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
                <Pressable accessibilityRole="link" onPress={() => router.push(`/vocabulary/book/${set.slug}` as never)}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: ZH.seal }}>Học bộ từ trong ReadUp →</Text>
                </Pressable>
                {set.sourceLinks.map((source) => (
                  <Pressable key={source.label} accessibilityRole="link" onPress={() => void Linking.openURL(source.url)}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: ZH.seal }}>{source.label} ↗</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 12, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: ZH.line, backgroundColor: ZH.cream2 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: ZH.ink }}>{CHINESE_OPEN_COURSE.title}</Text>
          <Text style={{ marginTop: 4, fontSize: 13, lineHeight: 19, color: ZH.ink2 }}>
            Khóa OER công khai gồm {CHINESE_OPEN_COURSE.chapterCount} chương, có từ vựng và tư liệu nghe/xem. Giấy phép {CHINESE_OPEN_COURSE.license}; hiện chỉ liên kết tới nguồn, chưa sao chép nội dung vào ReadUp.
          </Text>
          <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(CHINESE_OPEN_COURSE.url)} style={{ marginTop: 9, alignSelf: 'flex-start' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: ZH.seal }}>Mở giáo trình OER ↗</Text>
          </Pressable>
        </View>

        <Text style={{ marginTop: 20, fontSize: 21, fontWeight: '800', color: ZH.seal }}>Nguồn học, bài đọc và video mở</Text>
        <View style={{ gap: 10, marginTop: 10 }}>
          {CHINESE_ADDITIONAL_COURSES.map((course) => (
            <View key={course.title} style={{ padding: 15, borderRadius: 16, borderWidth: 1, borderColor: ZH.line, backgroundColor: ZH.card }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: ZH.ink }}>{course.title}</Text>
              <Text style={{ marginTop: 4, fontSize: 13, lineHeight: 19, color: ZH.ink2 }}>{course.detail}</Text>
              <Text style={{ marginTop: 4, fontSize: 12, lineHeight: 18, color: ZH.ink2 }}>Giấy phép: {course.license} · {course.accessNote} Nội dung hiện mở qua liên kết, chưa sao chép vào ReadUp.</Text>
              <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(course.url)} style={{ marginTop: 9, alignSelf: 'flex-start' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: ZH.seal }}>Mở nguồn học liệu ↗</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <Text style={{ marginTop: 16, fontSize: 12, lineHeight: 18, color: ZH.ink2 }}>
        Đối chiếu ấn bản và ISBN: 北京语言大学出版社 (BLCUP). Từ vựng được gắn đúng bài và kèm số trang in. Nghĩa Việt chỉ hiện khi khớp chính xác chữ giản thể và pinyin với OpenCidian; các mục còn lại giữ nghĩa Anh trong sách.
      </Text>
    </Screen>
  );
}

