import React from 'react';
import { Text, View } from 'react-native';
import Head from 'expo-router/head';

import { LegalTabs } from '@/components/legal/LegalTabs';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui';
import { buildLegalDoc, formatDateVi, type LegalBlock, type LegalDocId } from '@/content/legal';

function Block({ block }: { block: LegalBlock }) {
  if (block.kind === 'list') {
    return (
      <View className="mt-2 gap-1.5">
        {block.items.map((item, i) => (
          <View key={i} className="flex-row gap-2">
            <Text className="font-sans text-body text-muted">•</Text>
            <Text className="min-w-0 flex-1 font-sans text-body text-ink">{item}</Text>
          </View>
        ))}
      </View>
    );
  }
  if (block.kind === 'note') {
    return (
      <View className="mt-3 rounded-panel border border-border bg-surface px-4 py-3">
        <Text className="font-sans text-body text-ink">{block.text}</Text>
      </View>
    );
  }
  return <Text className="mt-2 font-sans text-body text-ink">{block.text}</Text>;
}

/** Một trong ba trang pháp lý (điều khoản, quyền riêng tư, hoàn tiền): mở được cho khách, không cần đăng nhập. */
export function LegalDocView({ id }: { id: LegalDocId }) {
  const doc = buildLegalDoc(id);
  return (
    <Screen>
      <Head>
        <title>{`${doc.title} · Band 9`}</title>
      </Head>
      <LegalTabs active={id} />
      <View className="mt-4">
        <Text accessibilityRole="header" className="font-heavy text-pageTitle text-ink">
          {doc.title}
        </Text>
        <Text className="mt-2 font-sans text-bodyLg text-muted">{doc.lead}</Text>
        <Text className="mt-2 font-sans text-label text-muted">Cập nhật {formatDateVi(doc.updatedAt)}</Text>
      </View>
      <Card className="mt-4">
        {doc.sections.map((section, index) => (
          <View key={section.id} className={index > 0 ? 'mt-6' : ''}>
            <Text accessibilityRole="header" className="font-heavy text-sectionTitle text-ink">
              {section.heading}
            </Text>
            {section.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </View>
        ))}
      </Card>
    </Screen>
  );
}
