export type Category =
  | 'mujeres'
  | 'hombres'
  | 'ancianos'
  | 'ninos'
  | 'roles'
  | 'animales'
  | 'emociones'
  | 'logros'
  | 'conceptos';

export type RelationshipKind = 'solid' | 'dashed' | 'dotted';
export type RelationshipArrow = 'none' | 'forward' | 'both';

export interface HumanFigure {
  skin: string;
  hair: string;
  outfit: string;
  hairStyle: 'short' | 'long' | 'curly' | 'braids' | 'covered' | 'none';
  body: 'dress' | 'pants' | 'child-dress' | 'child-pants' | 'baby' | 'pregnant' | 'elder' | 'memorial';
}

export interface Archetype {
  id: string;
  name: string;
  category: Category;
  detail: string;
  icon: string;
  color: string;
  figure?: HumanFigure;
}

export interface FieldNode {
  id: string;
  name: string;
  icon: string;
  color: string;
  figure?: HumanFigure;
  sprite?: SpriteAppearance;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  phrase?: string;
}

export interface SpriteAppearance {
  src: string;
  direction: number;
  spriteSheet: boolean;
}

export interface SpriteLibraryItem {
  id: string;
  name: string;
  category: string;
  src: string;
  spriteSheet: boolean;
  equivalentId?: string;
  isLibraryPrimary?: boolean;
}

export const spriteDirections = [
  { index: 0, label: 'Arriba a la izquierda', icon: '↖' },
  { index: 1, label: 'Arriba', icon: '↑' },
  { index: 2, label: 'Arriba a la derecha', icon: '↗' },
  { index: 3, label: 'Izquierda', icon: '←' },
  { index: 4, label: 'Al frente', icon: '•' },
  { index: 5, label: 'Derecha', icon: '→' },
  { index: 6, label: 'Abajo a la izquierda', icon: '↙' },
  { index: 7, label: 'Abajo', icon: '↓' },
  { index: 8, label: 'Abajo a la derecha', icon: '↘' },
] as const;

export interface FieldLine {
  id: string;
  from: string;
  to: string;
  kind: RelationshipKind;
  arrow?: RelationshipArrow;
  label: string;
  color: string;
  phrase?: string;
}

export interface Session {
  id: string;
  name: string;
  facilitator: string;
  client: string;
  objective: string;
  consent: boolean;
  notes: string;
  closing: string;
  createdAt: string;
  updatedAt: string;
  nodes: FieldNode[];
  lines: FieldLine[];
}

export const categoryLabels: Record<Category, string> = {
  mujeres: 'Mujeres',
  hombres: 'Hombres',
  ancianos: 'Ancestros',
  ninos: 'Niñez',
  roles: 'Vínculos',
  animales: 'Animales',
  emociones: 'Emociones',
  logros: 'Logros y proyectos',
  conceptos: 'Conceptos',
};
