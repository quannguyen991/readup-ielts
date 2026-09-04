-- ============================================================================
-- Bản dịch tiếng Việt của bài đọc — BỘ NHỚ ĐỆM DÙNG CHUNG.
--
-- Đây là quyết định thiết kế quan trọng nhất của tính năng song ngữ: bản dịch
-- KHÔNG thuộc về người dùng nào. Một bài dịch xong là cả app đọc được, mãi mãi.
--
-- Vì sao: dịch là lời gọi AI, tức là tiền thật. Nếu mỗi người dịch riêng thì chi
-- phí tăng theo SỐ NGƯỜI × SỐ BÀI — không đời nào gánh nổi ở gói 39k. Dùng chung
-- thì chi phí có trần cứng: 1.401 bài, dịch một lần, hết. Người thứ hai trở đi
-- đọc miễn phí và đọc ngay, không phải chờ.
--
-- Làm được thế vì kho bài toàn CC-BY-SA (Wikipedia) và public domain (Project
-- Gutenberg, NASA) — cả hai đều cho phép tác phẩm phái sinh. Bài `headline_only`
-- không có toàn văn nên không bao giờ vào đây.
-- ============================================================================

create table article_translations (
  -- Id của bài trong seed (`src/data/seed/index.json`), không phải khoá ngoại tới
  -- bảng `articles`: nguồn sự thật của nội dung là file seed đi kèm bundle, còn
  -- bảng `articles` có thể rỗng ở một môi trường mới dựng.
  article_id text not null,
  lang text not null default 'vi',
  -- Mảng chuỗi, MỘT PHẦN TỬ MỘT ĐOẠN, cùng thứ tự với bản gốc.
  paragraphs jsonb not null,
  /*
    Vân tay của văn bản gốc.

    Bài đọc nằm trong bundle, và một lần cào lại có thể đổi nội dung. Không có
    cột này thì bản dịch cũ vẫn được phục vụ cho một bài đã khác — người đọc
    thấy tiếng Anh một đằng tiếng Việt một nẻo mà không hiểu vì sao.
  */
  source_hash text not null,
  model text not null,
  created_at timestamptz not null default now(),

  primary key (article_id, lang)
);

alter table article_translations enable row level security;

-- AI ĐỌC ĐƯỢC: bản dịch là nội dung công khai phái sinh từ nguồn mở, và người
-- chưa đăng nhập cũng phải đọc được — đó là cả điểm của việc dùng chung.
create policy article_translations_read on article_translations
  for select using (true);

-- Chỉ service_role ghi. Không có policy insert/update cho anon/authenticated, và
-- quyền cũng bị thu hồi: client tự ghi được thì ai cũng nhét được văn bản tuỳ ý
-- vào chỗ mà mọi người dùng khác sẽ đọc.
revoke insert, update, delete, truncate on article_translations from authenticated, anon;
