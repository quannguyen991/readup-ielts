import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import type { ReaderTool } from '@/components/reader/PassageView';
import { useL } from '@/i18n/useL';

type Props = {
  tool: ReaderTool;
  onPickTool: (tool: ReaderTool) => void;
  onNotes: () => void;
  notesOpen: boolean;
  highlightColorDot?: string;
  onClearHighlights?: () => void;
  hasHighlights?: boolean;
};

export function IeltsPassageToolbar({
  tool,
  onPickTool,
  onNotes,
  notesOpen,
  highlightColorDot = '#FDE047',
  onClearHighlights,
  hasHighlights = false,
}: Props) {
  const { L } = useL();

  return (
    <View className="flex-row items-center gap-1.5 border-b border-gray-100 bg-white/95 px-4 py-2 backdrop-blur-xs">
      {/* 1. Pointer / Select tool */}
      <Pressable
        onPress={() => onPickTool('read')}
        accessibilityRole="button"
        accessibilityLabel={L('Con trỏ', 'Pointer')}
        className={`h-8 w-8 items-center justify-center rounded-lg border ${
          tool === 'read' ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-200 bg-white hover:bg-gray-50'
        }`}
      >
        <Icon name="compass" size={15} color={tool === 'read' ? '#2563EB' : '#64748B'} strokeWidth={2} />
      </Pressable>

      {/* 2. Highlight color circle indicator */}
      <View
        className="h-5 w-5 rounded-full border border-gray-300 shadow-2xs ml-1"
        style={{ backgroundColor: highlightColorDot }}
      />

      {/* 3. Highlight button */}
      <Pressable
        onPress={() => onPickTool(tool === 'highlight' ? 'read' : 'highlight')}
        accessibilityRole="button"
        accessibilityLabel={L('Tô sáng', 'Highlight')}
        className={`h-8 flex-row items-center gap-1.5 rounded-lg border px-2.5 ${
          tool === 'highlight' ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-gray-200 bg-white hover:bg-gray-50'
        }`}
      >
        <Icon name="pencil" size={14} color={tool === 'highlight' ? '#6A4BD9' : '#64748B'} strokeWidth={2} />
        <Text className={`text-xs font-semibold ${tool === 'highlight' ? 'text-amber-800' : 'text-gray-700'}`}>
          {L('Highlight', 'Highlight')}
        </Text>
      </Pressable>

      {/* 4. Ghi chú (Notes) button */}
      <Pressable
        onPress={onNotes}
        accessibilityRole="button"
        accessibilityLabel={L('Ghi chú', 'Notes')}
        className={`h-8 flex-row items-center gap-1.5 rounded-lg border px-2.5 ${
          notesOpen ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-gray-200 bg-white hover:bg-gray-50'
        }`}
      >
        <Icon name="note" size={14} color={notesOpen ? '#E11D48' : '#64748B'} strokeWidth={2} />
        <Text className={`text-xs font-semibold ${notesOpen ? 'text-rose-700' : 'text-gray-700'}`}>
          {L('Ghi chú', 'Notes')}
        </Text>
      </Pressable>

      {/* 5. Tra nghĩa (Dictionary / Vocab) button */}
      <Pressable
        onPress={() => onPickTool(tool === 'vocab' ? 'read' : 'vocab')}
        accessibilityRole="button"
        accessibilityLabel={L('Tra nghĩa', 'Look up')}
        className={`h-8 flex-row items-center gap-1.5 rounded-lg border px-2.5 ${
          tool === 'vocab' ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white hover:bg-gray-50'
        }`}
      >
        <Icon name="search" size={14} color={tool === 'vocab' ? '#4F46E5' : '#64748B'} strokeWidth={2} />
        <Text className={`text-xs font-semibold ${tool === 'vocab' ? 'text-indigo-700' : 'text-gray-700'}`}>
          {L('Tra nghĩa', 'Dictionary')}
        </Text>
      </Pressable>

      {hasHighlights && onClearHighlights ? (
        <Pressable
          onPress={onClearHighlights}
          className="ml-auto px-2 py-1"
          accessibilityRole="button"
        >
          <Text className="text-[11px] font-medium text-gray-400 hover:text-gray-600 underline">
            {L('Xoá highlight', 'Clear')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
