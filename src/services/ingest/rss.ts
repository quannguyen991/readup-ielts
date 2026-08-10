/**
 * Parser RSS/Atom tối giản, không phụ thuộc thư viện ngoài.
 * Chỉ lấy đúng những trường có sẵn công khai trong feed.
 */

export type FeedItem = {
  title: string;
  link: string;
  description: string;
  content: string | null;
  pubDate: string | null;
  guid: string;
  thumbnail: string | null;
};

export function parseFeed(xml: string): FeedItem[] {
  const entries = [...matchAll(xml, /<item[\s>][\s\S]*?<\/item>/gi)];
  const atomEntries = [...matchAll(xml, /<entry[\s>][\s\S]*?<\/entry>/gi)];
  const blocks = entries.length > 0 ? entries : atomEntries;

  return blocks
    .map<FeedItem | null>((block) => {
      const title = decode(pickTag(block, 'title') ?? '');
      const link = pickLink(block);
      if (!title || !link) return null;

      const description = decode(
        pickTag(block, 'description') ?? pickTag(block, 'summary') ?? '',
      );
      const content =
        pickTag(block, 'content:encoded') ?? pickTag(block, 'content') ?? null;

      return {
        title,
        link,
        description: stripHtml(description),
        content: content ? stripHtml(decode(content)) : null,
        pubDate: pickTag(block, 'pubDate') ?? pickTag(block, 'published') ?? pickTag(block, 'updated'),
        guid: pickTag(block, 'guid') ?? pickTag(block, 'id') ?? link,
        thumbnail: pickThumbnail(block),
      };
    })
    .filter((item): item is FeedItem => item !== null);
}

function matchAll(input: string, re: RegExp): string[] {
  return input.match(re) ?? [];
}

function pickTag(block: string, tag: string): string | null {
  const escaped = tag.replace(':', '\\:');
  const re = new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)</${escaped}>`, 'i');
  const match = block.match(re);
  if (!match?.[1]) return null;

  return match[1]
    .replace(/^\s*<!\[CDATA\[/, '')
    .replace(/\]\]>\s*$/, '')
    .trim();
}

function pickLink(block: string): string | null {
  const plain = pickTag(block, 'link');
  if (plain && /^https?:/i.test(plain)) return plain;

  const href = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
  return href?.[1] ?? null;
}

function pickThumbnail(block: string): string | null {
  const media = block.match(/<media:(?:thumbnail|content)[^>]*url=["']([^"']+)["']/i);
  if (media?.[1]) return media[1];

  const enclosure = block.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image\//i);
  return enclosure?.[1] ?? null;
}

export function stripHtml(html: string): string {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6]|section|article)>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function decode(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}
