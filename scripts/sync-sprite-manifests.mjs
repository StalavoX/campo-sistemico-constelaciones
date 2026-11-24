import { readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const publicDirectory = fileURLToPath(new URL('../public/', import.meta.url));

async function syncManifest(folder, extensions) {
  const directory = join(publicDirectory, folder);
  const files = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && extensions.has(entry.name.split('.').at(-1).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

  await writeFile(
    join(directory, 'manifest.json'),
    `${JSON.stringify(files.map((file) => `./${folder}/${file}`), null, 2)}\n`,
    'utf8',
  );
  console.log(`Se prepararon ${files.length} imágenes en public/${folder}.`);
}

await syncManifest('sapiens', new Set(['svg', 'png', 'jpg', 'jpeg', 'webp', 'gif']));
await syncManifest('sprites-3x3', new Set(['svg', 'png', 'jpg', 'jpeg', 'webp', 'gif']));
