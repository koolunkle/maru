// main에는 spec delta가 있는 열린 change가 없어야 한다(CONTRIBUTING 3.2 5단계: 합치기 전에 archive).
// skip_specs change(동작이 그대로인 작업)는 delta가 없으므로 열려 있어도 된다.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = 'openspec/changes';
const open = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== 'archive')
  .map((d) => d.name)
  .filter((name) => existsSync(join(root, name, 'specs')));

if (open.length) {
  console.error(
    `archive하지 않은 change에 spec delta가 있어요: ${open.join(', ')}\n` +
      '합치기 전에 같은 PR에서 `npm run spec -- archive <이름>`을 실행해 주세요.',
  );
  process.exit(1);
}
console.log('spec delta가 남은 열린 change가 없어요.');
