import test from 'node:test';
import assert from 'node:assert/strict';

import { currentEventsTitle, currentEventsUrl, parseCurrentEvents, wikiToPlain } from './wiki-current-events';

/**
 * Canh bộ đổi wikitext thành tin tiếng Anh. Mỗi ca là một kiểu đánh dấu thật hay gặp
 * trên trang Current events; nếu Wikipedia đổi cách viết thì ca nào hỏng sẽ lộ ra ở đây.
 */

test('đổi liên kết wiki: có nhãn thì lấy nhãn, không có thì lấy tên đích', () => {
  assert.equal(
    wikiToPlain('[[Brazil]]ian [[Ministry of Environment and Climate Change (Brazil)|environment minister]] reports'),
    'Brazilian environment minister reports',
  );
  assert.equal(wikiToPlain('The [[Amazon rainforest]] is large.'), 'The Amazon rainforest is large.');
});

test('mẫu convert đổi thành số và đơn vị có chỉ số trên', () => {
  assert.equal(
    wikiToPlain('fell to {{convert|5796|km2|sqmi|abbr=on}} in the year'),
    'fell to 5796 km² in the year',
  );
});

test('thẻ tham chiếu, chú thích HTML và mẫu khác bị bỏ', () => {
  assert.equal(wikiToPlain('Text.<ref name="x">{{cite news|title=A}}</ref> More'), 'Text. More');
  assert.equal(wikiToPlain('a<!-- hidden note -->b'), 'ab');
  assert.equal(wikiToPlain('Done.{{citation needed}}'), 'Done.');
});

test('liên kết ngoài có nhãn thì giữ nhãn, không có nhãn thì bỏ', () => {
  assert.equal(wikiToPlain("'''bold''' and ''italic'' with [https://example.com the site]."), 'bold and italic with the site.');
  assert.equal(wikiToPlain('Source [https://example.com].'), 'Source.');
});

test('thực thể HTML và khoảng trắng: &nbsp;, &amp;, số thập phân, dấu câu sát chữ', () => {
  assert.equal(wikiToPlain('&nbsp;&amp; &#8211; done'), '& – done');
  assert.equal(wikiToPlain('Hello , world .'), 'Hello, world.');
});

test('mẫu lồng nhau được xử lý hết', () => {
  assert.equal(wikiToPlain('x {{nowrap|{{convert|3|km2}}}} y'), 'x 3 km² y');
});

test('tách tin theo mục: bỏ phần mở đầu, gạch cấp 2 thành ý chi tiết, bỏ dòng quá ngắn', () => {
  const wt = [
    '{{Current events|year=2026|month=10|day=16|top=yes}}',
    '<!-- All news items below this line -->',
    "'''Health and environment'''",
    '*[[Deforestation of the Amazon rainforest]]',
    '**[[Brazil]]ian [[Ministry]] says deforestation fell to {{convert|5796|km2|sqmi|abbr=on}}.',
    '*Short',
    "'''Sport'''",
    '*Team wins the championship after a late goal in the final match.',
  ].join('\n');

  const items = parseCurrentEvents(wt, '2026-10-16');
  assert.equal(items.length, 2);
  assert.deepEqual(items[0], {
    id: '2026-10-16-1',
    date: '2026-10-16',
    section: 'Health and environment',
    headline: 'Deforestation of the Amazon rainforest',
    details: ['Brazilian Ministry says deforestation fell to 5796 km².'],
    sourceUrl: 'https://en.wikipedia.org/wiki/Portal:Current_events/2026_October_16',
    license: 'CC BY-SA 4.0',
  });
  assert.equal(items[1]?.section, 'Sport');
  assert.deepEqual(items[1]?.details, []);
});

test('tên trang và URL của một ngày', () => {
  assert.equal(currentEventsTitle('2026-10-16'), 'Portal:Current events/2026 October 16');
  assert.equal(currentEventsUrl('2026-03-02'), 'https://en.wikipedia.org/wiki/Portal:Current_events/2026_March_2');
});
