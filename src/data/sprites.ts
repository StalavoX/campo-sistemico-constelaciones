import type { FieldNode, SpriteLibraryItem } from '../types';

type SpriteFolder = 'sapiens' | 'sprites-3x3';

function getDisplayName(path: string): string {
  const fileName = path.split('/').at(-1) ?? '';
  const stem = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  return stem.split(/\s+/).map((word) =>
    `${word.charAt(0).toLocaleUpperCase('es')}${word.slice(1).toLocaleLowerCase('es')}`,
  ).join(' ');
}

export function parseSpriteManifest(value: unknown, folder: SpriteFolder): SpriteLibraryItem[] {
  if (!Array.isArray(value)) {
    throw new Error(`El manifiesto de ${folder} debe contener una lista de imágenes.`);
  }

  const spriteSheet = folder === 'sprites-3x3';
  const pathPattern = spriteSheet
    ? /^\.\/sprites-3x3\/[^/]+\.(?:svg|png|jpe?g|webp|gif)$/i
    : /^\.\/sapiens\/[^/]+\.(?:svg|png|jpe?g|webp|gif)$/i;

  return value.map((entry, index) => {
    if (typeof entry !== 'string' || !pathPattern.test(entry)) {
      throw new Error(`La imagen ${index + 1} del manifiesto de ${folder} tiene una ruta inválida.`);
    }

    const assetPath = entry.slice(2);
    return {
      id: entry,
      name: getDisplayName(assetPath),
      category: spriteSheet ? 'Sprites 3×3' : 'Figuras precargadas',
      src: `${import.meta.env.BASE_URL}${assetPath}`,
      spriteSheet,
    };
  });
}

function getPairingKey(item: SpriteLibraryItem): string {
  const fileName = item.id.split('/').at(-1) ?? item.id;
  return fileName
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9]/g, '');
}

export function linkSpriteCounterparts(items: SpriteLibraryItem[]): SpriteLibraryItem[] {
  const groups = new Map<string, { figures: SpriteLibraryItem[]; sheets: SpriteLibraryItem[] }>();
  for (const item of items) {
    const key = getPairingKey(item);
    const group = groups.get(key) ?? { figures: [], sheets: [] };
    (item.spriteSheet ? group.sheets : group.figures).push(item);
    groups.set(key, group);
  }

  return items.map((item) => {
    const group = groups.get(getPairingKey(item));
    if (!group || group.figures.length !== 1 || group.sheets.length !== 1) return item;
    const counterpart = item.spriteSheet ? group.figures[0] : group.sheets[0];
    return counterpart
      ? { ...item, equivalentId: counterpart.id, isLibraryPrimary: !item.spriteSheet }
      : item;
  });
}

export function restoreLegacySpriteNodes(nodes: FieldNode[], library: SpriteLibraryItem[]): FieldNode[] {
  return nodes.map((node) => {
    if (node.sprite || node.figure || node.icon !== '⭐' || node.color !== '#6366f1' || node.scale !== 1.5) {
      return node;
    }

    const matches = library.filter((item) => item.isLibraryPrimary !== false && item.name === node.name);
    if (matches.length !== 1) return node;

    const primary = matches[0];
    if (!primary) return node;
    const sheet = primary.equivalentId
      ? library.find((item) => item.id === primary.equivalentId && item.spriteSheet)
      : undefined;
    const sprite = sheet ?? primary;
    return {
      ...node,
      sprite: { src: sprite.src, direction: 4, spriteSheet: sprite.spriteSheet },
    };
  });
}

async function fetchManifest(folder: SpriteFolder): Promise<unknown> {
  const response = await fetch(`${import.meta.env.BASE_URL}${folder}/manifest.json`);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el manifiesto de ${folder} (${response.status}).`);
  }
  return response.json();
}

export async function loadPreloadedSpriteLibrary(): Promise<SpriteLibraryItem[]> {
  const [figuresManifest, spriteSheetsManifest] = await Promise.all([
    fetchManifest('sapiens'),
    fetchManifest('sprites-3x3'),
  ]);
  const preloaded = linkSpriteCounterparts([
    ...parseSpriteManifest(figuresManifest, 'sapiens'),
    ...parseSpriteManifest(spriteSheetsManifest, 'sprites-3x3'),
  ]);
  const custom = loadCustomSprites();
  return [...custom, ...preloaded];
}

const CUSTOM_SPRITES_KEY = 'campo-sistemico-custom-sprites';

export function loadCustomSprites(): SpriteLibraryItem[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(CUSTOM_SPRITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => item && typeof item.id === 'string' && typeof item.src === 'string',
    );
  } catch {
    return [];
  }
}

export function saveCustomSprite(item: SpriteLibraryItem): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const current = loadCustomSprites().filter((i) => i.id !== item.id);
    current.unshift(item);
    localStorage.setItem(CUSTOM_SPRITES_KEY, JSON.stringify(current));
  } catch {
    // noop
  }
}

export function deleteCustomSprite(id: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const current = loadCustomSprites().filter((i) => i.id !== id);
    localStorage.setItem(CUSTOM_SPRITES_KEY, JSON.stringify(current));
  } catch {
    // noop
  }
}

