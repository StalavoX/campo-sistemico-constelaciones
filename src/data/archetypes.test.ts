import { describe, expect, it } from 'vitest';
import { archetypes } from './archetypes';

describe('catálogo de figuras y recursos', () => {
  it('incluye figuras humanas completas y diversas', () => {
    const humanGroups = new Set(['mujeres', 'hombres', 'ancianos', 'ninos']);
    const people = archetypes.filter((item) => humanGroups.has(item.category) && item.figure);
    expect(people.length).toBeGreaterThan(50);
    expect(people.every((item) => item.figure)).toBe(true);
    expect(people.every((item) => /^(🧍|🤰|👶)/u.test(item.icon))).toBe(true);
    expect(archetypes.find((item) => item.name === 'Mujer Afro')?.icon).toBe('🧍🏿‍♀️');
    expect(archetypes.find((item) => item.name === 'Hombre Asiático')?.icon).toBe('🧍🏻‍♂️');
    expect(archetypes.find((item) => item.name === 'Bebé')?.icon).toBe('👶🏻');
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
});
