-- 방어잡기 전역 랭킹 스키마 (PRD §5.4)
-- Supabase SQL Editor 또는 CLI(`supabase db push`)로 실행한다.

create extension if not exists "pgcrypto";

-- scores: 기기(device_id)별 최고 기록 1행 (upsert로 갱신)
create table if not exists public.scores (
  id          uuid primary key default gen_random_uuid(),
  device_id   uuid not null unique,                                   -- 기기별 식별, upsert 키
  nickname    text not null check (char_length(nickname) between 2 and 8),
  score       integer not null check (score >= 0),
  catch_count integer not null check (catch_count >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 랭킹 정렬: 마릿수 desc → 점수 desc → 먼저 등록한 순
create index if not exists scores_rank_idx
  on public.scores (catch_count desc, score desc, created_at asc);

-- ── RLS ──────────────────────────────────────────────────────────
-- 조회는 누구나 가능. 기록 등록/갱신은 아래 submit_score 함수로만 처리하고
-- 테이블에 대한 직접 insert/update/delete 는 열어두지 않는다(타인 기록 훼손 방지).
alter table public.scores enable row level security;

drop policy if exists "scores_select_all" on public.scores;
create policy "scores_select_all"
  on public.scores for select
  using (true);

-- ── 등록/갱신 RPC ────────────────────────────────────────────────
-- device_id 기준 upsert. 새 기록이 기존보다 나을 때(마릿수, 동률이면 점수)만 갱신.
-- security definer 로 테이블 권한 없이도 실행되게 하고, 검증은 함수 안에서 한다.
create or replace function public.submit_score(
  p_device_id   uuid,
  p_nickname    text,
  p_score       integer,
  p_catch_count integer
) returns public.scores
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nickname text := trim(p_nickname);
  v_row public.scores;
begin
  if char_length(v_nickname) < 2 or char_length(v_nickname) > 8 then
    raise exception '닉네임은 2~8자여야 합니다';
  end if;

  insert into public.scores (device_id, nickname, score, catch_count)
    values (p_device_id, v_nickname, greatest(p_score, 0), greatest(p_catch_count, 0))
  on conflict (device_id) do update
    set nickname    = excluded.nickname,
        score       = excluded.score,
        catch_count = excluded.catch_count,
        updated_at  = now()
    where excluded.catch_count > public.scores.catch_count
       or (excluded.catch_count = public.scores.catch_count
           and excluded.score > public.scores.score)
  returning * into v_row;

  -- 갱신 조건에 안 맞아 아무 행도 안 바뀌면 기존 기록을 반환
  if v_row.id is null then
    select * into v_row from public.scores where device_id = p_device_id;
  end if;

  return v_row;
end;
$$;

-- 익명(anon) 및 인증 사용자에게 조회/함수 실행 권한 부여
grant select on public.scores to anon, authenticated;
grant execute on function public.submit_score(uuid, text, integer, integer) to anon, authenticated;
