"""data/seoul-challenge-2026-2.json -> supabase/seed.sql"""
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
data = json.loads((root / "data" / "seoul-challenge-2026-2.json").read_text(encoding="utf-8"))


def q(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


rows = [
    f"  ({m['seed_no']}, {q(m['official_title'])}, '{m['official_level']}'::public.official_level, {q(m['title'])}, "
    f"'{m['category']}'::public.mission_category, {m['difficulty']}, {m['minutes']}, {q(m['verify_hint'])})"
    for m in data["missions"]
]

furniture = [
    ("plant", "화분", "window", {"type": "first_mission"}, 1),
    ("lamp", "스탠드", "desk", {"type": "streak", "days": 3}, 2),
    ("sofa", "소파", "floor", {"type": "streak", "days": 7}, 3),
    ("shoe_rack", "운동화 선반", "floor", {"type": "category_count", "category": "walk", "count": 5}, 4),
    ("clock", "벽시계", "wall", {"type": "first_weekly"}, 5),
    ("poster", "전시 포스터", "wall", {"type": "event_mission"}, 6),
]
frows = [
    f"  ({q(i)}, {q(n)}, '{s}'::public.furniture_slot_type, {q(json.dumps(r, ensure_ascii=False))}::jsonb, {o})"
    for i, n, s, r, o in furniture
]

sql = f"""-- 생성: scripts/build-seed.py (직접 수정하지 말 것)
-- 출처: {data['source']['title']} — {data['source']['url']}

insert into public.missions (seed_no, official_title, official_level, title, category, difficulty, minutes, verify_hint, source)
select v.*, 'seed'::public.mission_source from (values
{",\n".join(rows)}
) as v (seed_no, official_title, official_level, title, category, difficulty, minutes, verify_hint)
on conflict (seed_no) do update set
  official_title = excluded.official_title,
  official_level = excluded.official_level,
  title = excluded.title,
  category = excluded.category,
  difficulty = excluded.difficulty,
  minutes = excluded.minutes,
  verify_hint = excluded.verify_hint;

insert into public.furniture (id, name, slot_type, unlock_rule, sort) values
{",\n".join(frows)}
on conflict (id) do update set
  name = excluded.name,
  slot_type = excluded.slot_type,
  unlock_rule = excluded.unlock_rule,
  sort = excluded.sort;
"""
out = root / "supabase" / "seed.sql"
out.write_text(sql, encoding="utf-8", newline="\n")
sys.stdout.write(f"wrote {out.relative_to(root)}: {len(rows)} missions, {len(frows)} furniture\n")
