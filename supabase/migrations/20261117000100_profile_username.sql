-- Tên người dùng (@username) để kết bạn chính xác: duy nhất, không phân biệt hoa thường.
alter table profiles add column if not exists username text;

alter table profiles drop constraint if exists profiles_username_format;
alter table profiles add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9_]{3,20}$');

create unique index if not exists profiles_username_unique on profiles (lower(username)) where username is not null;
