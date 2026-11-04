import type { Archetype, Category } from '../types';

const women = [
  ['Hispana', '👩🏽'], ['Afro', '👩🏿‍🦱'], ['Asiática', '👩🏻'], ['Caucásica', '👩🏼‍🦰'],
  ['Indígena', '👩🏽‍🦱'], ['Árabe', '🧕🏽'], ['Mestiza', '👩🏽'], ['Romani', '👩🏿'],
  ['Polinesia', '👩🏾'], ['Pelirroja', '👩🏻‍🦰'], ['Cabello negro', '👩🏿'],
  ['Rubia', '👱🏻‍♀️'], ['Cabello castaño', '👩🏽'], ['Joven', '👩🏻‍🦱'],
  ['Adulta mayor', '👵🏼'], ['Cabello rizado', '👩🏽‍🦱'],
  ['Cabello trenzado', '👩🏿‍🦱'], ['Cabello corto', '💇🏻‍♀️'],
];
const men = [
  ['Hispano', '👨🏽'], ['Afro', '👨🏿‍🦱'], ['Asiático', '👨🏻'], ['Caucásico', '👨🏼'],
  ['Indígena', '👨🏽‍🦱'], ['Árabe', '🧔🏽'], ['Mestizo', '👨🏽'], ['Romani', '👨🏿'],
  ['Polinesio', '👨🏾'],
];
const elders = [
  ['Abuela paterna', '👵🏻'], ['Abuela materna', '👵🏼'], ['Abuelo paterno', '👴🏻'],
  ['Abuelo materno', '👴🏼'], ['Bisabuela', '👵🏽'], ['Bisabuelo', '👴🏽'],
  ['Ancestro sabio', '🧓🏻'], ['Ancestro excluido', '🌙'],
];
const children = [
  ['Hijo/a primogénito', '🧒🏻'], ['Segundo hijo/a', '👧🏻'], ['Hijo/a menor', '🧒🏽'],
  ['Bebé', '👶🏻'], ['Gemelo/a', '👯'], ['Hijo no nacido / aborto', '✨'],
  ['Niño interior', '💛'],
];
const roles = [
  ['Matriarca', '👑'], ['Patriarca', '🧔🏻‍🦳'], ['Madre adoptiva', '👩‍👧'],
  ['Padre adoptivo', '👨‍👦'], ['Tío / Tía', '🧑‍🤝‍🧑'], ['Primo / Prima', '👭'],
  ['Primer amor', '💌'], ['Ex-pareja', '💔'], ['Pareja actual', '💑'],
  ['Hermano no logrado', '✨'], ['Hijo adoptado', '🫶'],
];
const animals = [
  ['Perro (Lealtad)', '🐕'], ['Gato (Intuitivo)', '🐈'], ['Caballo (Fuerza)', '🐎'],
  ['Lobo (Manada)', '🐺'], ['Águila (Visión)', '🦅'], ['Búho (Sabiduría)', '🦉'],
  ['Serpiente (Sanación)', '🐍'], ['Oso (Protección)', '🐻'],
  ['Delfín / Pez (Emoción)', '🐬'], ['Mariposa (Transformación)', '🦋'],
  ['Colibrí (Alegría)', '🐦'], ['Zorro (Astucia)', '🦊'],
  ['Elefante (Memoria)', '🐘'], ['Tortuga (Longevidad)', '🐢'],
];
const concepts = [
  ['Dinero / Abundancia', '💰'], ['Enfermedad / Síntoma', '🩺'], ['Destino', '🧭'],
  ['Trauma / Secreto', '🔒'], ['Muerte', '🕯️'], ['País de origen', '🏞️'],
  ['Culpa', '🪨'], ['Trabajo / Vocación', '🧰'], ['Casa / Hogar', '🏡'],
  ['Guerra / Migración', '🕊️'], ['Amor no correspondido', '💔'],
];

const source: Array<[Category, string, string, number]> = [
  ['mujeres', 'Mujer', '#ec4899', women.length],
  ['hombres', 'Hombre', '#3b82f6', men.length],
  ['ancianos', '', '#8b5cf6', elders.length],
  ['ninos', '', '#ec4899', children.length],
  ['roles', '', '#14b8a6', roles.length],
  ['animales', '', '#10b981', animals.length],
  ['conceptos', '', '#64748b', concepts.length],
];

const entries = [women, men, elders, children, roles, animals, concepts];
const categoryOrder = source.map(([category]) => category);

export const archetypes: Archetype[] = entries.flatMap((group, groupIndex) => {
  const [category, prefix, color] = source[groupIndex] as [Category, string, string, number];
  return group.map(([detail, icon], index) => {
    const name = prefix ? `${prefix} ${detail}` : detail;
    return {
      id: `${category}-${index}`,
      name,
      icon,
      category,
      detail,
      color,
    };
  });
});

export { categoryOrder };
