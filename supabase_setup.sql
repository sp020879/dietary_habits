-- ════════════════════════════════════════════════════
--  飲食日記 — Supabase 資料表與權限設定
--  在 Supabase 後台左側 SQL Editor 貼上整段、按 Run 即可
-- ════════════════════════════════════════════════════

-- 1. 建立記錄表
create table if not exists public.food_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  meal       text,
  health     text,
  note       text,
  day        date,
  time       text,
  created_at timestamptz not null default now()
);

-- 2. 加快依使用者 / 日期查詢
create index if not exists food_entries_user_day_idx
  on public.food_entries (user_id, day);

-- 3. 開啟 Row Level Security（每個人只能存取自己的資料）
alter table public.food_entries enable row level security;

-- 4. 權限政策：只能讀/寫/刪自己的列
drop policy if exists "own rows - select" on public.food_entries;
create policy "own rows - select" on public.food_entries
  for select using (auth.uid() = user_id);

drop policy if exists "own rows - insert" on public.food_entries;
create policy "own rows - insert" on public.food_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "own rows - update" on public.food_entries;
create policy "own rows - update" on public.food_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows - delete" on public.food_entries;
create policy "own rows - delete" on public.food_entries
  for delete using (auth.uid() = user_id);
