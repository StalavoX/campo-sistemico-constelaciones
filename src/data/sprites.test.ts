import { describe, expect, it } from 'vitest';
import { linkSpriteCounterparts, parseSpriteManifest, restoreLegacySpriteNodes } from './sprites';

describe('catálogos de sprites precargados', () => {
  it('distingue figuras individuales de hojas 3×3', () => {
    const figures = parseSpriteManifest(['./sapiens/Hombre adulto.png'], 'sapiens');
    const sheets = parseSpriteManifest(['./sprites-3x3/familia-01.png'], 'sprites-3x3');

    expect(figures[0]).toMatchObject({
      name: 'Hombre Adulto',
      category: 'Figuras precargadas',
      spriteSheet: false,
    });
    expect(sheets[0]).toMatchObject({
      name: 'Familia 01',
      category: 'Sprites 3×3',
      spriteSheet: true,
    });
  });

  it('vincula por nombre de archivo las figuras con su hoja 3×3 equivalente', () => {
    const library = linkSpriteCounterparts([
      ...parseSpriteManifest(['./sapiens/Hombre 1.png'], 'sapiens'),
      ...parseSpriteManifest(['./sprites-3x3/hombre 1.jpg'], 'sprites-3x3'),
      ...parseSpriteManifest(['./sapiens/Mujer 2.png'], 'sapiens'),
    ]);

    expect(library[0]).toMatchObject({
      equivalentId: './sprites-3x3/hombre 1.jpg',
      isLibraryPrimary: true,
    });
    expect(library[1]).toMatchObject({
      equivalentId: './sapiens/Hombre 1.png',
      isLibraryPrimary: false,
    });
    expect(library[2]?.equivalentId).toBeUndefined();
    expect(library.filter((item) => item.isLibraryPrimary !== false)).toHaveLength(2);
  });

  it('no vincula si hay varias imágenes con el mismo nombre en una carpeta', () => {
    const library = linkSpriteCounterparts([
      ...parseSpriteManifest(['./sapiens/hombre 1.png', './sapiens/hombre 1.svg'], 'sapiens'),
      ...parseSpriteManifest(['./sprites-3x3/hombre 1.jpg'], 'sprites-3x3'),
    ]);

    expect(library.map((item) => item.equivalentId)).toEqual([undefined, undefined, undefined]);
  });

  it('recupera figuras guardadas sin miniatura usando su hoja local equivalente', () => {
    const library = linkSpriteCounterparts([
      ...parseSpriteManifest(['./sapiens/Hombre 1.png'], 'sapiens'),
      ...parseSpriteManifest(['./sprites-3x3/hombre 1.jpg'], 'sprites-3x3'),
    ]);
    const nodes = [{
      id: 'legacy-node',
      name: 'Hombre 1',
      icon: '⭐',
      color: '#6366f1',
      x: 500,
      y: 500,
      rotation: 0,
      scale: 1.5,
    }];

    expect(restoreLegacySpriteNodes(nodes, library)[0]?.sprite).toEqual({
      src: '/sprites-3x3/hombre 1.jpg',
      direction: 4,
      spriteSheet: true,
    });
  });

  it('rechaza rutas fuera de cada carpeta de recursos', () => {
    expect(() => parseSpriteManifest(['./twemoji/1f60a.svg'], 'sapiens')).toThrow('ruta inválida');
    expect(() => parseSpriteManifest(['./sprites-3x3/../../other.svg'], 'sprites-3x3')).toThrow('ruta inválida');
  });
});
