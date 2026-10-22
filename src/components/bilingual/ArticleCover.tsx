import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { CuteBook, CuteGlobe, CutePencil, CutePlane } from '@/components/illust/Cute';
import { CuteChat, CutePlant, CuteRocket } from '@/components/illust/CuteMore';
import type { BilingualArticle } from '@/data/bilingual-repository';

type Art = (p: { size?: number }) => React.ReactElement;

/**
 * Bảy nhóm chủ đề của cổng báo. Chủ đề gốc của các bài báo viết tự do ("Y học & Sức khỏe
 * công cộng", "Thiên văn học & Vũ trụ"...), nên gom về nhóm bằng từ khoá. Mỗi nhóm có màu
 * và hình minh hoạ riêng, dùng khi bài chưa có ảnh bìa thật.
 */
export type CategoryKey = 'science' | 'tech' | 'culture' | 'social' | 'health' | 'education' | 'vietnam';

export const CATEGORIES: Record<CategoryKey, { label: string; short: string; colors: [string, string]; art: Art }> = {
  science: { label: 'Khoa học & môi trường', short: 'Khoa học', colors: ['#1E7F5C', '#7BD389'], art: CuteGlobe },
  tech: { label: 'Công nghệ & kinh tế', short: 'Công nghệ', colors: ['#1E3A8A', '#60A5FA'], art: CuteRocket },
  culture: { label: 'Lịch sử & văn hoá', short: 'Văn hoá', colors: ['#2B2350', '#F59E0B'], art: CuteBook },
  social: { label: 'Đời sống & xã hội', short: 'Xã hội', colors: ['#9D174D', '#F9A8D4'], art: CuteChat },
  health: { label: 'Sức khoẻ', short: 'Sức khoẻ', colors: ['#B91C1C', '#FCA5A5'], art: CutePlant },
  education: { label: 'Ngôn ngữ & giáo dục', short: 'Giáo dục', colors: ['#5B21B6', '#C4B5FD'], art: CutePencil },
  vietnam: { label: 'Việt Nam & khu vực', short: 'Việt Nam', colors: ['#0E7490', '#67E8F9'], art: CutePlane },
};

export const CATEGORY_ORDER: CategoryKey[] = ['science', 'tech', 'culture', 'social', 'health', 'education', 'vietnam'];

/** Chủ đề gốc của bài → nhóm. Thứ tự luật quan trọng: "Giáo dục & Công nghệ" phải vào giáo dục trước. */
export function categoryOf(topic: string): CategoryKey {
  const t = topic.toLowerCase();
  if (/giáo dục|ngôn ngữ/.test(t)) return 'education';
  if (/y tế|y học|sức khoẻ|sức khỏe/.test(t)) return 'health';
  if (/khoa học|môi trường|sinh|thiên văn|vật lý|năng lượng|hải dương|khí hậu|tài nguyên|lâm|hệ sinh thái|thực vật|địa/.test(t)) return 'science';
  if (/công nghệ|kinh tế/.test(t)) return 'tech';
  if (/lịch sử|văn hoá|văn hóa/.test(t)) return 'culture';
  if (/việt nam|khu vực/.test(t)) return 'vietnam';
  return 'social';
}

export function topicArt(topic: string) {
  return CATEGORIES[categoryOf(topic)];
}

/**
 * Ảnh bìa của một bài. Có `cover` (đường dẫn ảnh trong app) thì hiện ảnh; chưa có thì
 * hiện nền màu theo chủ đề kèm hình minh hoạ.
 */
export function ArticleCover({ article, height }: { article: Pick<BilingualArticle, 'topic' | 'cover'>; height: number }) {
  if (article.cover) {
    return <Image source={{ uri: article.cover }} style={{ width: '100%', height }} contentFit="cover" accessibilityIgnoresInvertColors />;
  }
  const { colors, art: Illustration } = topicArt(article.topic);
  return (
    <View style={{ width: '100%', height, overflow: 'hidden' }}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', width: height * 1.1, height: height * 1.1, borderRadius: height, right: -height * 0.25, top: -height * 0.3, backgroundColor: 'rgba(255,255,255,0.14)' }} />
        <View style={{ position: 'absolute', width: height * 0.6, height: height * 0.6, borderRadius: height, left: -height * 0.12, bottom: -height * 0.2, backgroundColor: 'rgba(255,255,255,0.12)' }} />
        <Illustration size={Math.round(height * 0.5)} />
      </LinearGradient>
    </View>
  );
}
