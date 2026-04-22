import { createReadStream } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, '여신협 대형가맹점리스트 _202601반기_공백제거_.txt');
const OUT_DIR = path.join(ROOT, 'public', 'large-merchants');

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const shards = new Map();
  let total = 0;
  let skipped = 0;

  const rl = createInterface({
    input: createReadStream(SRC, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line) continue;
    const bizNo = line.slice(0, 10);
    const name = line.slice(10).trim();
    if (!/^\d{10}$/.test(bizNo)) {
      skipped++;
      continue;
    }
    const key = bizNo.slice(0, 2);
    let shard = shards.get(key);
    if (!shard) {
      shard = {};
      shards.set(key, shard);
    }
    shard[bizNo] = name;
    total++;
  }

  const manifest = [];
  for (const [key, shard] of shards) {
    const file = path.join(OUT_DIR, `${key}.json`);
    await writeFile(file, JSON.stringify(shard));
    manifest.push({ key, count: Object.keys(shard).length });
  }
  manifest.sort((a, b) => a.key.localeCompare(b.key));
  await writeFile(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify({ total, shards: manifest.length, generatedAt: new Date().toISOString() }, null, 2)
  );

  console.log(`완료: ${total.toLocaleString()}건 / ${manifest.length}개 샤드 (스킵: ${skipped})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
