import { describe, expect, it } from 'vitest';
import { getClockHour, getZone, validateSession } from './utils';

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
