import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const packageDirectory = join(root, 'node_modules', '@twemoji', 'svg');
const outputDirectory = join(root, 'public', 'twemoji');
const sapiensOutputDirectory = join(root, 'public', 'sapiens');
const archetypesPath = join(root, 'src', 'data', 'archetypes.ts');
const source = await readFile(archetypesPath, 'utf8');
const availableFiles = new Set((await readdir(packageDirectory)).filter((file) => file.endsWith('.svg')));
const emojiSegments = [
  ...Array.from(source.matchAll(/\bperson\(\s*'[^']*'\s*,\s*'([^']+)'/gu), ([, icon]) => icon),
  ...Array.from(source.matchAll(/\bsymbol\(\s*'[^']*'\s*,\s*'([^']+)'/gu), ([, icon]) => icon),
  ...Array.from(source.matchAll(/\['[^']*'\s*,\s*'([^']+)'\]/gu), ([, icon]) => icon),
];

const tones = [0x1f3fb, 0x1f3fc, 0x1f3fd, 0x1f3fe, 0x1f3ff];
const person = (codepoint, tone, gender) => {
  const personEmoji = String.fromCodePoint(codepoint, ...(tone ? [tone] : []));
  return gender ? `${personEmoji}\u200d${String.fromCodePoint(gender, 0xfe0f)}` : personEmoji;
};

for (const tone of [undefined, ...tones]) {
  emojiSegments.push(
    person(0x1f9cd, tone),
    person(0x1f9cd, tone, 0x2640),
    person(0x1f9cd, tone, 0x2642),
    String.fromCodePoint(0x1f930, ...(tone ? [tone] : [])),
    `${String.fromCodePoint(0x1f9d1, ...(tone ? [tone] : []))}\u200d${String.fromCodePoint(0x1f37c)}`,
  );
}
emojiSegments.push(String.fromCodePoint(0x2b50));

const assets = new Map();
for (const icon of emojiSegments) {
  if (icon.startsWith('sapiens:')) continue;
  const codepoints = Array.from(icon, (character) => character.codePointAt(0).toString(16));
  const exactId = codepoints.join('-');
  const assetId = codepoints.filter((point) => point !== 'fe0f').join('-');
  const sourceId = availableFiles.has(`${exactId}.svg`)
    ? exactId
    : availableFiles.has(`${assetId}.svg`)
      ? assetId
      : null;
  if (!sourceId) throw new Error(`No se encontró el SVG Twemoji para ${exactId}.`);
  assets.set(assetId, `${sourceId}.svg`);
}

await mkdir(outputDirectory, { recursive: true });
await mkdir(sapiensOutputDirectory, { recursive: true });
for (const [assetId, sourceFilename] of assets) {
  await copyFile(join(packageDirectory, sourceFilename), join(outputDirectory, `${assetId}.svg`));
}
const sapiensPaths = (await readdir(sapiensOutputDirectory))
  .filter((file) => /^persona-sapiens-\d+\.svg$/u.test(file))
  .sort()
  .map((file) => `./sapiens/${file}`);
await writeFile(join(sapiensOutputDirectory, 'manifest.json'), `${JSON.stringify(sapiensPaths, null, 2)}\n`);

const sortedIds = [...assets.keys()].sort();
const manifest = sortedIds.map((assetId) => `./twemoji/${assetId}.svg`);
await writeFile(join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(
  join(root, 'src', 'data', 'twemoji-assets.ts'),
  `export const twemojiAssetIds = new Set([\n${sortedIds.map((assetId) => `  '${assetId}',`).join('\n')}\n]);\n`,
);

console.log(`Se prepararon ${assets.size} iconos Twemoji SVG locales.`);
