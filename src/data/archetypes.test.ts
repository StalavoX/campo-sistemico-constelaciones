import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { archetypes } from './archetypes';
import { twemojiAssetIds } from './twemoji-assets';
import { getPersonIcon } from '../utils';
import type { HumanFigure } from '../types';

describe('catálogo de figuras y recursos', () => {
  it('incluye figuras humanas completas y diversas', () => {
    const humanGroups = new Set(['mujeres', 'hombres', 'ancianos', 'ninos']);
    const people = archetypes.filter((item) => humanGroups.has(item.category) && item.figure);
    expect(people.length).toBeGreaterThan(50);
    expect(people.every((item) => item.figure)).toBe(true);
    expect(new Set(people.map((item) => item.icon)).size).toBe(18);
    expect(people.every((item) => item.icon.startsWith('sapiens:'))).toBe(true);
    expect(people.every((item) => [...item.detail].length <= 28)).toBe(true);
    expect(new Set(people.map((item) => item.figure!.skin)).size).toBe(5);
    expect(new Set(people.map((item) => item.figure!.hairStyle)).size).toBeGreaterThanOrEqual(5);
    expect(people.map((item) => item.figure!.body)).toEqual(expect.arrayContaining(['baby', 'pregnant', 'elder', 'memorial']));
    expect(archetypes.find((item) => item.name === 'Mujer Afro')?.figure).toMatchObject({ skin: '#603b32', hairStyle: 'curly' });
    expect(archetypes.find((item) => item.name === 'Hombre Asiático')?.figure).toMatchObject({ skin: '#f3c7a6', body: 'pants' });
    expect(archetypes.find((item) => item.name === 'Mujer Afro')?.icon).toMatch(/^sapiens:persona-sapiens-/u);
    expect(archetypes.find((item) => item.name === 'Bebé')?.icon).toMatch(/^sapiens:persona-sapiens-/u);
    expect(archetypes.find((item) => item.name === 'Bebé')?.figure).toMatchObject({ body: 'baby' });
    expect(archetypes.some((item) => item.name === 'Mujer embarazada')).toBe(true);
    expect(archetypes.some((item) => item.name === 'Niña afrodescendiente')).toBe(true);
    expect(archetypes.some((item) => item.name === 'Persona fallecida')).toBe(true);
  });

  it('ofrece emociones, logros y proyectos con identificadores únicos', () => {
    const ids = archetypes.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(archetypes.filter((item) => item.category === 'emociones')).toHaveLength(28);
    expect(archetypes.some((item) => item.name === 'Graduación')).toBe(true);
    expect(archetypes.some((item) => item.name === 'Viaje')).toBe(true);
    expect(archetypes.some((item) => item.name === 'Abundancia')).toBe(true);
  });

  it('incluye SVG locales para los iconos visibles y las variantes humanas', () => {
    expect(twemojiAssetIds.has('2b50')).toBe(true);
    const skins = ['#f3c7a6', '#e8b18b', '#c98258', '#94593f', '#603b32'];
    const baseFigure: HumanFigure = {
      skin: skins[0]!,
      hair: '#29201f',
      outfit: '#9d77c9',
      hairStyle: 'long',
      body: 'dress',
    };
    const icons = [
      ...archetypes.filter((item) => !item.figure).map((item) => item.icon),
      ...skins.flatMap((skin) => [
        getPersonIcon('Mujer', { ...baseFigure, skin }),
        getPersonIcon('Hombre', { ...baseFigure, skin }),
        getPersonIcon('Persona', { ...baseFigure, skin }),
        getPersonIcon('Mujer embarazada', { ...baseFigure, skin, body: 'pregnant' }),
        getPersonIcon('Bebé', { ...baseFigure, skin, body: 'baby' }),
      ]),
    ];

    for (const icon of new Set(icons.filter((item) => !item.startsWith('sapiens:')))) {
      const assetId = Array.from(icon, (character) => character.codePointAt(0)!.toString(16))
        .filter((point) => point !== 'fe0f')
        .join('-');
      expect(twemojiAssetIds.has(assetId), `Falta mapear el icono ${assetId}`).toBe(true);
      expect(existsSync(join(process.cwd(), 'public', 'twemoji', `${assetId}.svg`)), `Falta el SVG ${assetId}`).toBe(true);
    }
  });
});
