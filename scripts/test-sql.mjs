// supabase/tests/*.sql을 로컬 DB에서 차례로 돌린다. 각 파일은 끝에서 롤백한다.
// 먼저 `npx supabase start`로 로컬 DB를 띄운다. 컨테이너 이름은 저장소 폴더 이름을 따른다(supabase_db_<폴더>).
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const container = `supabase_db_${basename(process.cwd())}`;
const dir = 'supabase/tests';
let failed = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql'))) {
  const run = spawnSync(
    'docker',
    ['exec', '-i', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q'],
    { input: readFileSync(join(dir, file)), encoding: 'utf8' },
  );
  if (run.status === 0) {
    console.log(`ok   ${file}`);
    continue;
  }
  failed++;
  const error = (run.stderr || run.error?.message || '').split('\n').filter(Boolean).slice(0, 3);
  console.log(`FAIL ${file}\n  ${error.join('\n  ')}`);
}
if (failed) {
  console.error(`${failed}개 실패`);
  process.exit(1);
}
