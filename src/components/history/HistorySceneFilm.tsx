import React from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';

import { useL } from '@/i18n/useL';
import { readingFont } from '@/lib/readingFonts';
import type { SceneVideo } from '@/services/history/types';

const WEB = Platform.OS === 'web';

/** A user-controlled scene film with its historical scope made explicit. */
export function HistorySceneFilm({ film }: { film: SceneVideo }) {
  const { L, en } = useL();

  return (
    <View style={{ width: '100%', overflow: 'hidden', borderRadius: 20, borderWidth: 1, borderColor: '#D8D4C8', backgroundColor: '#F3F0FB', padding: 16 }}>
      <Text style={{ fontFamily: readingFont.sansBold, fontSize: 18, color: '#202A24' }}>
        {en ? film.title.en : film.title.vi}
      </Text>
      <Text style={{ marginTop: 6, fontFamily: readingFont.sans, fontSize: 14, lineHeight: 22, color: '#566158' }}>
        {en ? film.description.en : film.description.vi}
      </Text>
      {WEB ? (
        <video
          controls
          playsInline
          preload="none"
          poster={film.poster}
          aria-label={en ? film.title.en : film.title.vi}
          style={{ display: 'block', width: '100%', aspectRatio: 16 / 9, marginTop: 14, borderRadius: 12, backgroundColor: '#151713' }}
        >
          <source src={film.file} type="video/mp4" />
          {L('Trình duyệt của bạn chưa hỗ trợ phát video.', 'Your browser does not support video playback.')}
        </video>
      ) : (
        <Pressable
          accessibilityRole="link"
          onPress={() => void Linking.openURL(film.file)}
          style={{ marginTop: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#233B35', paddingHorizontal: 16 }}
        >
          <Text style={{ fontFamily: readingFont.sansBold, fontSize: 14, color: '#FFFFFF' }}>{L('Mở video', 'Open video')}</Text>
        </Pressable>
      )}
    </View>
  );
}
