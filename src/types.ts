export type Category =
  | 'mujeres'
  | 'hombres'
  | 'ancianos'
  | 'ninos'
  | 'roles'
  | 'animales'
  | 'conceptos';

export type RelationshipKind = 'solid' | 'dashed' | 'dotted';

export interface Archetype {
  id: string;
  name: string;
  category: Category;
  detail: string;
  icon: string;
  color: string;
}

export interface FieldNode {
  id: string;
  name: string;
  icon: string;
  color: string;
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
  notes: string;
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
  conceptos: 'Conceptos',
};
