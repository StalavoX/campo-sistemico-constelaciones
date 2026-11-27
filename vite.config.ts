import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import { readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const publicDirectory = fileURLToPath(new URL('./public/', import.meta.url));
const extensions = new Set(['svg', 'png', 'jpg', 'jpeg', 'webp', 'gif']);

async function syncManifest(folder: string) {
  try {
    const directory = join(publicDirectory, folder);
    const files = (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && extensions.has(entry.name.split('.').at(-1)?.toLowerCase() || ''))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    await writeFile(
      join(directory, 'manifest.json'),
      `${JSON.stringify(files.map((file) => `./${folder}/${file}`), null, 2)}\n`,
      'utf8',
    );
  } catch {
    // noop
  }
}

function autoSyncSpritesPlugin(): Plugin {
  return {
    name: 'auto-sync-sprites',
    configureServer(server) {
      const handleFileChange = async (file: string) => {
        const normalized = file.replace(/\\/g, '/');
        if (normalized.includes('/public/sapiens/') && !normalized.endsWith('manifest.json')) {
          await syncManifest('sapiens');
        } else if (normalized.includes('/public/sprites-3x3/') && !normalized.endsWith('manifest.json')) {
          await syncManifest('sprites-3x3');
        }
      };

      server.watcher.on('add', handleFileChange);
      server.watcher.on('unlink', handleFileChange);
    },
  };
}

export default defineConfig({
  plugins: [vue(), autoSyncSpritesPlugin()],
  base: './',
  build: {
    target: 'es2022',
  },
});

