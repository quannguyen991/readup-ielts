/**
 * Nút + bảng CHỌN BỘ TỪ cho các trò của Quest (Toa Từ Vựng, câu cá). Viết bằng
 * DOM thường vì cả hai màn đều là trang web thuần (canvas / three.js).
 *
 * Nhóm: Gợi ý (Tự động, Ôn hôm nay) · Của bạn (sổ từ, bộ tự tạo) · IELTS · SAT,
 * có ô tìm. Chọn xong câu hỏi kế tiếp lấy từ bộ mới.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { useQuestDecks, useWordPools } from './useWordPools';
import type { QuestDeck, QuestSource } from '@/services/vocab/quest-words';
import { useQuestVocabStore } from '@/store/useQuestVocabStore';

type Theme = 'dark' | 'light';

const T = {
  dark: { btnBg: 'rgba(255,255,255,0.08)', btnInk: '#F4EFE3', border: 'rgba(255,255,255,0.16)', sheet: '#16181F', ink: '#F4EFE3', muted: '#A9A391', row: 'rgba(255,255,255,0.05)', rowOn: '#F2B632', rowOnInk: '#1A1405' },
  light: { btnBg: '#FFFFFF', btnInk: '#0F172A', border: '#E2E8F0', sheet: '#FFFFFF', ink: '#0F172A', muted: '#64748B', row: '#F8FAFC', rowOn: '#4A7FE8', rowOnInk: '#FFFFFF' },
};

export function QuestWordPicker({ theme = 'dark', compact = false }: { theme?: Theme; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const { label, due } = useWordPools();
  const c = T[theme];
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Bộ từ đang học: ${label}. Bấm để đổi`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, maxWidth: '100%', padding: compact ? '6px 10px' : '8px 14px', borderRadius: 999, border: `1px solid ${c.border}`, background: c.btnBg, color: c.btnInk, font: 'inherit', fontSize: compact ? 13 : 14, fontWeight: 600, cursor: 'pointer' }}
      >
        <span aria-hidden>📚</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{label}</span>
        {due > 0 ? (
          <span style={{ borderRadius: 999, padding: '1px 8px', background: '#E0533D', color: '#FFFFFF', fontSize: 12 }} title="Từ đến hạn ôn hôm nay">
            {due}
          </span>
        ) : null}
        <span aria-hidden>▾</span>
      </button>
      {open && typeof document !== 'undefined' ? createPortal(<Sheet theme={theme} onClose={() => setOpen(false)} />, document.body) : null}
    </>
  );
}

function Sheet({ theme, onClose }: { theme: Theme; onClose: () => void }) {
  const c = T[theme];
  const decks = useQuestDecks();
  const { due } = useWordPools();
  const source = useQuestVocabStore((s) => s.source);
  const setSource = useQuestVocabStore((s) => s.setSource);
  const [q, setQ] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // Không để phím 1–4 / Space của màn chơi chạy khi đang chọn bộ.
      e.stopPropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const needle = q.trim().toLowerCase();
  const groups = useMemo(() => {
    const hit = (d: QuestDeck) => !needle || d.name.toLowerCase().includes(needle) || d.slug.includes(needle);
    return [
      { title: 'Của bạn', items: decks.filter((d) => d.group === 'mine' && hit(d)) },
      { title: 'Chủ đề IELTS', items: decks.filter((d) => d.group === 'ielts' && hit(d)) },
      { title: 'Từ vựng SAT', items: decks.filter((d) => d.group === 'sat' && hit(d)) },
    ].filter((g) => g.items.length > 0);
  }, [decks, needle]);

  const choose = (s: QuestSource) => {
    setSource(s);
    onClose();
  };

  return (
    <div role="presentation" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(6,8,14,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Chọn bộ từ để học"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(520px, 100%)', maxHeight: 'min(640px, 90vh)', display: 'flex', flexDirection: 'column', borderRadius: 20, background: c.sheet, color: c.ink, border: `1px solid ${c.border}`, boxShadow: '0 24px 60px rgba(0,0,0,0.4)', overflow: 'hidden' }}
      >
        <div style={{ padding: '16px 18px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Học bộ từ nào?</div>
            <div style={{ fontSize: 13, color: c.muted }}>Trả lời ở đây được ghi vào lịch ôn của bộ đó.</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" style={{ border: 'none', background: 'transparent', color: c.ink, fontSize: 20, cursor: 'pointer' }}>
            ✕
          </button>
        </div>
        <div style={{ padding: '0 18px 10px' }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm bộ từ…"
            aria-label="Tìm bộ từ"
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 12, border: `1px solid ${c.border}`, background: c.row, color: c.ink, font: 'inherit', fontSize: 14 }}
          />
        </div>
        <div role="listbox" style={{ overflowY: 'auto', padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {!needle ? (
            <>
              <GroupTitle c={c} text="Gợi ý" />
              <Row c={c} onPick={choose} on={source === 'auto'} s="auto" icon="✨" title="Tự động" sub="Từ bạn đang học dở ở mọi bộ" />
              <Row c={c} onPick={choose} on={source === 'due'} s="due" icon="⏰" title={`Ôn hôm nay${due ? ` · ${due} từ` : ''}`} sub={due ? 'Các từ đến hạn theo lịch ôn' : 'Hôm nay chưa có từ đến hạn'} />
            </>
          ) : null}
          {groups.map((g) => (
            <React.Fragment key={g.title}>
              <GroupTitle c={c} text={g.title} />
              {g.items.map((d) => (
                <Row key={d.slug} c={c} onPick={choose} on={source === d.slug} s={d.slug} icon={d.group === 'mine' ? '📒' : d.group === 'sat' ? '🎯' : '🌏'} title={d.name} sub={`${d.words.length} từ`} />
              ))}
            </React.Fragment>
          ))}
          {needle && groups.length === 0 ? <div style={{ color: c.muted, fontSize: 14, padding: 12 }}>Không có bộ nào khớp.</div> : null}
        </div>
      </div>
    </div>
  );
}

type RowProps = { s: QuestSource; title: string; sub: string; icon: string; on: boolean; c: (typeof T)['dark']; onPick: (s: QuestSource) => void };

function Row({ s, title, sub, icon, on, c, onPick }: RowProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={on}
      onClick={() => onPick(s)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 12, border: 'none', background: on ? c.rowOn : c.row, color: on ? c.rowOnInk : c.ink, font: 'inherit', cursor: 'pointer' }}
    >
      <span aria-hidden style={{ fontSize: 18 }}>
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        <span style={{ display: 'block', fontSize: 12, opacity: 0.75 }}>{sub}</span>
      </span>
      {on ? <span aria-hidden>✓</span> : null}
    </button>
  );
}

function GroupTitle({ c, text }: { c: (typeof T)['dark']; text: string }) {
  return <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase', color: c.muted }}>{text}</div>;
}
