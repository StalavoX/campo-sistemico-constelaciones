import type { FieldLine, FieldNode, HumanFigure, Session } from './types';

export const cloneState = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function normalizeOrientation(value: number): number {
  const normalized = ((value % 360) + 360) % 360;
  return (Math.round(normalized / 90) % 4) * 90;
}

export function getOrientationLabel(value: number): string {
  return ['Frente', 'Derecha', 'Espalda', 'Izquierda'][normalizeOrientation(value) / 90]!;
}

function validateFigure(value: unknown): HumanFigure | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const figure = value as Partial<HumanFigure>;
  const color = (input: unknown): input is string => typeof input === 'string' && /^#[\da-f]{6}$/i.test(input);
  const hairStyles: HumanFigure['hairStyle'][] = ['short', 'long', 'curly', 'braids', 'covered', 'none'];
  const bodyShapes: HumanFigure['body'][] = ['dress', 'pants', 'child-dress', 'child-pants', 'baby', 'pregnant', 'elder', 'memorial'];
  if (!color(figure.skin) || !color(figure.hair) || !color(figure.outfit) ||
      !hairStyles.includes(figure.hairStyle as HumanFigure['hairStyle']) ||
      !bodyShapes.includes(figure.body as HumanFigure['body'])) return undefined;
  return {
    skin: figure.skin,
    hair: figure.hair,
    outfit: figure.outfit,
    hairStyle: figure.hairStyle as HumanFigure['hairStyle'],
    body: figure.body as HumanFigure['body'],
  };
}

export function createSession(name = 'Nueva sesión'): Session {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    facilitator: '',
    client: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
    nodes: [],
    lines: [],
  };
}

export function validateSession(value: unknown): Session {
  if (!value || typeof value !== 'object') {
    throw new Error('El archivo no contiene una sesión válida.');
  }
  const data = value as Partial<Session>;
  if (typeof data.name !== 'string' || !Array.isArray(data.nodes) || !Array.isArray(data.lines)) {
    throw new Error('La sesión debe incluir nombre, elementos y vínculos.');
  }
  const ids = new Set<string>();
  const nodes = data.nodes.map((node, index): FieldNode => {
    if (!node || typeof node !== 'object' || typeof node.id !== 'string' ||
        typeof node.name !== 'string' || node.name.length > 80 || !Number.isFinite(node.x) ||
        !Number.isFinite(node.y)) {
      throw new Error(`El elemento ${index + 1} tiene datos inválidos.`);
    }
    if (ids.has(node.id)) throw new Error(`El identificador del elemento ${index + 1} está duplicado.`);
    ids.add(node.id);
    const figure = validateFigure(node.figure);
    return {
      id: node.id,
      name: node.name,
      icon: typeof node.icon === 'string' && node.icon.length <= 16 ? node.icon : '⭐',
      color: typeof node.color === 'string' && /^#[\da-f]{6}$/i.test(node.color) ? node.color : '#6366f1',
      x: Math.min(960, Math.max(40, node.x)),
      y: Math.min(960, Math.max(40, node.y)),
      rotation: Number.isFinite(node.rotation) ? normalizeOrientation(node.rotation) : 0,
      scale: Number.isFinite(node.scale) ? Math.min(1.8, Math.max(0.6, node.scale)) : 1,
      ...(figure ? { figure } : {}),
    };
  });
  const lines = data.lines.map((line, index): FieldLine => {
    if (!line || typeof line !== 'object' || !ids.has(line.from) || !ids.has(line.to) || line.from === line.to) {
      throw new Error(`El vínculo ${index + 1} referencia elementos inválidos.`);
    }
    const kind = ['solid', 'dashed', 'dotted'].includes(line.kind) ? line.kind : 'solid';
    return {
      id: typeof line.id === 'string' ? line.id : crypto.randomUUID(),
      from: line.from,
      to: line.to,
      kind,
      label: typeof line.label === 'string' && line.label.length <= 60 ? line.label : 'Vínculo',
      color: typeof line.color === 'string' && /^#[\da-f]{6}$/i.test(line.color) ? line.color : '#a5b4fc',
    };
  });
  const now = new Date().toISOString();
  return {
    id: typeof data.id === 'string' ? data.id : crypto.randomUUID(),
    name: data.name.slice(0, 120),
    facilitator: typeof data.facilitator === 'string' ? data.facilitator.slice(0, 120) : '',
    client: typeof data.client === 'string' ? data.client.slice(0, 120) : '',
    notes: typeof data.notes === 'string' ? data.notes.slice(0, 6000) : '',
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : now,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : now,
    nodes,
    lines,
  };
}

export function getZone(x: number, y: number): string {
  const distance = Math.hypot(x - 500, y - 500) / 466;
  return distance <= 0.4 ? 'Núcleo' : distance <= 0.73 ? 'Medio' : 'Exterior';
}

export function getClockHour(x: number, y: number): number | null {
  if (Math.hypot(x - 500, y - 500) < 24) return null;
  return Math.round((Math.atan2(x - 500, 500 - y) * 6 / Math.PI + 12) % 12) || 12;
}
