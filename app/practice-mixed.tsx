import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { ArticleCard } from '@/components/article/ArticleCard';
import { Grid } from '@/components/layout/Grid';
import { Screen } from '@/components/layout/Screen';
import { Appear } from '@/components/motion/Motion';
import { HeroBanner, Pagination } from '@/components/ui';
import { filterArticles, isReadable, type ArticleMeta } from '@/data/articles';
import { useL } from '@/i18n/useL';

/**
 * LUYỆN XEN KẼ DẠNG BÀI — nhánh đối lập của Mock Test.
 *
 * Mock Test đi thành khối như đề thật: bảy câu TRUE/FALSE liền nhau, rồi sáu câu
 * điền từ. Đúng nhịp phòng thi, nhưng có một chỗ nó KHÔNG luyện được — tới câu
 * thứ hai của khối thì người học đã thôi đọc lời dẫn, vì biết thừa sáu câu tới
 * cũng là dạng ấy.
 *
 * Ở đây các dạng bị trộn có chủ đích, nên mỗi câu phải tự nhận ra mình đang gặp
 * dạng gì trước khi làm. Đây là chỗ dành cho giai đoạn mới học dạng; vào gần
 * ngày thi thì quay lại Mock Test để lấy lại nhịp.
 */
const PAGE_SIZE = 12;

export default function MixedPracticeScreen() {
  const { L } = useL();
  const [page, setPage] = useState(0);

  const articles = useMemo(
    () => filterArticles({ exam: 'ielts' }).filter((a) => isReadable(a)),
    [],
  );

  const shown = articles.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <Screen>
      <HeroBanner
        title={L('Luyện xen kẽ dạng bài', 'Mixed question-type practice')}
        subtitle={L('Các dạng câu bị trộn lẫn trong cùng một bài, không đi thành khối như đề thi. Dùng khi đang học phân biệt dạng — nhận ra dạng trước, làm sau.', "Question types are shuffled within each passage instead of coming in blocks like the real test. Use it while you're learning to tell types apart — spot the type first, then answer.")}
        illustration="mock-tests-hero"
      />

      <View className="mt-4">
        <Text className="font-mid text-label text-muted">
          <Text className="font-heavy text-ink">{articles.length}</Text>{L(' bài đọc', ' passages')}
        </Text>
      </View>

      <View className="mt-3">
        <Grid columns={3} tabletColumns={2} mobileColumns={1}>
          {shown.map((article: ArticleMeta, i: number) => (
            <Appear key={article.id} index={i}>
              <ArticleCard article={article} layout="cover" query="mode=mixed" />
            </Appear>
          ))}
        </Grid>
      </View>

      <View className="mt-4">
        <Pagination
          page={page}
          pageCount={Math.ceil(articles.length / PAGE_SIZE)}
          onChange={setPage}
        />
      </View>
    </Screen>
  );
}
