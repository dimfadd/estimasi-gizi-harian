import { sql } from "@/lib/db";

const n = (v: unknown) => Number(v ?? 0);

/** Angka untuk halaman admin beta. Semua dihitung dari tabel events & food_logs. */
export async function betaStats() {
  const [totals] = await sql`
    select
      (select count(*) from users) as users,
      (select count(*) from users where consent_at is not null) as consented,
      (select count(*) from profiles) as profiles,
      (select count(*) from food_logs) as logs,
      (select count(distinct user_id) from events where created_at > now() - interval '1 day') as dau,
      (select count(distinct user_id) from events where created_at > now() - interval '7 days') as wau,
      (select count(distinct user_id) from events where created_at > now() - interval '30 days') as mau`;

  // Retensi: dari pengguna yang daftar ≥ N hari lalu, berapa yang aktif lagi di jendela hari ke-N.
  const windows: [string, number, number][] = [
    ["H+1", 1, 1],
    ["H+7 (hari 7–13)", 7, 13],
    ["H+30 (hari 30–36)", 30, 36],
  ];
  const retention = [];
  for (const [label, from, to] of windows) {
    const [r] = await sql`
      with cohort as (
        select id, created_at::date as d0 from users where created_at::date <= current_date - ${from}::int
      )
      select count(*) as eligible,
             count(*) filter (where exists (
               select 1 from events e where e.user_id = cohort.id
                 and e.created_at::date between cohort.d0 + ${from}::int and cohort.d0 + ${to}::int
             )) as kept
      from cohort`;
    retention.push({ label, eligible: n(r.eligible), kept: n(r.kept) });
  }

  const daily = await sql`
    with days as (select generate_series(current_date - 29, current_date, '1 day')::date as d)
    select to_char(d, 'YYYY-MM-DD') as day,
      (select count(*) from users u where u.created_at::date = d) as signups,
      (select count(distinct user_id) from events e where e.created_at::date = d) as active,
      (select count(*) from food_logs l where l.created_at::date = d) as logs
    from days order by d`;

  const [depth] = await sql`
    select coalesce(avg(c), 0) as logs_per_active_day from (
      select l.profile_id, l.log_date, count(*) as c from food_logs l
      where l.log_date > current_date - 30 group by 1, 2
    ) t`;

  const topFoods = await sql`
    select food_id, count(*) as n from food_logs where created_at > now() - interval '30 days'
    group by food_id order by n desc limit 20`;
  const misses = await sql`
    select props->>'q' as q, count(*) as n from events
    where name = 'search_miss' and created_at > now() - interval '30 days' and props->>'q' <> ''
    group by 1 order by n desc limit 30`;
  const feedback = await sql`
    select f.text, f.page, f.created_at, u.email from feedback f left join users u on u.id = f.user_id
    order by f.created_at desc limit 50`;
  const [samples] = await sql`select count(*) as n, count(distinct user_id) as users from photo_samples`;
  const goals = await sql`
    select input->>'goal' as goal, count(*) as n from profiles group by 1 order by n desc`;

  const [pro] = await sql`
    select (select count(*) from users where pro_until > now()) as active,
           (select count(distinct user_id) from events where name = 'pro_interest') as interested,
           (select count(distinct user_id) from events where name = 'pro_view') as viewed,
           (select count(*) from activities where created_at > now() - interval '30 days') as activities`;
  const photos = await sql<{ ai_items: { items: { foodId: string; amount: number; fried: boolean; sweet: number }[] }; final_items: { foodId: string; amount: number; fried: boolean; sweet: number }[] | null; input_tokens: number; output_tokens: number; model: string }>`
    select ai_items, final_items, input_tokens, output_tokens, model from photo_ai order by id desc limit 500`;

  return {
    pro: { active: n(pro.active), interested: n(pro.interested), viewed: n(pro.viewed), activities: n(pro.activities) },
    photos,
    totals: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, n(v)])),
    retention,
    daily: daily.map((d) => ({ day: String(d.day), signups: n(d.signups), active: n(d.active), logs: n(d.logs) })),
    logsPerActiveDay: n(depth.logs_per_active_day),
    topFoods: topFoods.map((r) => ({ id: String(r.food_id), n: n(r.n) })),
    misses: misses.map((r) => ({ q: String(r.q), n: n(r.n) })),
    feedback: feedback.map((r) => ({ text: String(r.text), page: String(r.page ?? ""), at: String(r.created_at), email: String(r.email ?? "") })),
    samples: { n: n(samples.n), users: n(samples.users) },
    goals: goals.map((r) => ({ goal: String(r.goal), n: n(r.n) })),
  };
}

/** Sampel foto + label untuk uji akurasi (diekspor sebagai JSON oleh admin). */
export async function sampleExport() {
  return sql`
    select s.id, s.blob_url, to_char(s.log_date, 'YYYY-MM-DD') as date, s.meal, s.items, p.input->>'heightCm' as height_cm,
           p.input->>'sex' as sex, s.created_at
    from photo_samples s left join profiles p on p.id = s.profile_id order by s.id`;
}
