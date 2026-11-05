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
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export interface FieldLine {
  id: string;
  from: string;
  to: string;
  kind: RelationshipKind;
  label: string;
  color: string;
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
