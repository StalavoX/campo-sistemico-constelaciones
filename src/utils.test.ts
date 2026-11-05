import { describe, expect, it } from 'vitest';
import { getClockHour, getOrientationLabel, getTwemojiAssetFilename, getZone, normalizeOrientation, validateSession } from './utils';

const validSession = {
  id: 'session-1',
  name: 'Sesión de prueba',
  client: '',
  notes: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  nodes: [
    { id: 'node-1', name: 'Persona', icon: '👤', color: '#818cf8', x: 500, y: 500, rotation: 0, scale: 1 },
    { id: 'node-2', name: 'Destino', icon: '🧭', color: '#64748b', x: 800, y: 500, rotation: 45, scale: 1.2 },
  ],
  lines: [
    { id: 'line-1', from: 'node-1', to: 'node-2', kind: 'dashed', label: 'Apoyo', color: '#a5b4fc' },
  ],
};

describe('validación de sesiones', () => {
  it('usa un recurso local cuando una sesión contiene un icono ajeno al catálogo', () => {
    expect(getTwemojiAssetFilename('👤')).toBe('2b50.svg');
  });

  it('acepta los datos de sesión y conserva los vínculos válidos', () => {
    const result = validateSession(validSession);
    expect(result.nodes).toHaveLength(2);
    expect(result.lines[0]?.label).toBe('Apoyo');
  });

  it('rechaza vínculos que apuntan a elementos inexistentes', () => {
    expect(() => validateSession({
      ...validSession,
      lines: [{ id: 'broken', from: 'missing', to: 'node-2' }],
    })).toThrow('El vínculo 1 referencia elementos inválidos.');
  });

  it('rechaza identificadores de vínculos duplicados', () => {
    expect(() => validateSession({
      ...validSession,
      lines: [validSession.lines[0], { ...validSession.lines[0], from: 'node-2', to: 'node-1' }],
    })).toThrow('El identificador del vínculo 2 está duplicado.');
  });

  it('limita posiciones y tamaños al tablero', () => {
    const result = validateSession({
      ...validSession,
      lines: [],
      nodes: [{ ...validSession.nodes[0], x: 4000, y: -40, scale: 10 }],
    });
    expect(result.nodes[0]).toMatchObject({ x: 960, y: 40, scale: 1.8 });
  });

  it('reemplaza colores inválidos importados por valores seguros', () => {
    const result = validateSession({
      ...validSession,
      lines: [],
      nodes: [{ ...validSession.nodes[0], color: 'url(https://example.invalid)' }],
    });
    expect(result.nodes[0]?.color).toBe('#6366f1');
  });

  it('conserva ilustraciones completas válidas y descarta estilos importados no seguros', () => {
    const figure = {
      skin: '#c98258',
      hair: '#29201f',
      outfit: '#9d77c9',
      hairStyle: 'long',
      body: 'pants',
    };
    const valid = validateSession({
      ...validSession,
      lines: [],
      nodes: [{ ...validSession.nodes[0], figure }],
    });
    expect(valid.nodes[0]?.figure).toEqual(figure);

    const invalid = validateSession({
      ...validSession,
      lines: [],
      nodes: [{ ...validSession.nodes[0], figure: { ...figure, skin: 'url(javascript:alert(1))' } }],
    });
    expect(invalid.nodes[0]?.figure).toBeUndefined();
  });

  it('conserva iconos de persona locales para mantener sus rasgos visuales', () => {
    const result = validateSession({
      ...validSession,
      lines: [],
      nodes: [{
        ...validSession.nodes[0],
        name: 'Mujer Afro',
        icon: '👩🏿‍🦱',
        figure: {
          skin: '#603b32',
          hair: '#181517',
          outfit: '#d07182',
          hairStyle: 'curly',
          body: 'dress',
        },
      }],
    });
    expect(result.nodes[0]?.icon).toMatch(/^sapiens:persona-sapiens-/u);
  });
});

describe('posición en el reloj', () => {
  it('clasifica las zonas concéntricas', () => {
    expect(getZone(500, 500)).toBe('Núcleo');
    expect(getZone(700, 500)).toBe('Medio');
    expect(getZone(900, 500)).toBe('Exterior');
  });

  it('calcula las posiciones horarias y reconoce el centro', () => {
    expect(getClockHour(500, 100)).toBe(12);
    expect(getClockHour(900, 500)).toBe(3);
    expect(getClockHour(500, 500)).toBeNull();
  });
});

describe('dirección de la mirada', () => {
  it('limita la orientación a cuatro direcciones sin inclinar la figura', () => {
    expect([0, 90, 180, 270].map(getOrientationLabel)).toEqual(['Arriba', 'Derecha', 'Abajo', 'Izquierda']);
    expect(normalizeOrientation(359)).toBe(0);
    expect(normalizeOrientation(360)).toBe(0);
    expect(normalizeOrientation(46)).toBe(90);
    expect(normalizeOrientation(-90)).toBe(270);
  });

  it('normaliza orientaciones antiguas al cargar sesiones', () => {
    const result = validateSession({
      ...validSession,
      lines: [],
      nodes: [
        { ...validSession.nodes[0], rotation: 45 },
        { ...validSession.nodes[1], rotation: 360 },
      ],
    });
    expect(result.nodes.map((node) => node.rotation)).toEqual([90, 0]);
  });
});
