import type { Archetype, Category, HumanFigure } from '../types';

type ArchetypeInput = Omit<Archetype, 'id' | 'category'>;

const skinTones = {
  fair: '#f3c7a6',
  light: '#e8b18b',
  medium: '#c98258',
  brown: '#94593f',
  deep: '#603b32',
};

function person(
  name: string,
  icon: string,
  detail: string,
  skin: string,
  hair: string,
  outfit: string,
  hairStyle: HumanFigure['hairStyle'],
  body: HumanFigure['body'],
  color = '#d8799e',
): ArchetypeInput {
  const tone = ({
    '#f3c7a6': '🏻',
    '#e8b18b': '🏼',
    '#c98258': '🏽',
    '#94593f': '🏾',
    '#603b32': '🏿',
  } as Record<string, string>)[skin] ?? '';
  const feminine = /mujer|niña|abuela|bisabuela/i.test(name);
  const masculine = /hombre|niño|abuelo|bisabuelo/i.test(name);
  const special = body === 'pregnant' ? icon : body === 'baby' ? icon : undefined;
  const fullBodyIcon = special
    ?? (feminine ? `🧍${tone}‍♀️` : masculine ? `🧍${tone}‍♂️` : `🧍${tone}`);
  return {
    name,
    icon: fullBodyIcon,
    detail,
    color,
    figure: { skin, hair, outfit, hairStyle, body },
  };
}

function symbol(name: string, icon: string, detail: string, color: string): ArchetypeInput {
  return { name, icon, detail, color };
}

const women = [
  person('Mujer Hispana', '👩🏽', 'Piel media · cabello oscuro', skinTones.medium, '#29201f', '#9d77c9', 'long', 'dress'),
  person('Mujer Afro', '👩🏿‍🦱', 'Piel profunda · rizos', skinTones.deep, '#181517', '#d07182', 'curly', 'dress'),
  person('Mujer Asiática', '👩🏻', 'Piel clara · cabello lacio', skinTones.fair, '#24202a', '#6a9dc5', 'long', 'dress'),
  person('Mujer Caucásica', '👩🏼‍🦰', 'Piel clara · cabello cobrizo', skinTones.light, '#a84e33', '#c58a63', 'long', 'dress'),
  person('Mujer Indígena', '👩🏽‍🦱', 'Piel cálida · cabello oscuro', skinTones.medium, '#211917', '#b58246', 'braids', 'dress'),
  person('Mujer Árabe', '🧕🏽', 'Velo y vestido', skinTones.medium, '#28212b', '#607da8', 'covered', 'dress'),
  person('Mujer Mestiza', '👩🏽', 'Piel media · cabello ondulado', skinTones.medium, '#38251e', '#53a78d', 'curly', 'dress'),
  person('Mujer Romani', '👩🏿', 'Piel morena · cabello oscuro', skinTones.brown, '#211a19', '#b96684', 'long', 'dress'),
  person('Mujer Polinesia', '👩🏾', 'Piel cálida · cabello largo', skinTones.brown, '#29201c', '#d08352', 'long', 'dress'),
  person('Mujer Pelirroja', '👩🏻‍🦰', 'Piel clara · cabello rojo', skinTones.fair, '#a84830', '#738ec6', 'curly', 'dress'),
  person('Mujer de cabello negro', '👩🏿', 'Piel oscura · cabello negro', skinTones.deep, '#171416', '#c27652', 'long', 'dress'),
  person('Mujer Rubia', '👱🏻‍♀️', 'Piel clara · cabello rubio', skinTones.fair, '#c39a45', '#788cc1', 'long', 'dress'),
  person('Mujer de cabello castaño', '👩🏽', 'Piel media · cabello castaño', skinTones.medium, '#5d3828', '#bd7194', 'long', 'dress'),
  person('Mujer Joven', '👩🏻‍🦱', 'Joven adulta · cabello rizado', skinTones.light, '#38231e', '#d28a65', 'curly', 'dress'),
  person('Mujer Adulta mayor', '👵🏼', 'Adulta mayor', skinTones.light, '#b8aaa1', '#8276ad', 'short', 'elder'),
  person('Mujer de cabello rizado', '👩🏽‍🦱', 'Rizos oscuros', skinTones.medium, '#211916', '#ae7760', 'curly', 'dress'),
  person('Mujer de cabello trenzado', '👩🏿‍🦱', 'Trenzas', skinTones.deep, '#171416', '#738e70', 'braids', 'dress'),
  person('Mujer de cabello corto', '💇🏻‍♀️', 'Cabello corto', skinTones.light, '#4b3027', '#c57d8b', 'short', 'dress'),
  person('Mujer embarazada', '🤰🏽', 'Embarazo · cuerpo completo', skinTones.medium, '#2b211e', '#b67ab8', 'long', 'pregnant'),
  person('Mujer adulta joven', '👩🏻', 'Adulta joven · ropa casual', skinTones.fair, '#3a2925', '#669e8a', 'long', 'pants'),
  person('Mujer adulta', '👩🏾', 'Adulta · ropa casual', skinTones.brown, '#1e1918', '#c47b58', 'braids', 'pants'),
  person('Mujer embarazada afro', '🤰🏿', 'Embarazo · piel oscura', skinTones.deep, '#191516', '#ca7184', 'curly', 'pregnant'),
];

const men = [
  person('Hombre Hispano', '👨🏽', 'Piel media · cabello oscuro', skinTones.medium, '#29201f', '#688fc2', 'short', 'pants', '#628bd2'),
  person('Hombre Afro', '👨🏿‍🦱', 'Piel profunda · cabello rizado', skinTones.deep, '#181517', '#57a18b', 'curly', 'pants', '#628bd2'),
  person('Hombre Asiático', '👨🏻', 'Piel clara · cabello oscuro', skinTones.fair, '#24202a', '#b47b65', 'short', 'pants', '#628bd2'),
  person('Hombre Caucásico', '👨🏼', 'Piel clara · cabello castaño', skinTones.light, '#5b3e31', '#8275bc', 'short', 'pants', '#628bd2'),
  person('Hombre Indígena', '👨🏽‍🦱', 'Piel cálida · cabello oscuro', skinTones.medium, '#211917', '#be8750', 'long', 'pants', '#628bd2'),
  person('Hombre Árabe', '🧔🏽', 'Piel media · barba', skinTones.medium, '#30231e', '#6095a0', 'short', 'pants', '#628bd2'),
  person('Hombre Mestizo', '👨🏽', 'Piel media · cabello ondulado', skinTones.medium, '#38251e', '#8e9b60', 'curly', 'pants', '#628bd2'),
  person('Hombre Romani', '👨🏿', 'Piel morena · cabello oscuro', skinTones.brown, '#211a19', '#a76b91', 'short', 'pants', '#628bd2'),
  person('Hombre Polinesio', '👨🏾', 'Piel cálida · cabello oscuro', skinTones.brown, '#29201c', '#cc8150', 'short', 'pants', '#628bd2'),
  person('Hombre joven', '🧑🏻', 'Joven adulto', skinTones.fair, '#392c28', '#8c8ed1', 'curly', 'pants', '#628bd2'),
  person('Hombre adulto', '👨🏽', 'Adulto · ropa casual', skinTones.medium, '#24201e', '#509d86', 'short', 'pants', '#628bd2'),
  person('Hombre adulto mayor', '👴🏼', 'Adulto mayor', skinTones.light, '#b2a69b', '#9279ab', 'short', 'elder', '#628bd2'),
  person('Hombre de cabello largo', '👨🏻', 'Cabello largo', skinTones.fair, '#30221d', '#bd8559', 'long', 'pants', '#628bd2'),
  person('Hombre de cabello rizado', '👨🏾‍🦱', 'Rizos oscuros', skinTones.brown, '#1b1715', '#5b8fa8', 'curly', 'pants', '#628bd2'),
  person('Hombre de cabello canoso', '🧓🏽', 'Cabello canoso', skinTones.medium, '#b3aaa4', '#778d6c', 'short', 'elder', '#628bd2'),
  person('Hombre con barba', '🧔🏻', 'Barba y cabello corto', skinTones.light, '#49352d', '#bb6971', 'short', 'pants', '#628bd2'),
];

const elders = [
  person('Abuela paterna', '👵🏻', 'Línea paterna', skinTones.fair, '#b9aaa0', '#8877b7', 'short', 'elder', '#9373c5'),
  person('Abuela materna', '👵🏼', 'Línea materna', skinTones.light, '#aaa39d', '#bf7b90', 'short', 'elder', '#9373c5'),
  person('Abuelo paterno', '👴🏻', 'Línea paterna', skinTones.fair, '#aaa39d', '#6e89a8', 'short', 'elder', '#9373c5'),
  person('Abuelo materno', '👴🏼', 'Línea materna', skinTones.light, '#aaa39d', '#809879', 'short', 'elder', '#9373c5'),
  person('Bisabuela', '👵🏽', 'Generación anterior', skinTones.medium, '#a69a91', '#ba8b5a', 'short', 'elder', '#9373c5'),
  person('Bisabuelo', '👴🏽', 'Generación anterior', skinTones.medium, '#a69a91', '#a16e72', 'short', 'elder', '#9373c5'),
  person('Ancestro sabio', '🧓🏻', 'Ancestro/a', skinTones.light, '#b8aaa1', '#687da4', 'long', 'elder', '#9373c5'),
  person('Ancestro excluido', '🌙', 'Persona apartada del sistema', skinTones.brown, '#241c1a', '#6c6388', 'long', 'memorial', '#9373c5'),
  person('Persona fallecida', '🕯️', 'En memoria · cuerpo completo', skinTones.medium, '#302521', '#697188', 'short', 'memorial', '#9373c5'),
  person('Familiar fallecido', '🕊️', 'En memoria de la familia', skinTones.light, '#b5aaa3', '#737e9a', 'short', 'memorial', '#9373c5'),
];

const children = [
  person('Hijo/a primogénito', '🧒🏻', 'Niño/a · piel clara', skinTones.fair, '#553c30', '#5e9fb2', 'short', 'child-pants'),
  person('Segundo hijo/a', '👧🏻', 'Niña · piel clara', skinTones.light, '#59382b', '#bd7194', 'long', 'child-dress'),
  person('Hijo/a menor', '🧒🏽', 'Niño/a · piel media', skinTones.medium, '#27201d', '#c58b4c', 'curly', 'child-pants'),
  person('Bebé', '👶🏻', 'Bebé · cuerpo completo', skinTones.fair, '#a46b4b', '#88a6d4', 'none', 'baby'),
  symbol('Gemelo/a', '👯', 'Gemelos o mellizos', '#dc75a4'),
  symbol('Hijo no nacido / aborto', '✨', 'Pérdida gestacional', '#a58bd2'),
  symbol('Niño interior', '💛', 'Niñez interior', '#e8b957'),
  person('Niña afrodescendiente', '👧🏿', 'Niña · piel profunda', skinTones.deep, '#171416', '#bd7c57', 'braids', 'child-dress'),
  person('Niño afrodescendiente', '👦🏿', 'Niño · piel profunda', skinTones.deep, '#171416', '#659b84', 'curly', 'child-pants'),
  person('Niña asiática', '👧🏻', 'Niña · cabello oscuro', skinTones.fair, '#211d21', '#b16f93', 'long', 'child-dress'),
  person('Niño asiático', '👦🏻', 'Niño · cabello oscuro', skinTones.fair, '#211d21', '#6b8ebd', 'short', 'child-pants'),
  person('Niña indígena', '👧🏽', 'Niña · cabello trenzado', skinTones.medium, '#241c19', '#c18b49', 'braids', 'child-dress'),
  person('Niño indígena', '👦🏽', 'Niño · cabello oscuro', skinTones.medium, '#241c19', '#739b6e', 'short', 'child-pants'),
  person('Niña mestiza', '👧🏽', 'Niña · piel media', skinTones.medium, '#443027', '#c17b82', 'curly', 'child-dress'),
  person('Niño mestizo', '👦🏽', 'Niño · piel media', skinTones.medium, '#443027', '#6a9bb5', 'short', 'child-pants'),
  person('Niña pelirroja', '👧🏻', 'Niña · cabello cobrizo', skinTones.fair, '#a84e33', '#ba8fae', 'long', 'child-dress'),
  person('Niño rubio', '👦🏼', 'Niño · cabello rubio', skinTones.light, '#c39a45', '#7c9a72', 'short', 'child-pants'),
  person('Niña con trenzas', '👧🏾', 'Niña · trenzas', skinTones.brown, '#171416', '#cf8c53', 'braids', 'child-dress'),
  person('Niño pequeño', '👦🏻', 'Niño pequeño', skinTones.fair, '#483126', '#738cc1', 'curly', 'child-pants'),
  person('Niña pequeña', '👧🏼', 'Niña pequeña', skinTones.light, '#5b392b', '#bf7993', 'long', 'child-dress'),
  person('Recién nacido', '👶🏽', 'Recién nacido/a', skinTones.medium, '#38241d', '#d29c62', 'none', 'baby'),
];

const roles = [
  symbol('Matriarca', '👑', 'Rol familiar', '#14b8a6'),
  symbol('Patriarca', '🧔🏻‍🦳', 'Rol familiar', '#14b8a6'),
  symbol('Madre adoptiva', '👩‍👧', 'Vínculo de cuidado', '#14b8a6'),
  symbol('Padre adoptivo', '👨‍👦', 'Vínculo de cuidado', '#14b8a6'),
  symbol('Tío / Tía', '🧑‍🤝‍🧑', 'Familia extensa', '#14b8a6'),
  symbol('Primo / Prima', '👭', 'Familia extensa', '#14b8a6'),
  symbol('Primer amor', '💌', 'Vínculo afectivo', '#14b8a6'),
  symbol('Ex-pareja', '💔', 'Vínculo anterior', '#14b8a6'),
  symbol('Pareja actual', '💑', 'Vínculo presente', '#14b8a6'),
  symbol('Hermano no logrado', '✨', 'Vínculo significativo', '#14b8a6'),
  symbol('Hijo adoptado', '🫶', 'Vínculo de cuidado', '#14b8a6'),
];

const animals = [
  symbol('Perro (Lealtad)', '🐕', 'Lealtad', '#10b981'),
  symbol('Gato (Intuitivo)', '🐈', 'Intuición', '#10b981'),
  symbol('Caballo (Fuerza)', '🐎', 'Fuerza', '#10b981'),
  symbol('Lobo (Manada)', '🐺', 'Pertenencia', '#10b981'),
  symbol('Águila (Visión)', '🦅', 'Perspectiva', '#10b981'),
  symbol('Búho (Sabiduría)', '🦉', 'Sabiduría', '#10b981'),
  symbol('Serpiente (Sanación)', '🐍', 'Transformación', '#10b981'),
  symbol('Oso (Protección)', '🐻', 'Protección', '#10b981'),
  symbol('Delfín / Pez (Emoción)', '🐬', 'Emoción', '#10b981'),
  symbol('Mariposa (Transformación)', '🦋', 'Transformación', '#10b981'),
  symbol('Colibrí (Alegría)', '🐦', 'Alegría', '#10b981'),
  symbol('Zorro (Astucia)', '🦊', 'Astucia', '#10b981'),
  symbol('Elefante (Memoria)', '🐘', 'Memoria', '#10b981'),
  symbol('Tortuga (Longevidad)', '🐢', 'Longevidad', '#10b981'),
];

const emotions = [
  ['Alegría', '😊'], ['Amor', '❤️'], ['Calma', '😌'], ['Gratitud', '🙏'],
  ['Esperanza', '🌱'], ['Confianza', '🤝'], ['Orgullo', '🌟'], ['Entusiasmo', '🤩'],
  ['Tristeza', '😢'], ['Duelo', '🕊️'], ['Miedo', '😨'], ['Enojo', '😠'],
  ['Vergüenza', '😳'], ['Culpa', '🪨'], ['Soledad', '🌙'], ['Ansiedad', '🫨'],
  ['Confusión', '😕'], ['Frustración', '😣'], ['Rechazo', '💔'], ['Alivio', '🌤️'],
  ['Serenidad', '🪷'], ['Ternura', '🥰'], ['Deseo', '✨'], ['Nostalgia', '🍂'],
  ['Resentimiento', '🌧️'], ['Libertad', '🕊️'], ['Seguridad', '🛡️'], ['Incertidumbre', '🌫️'],
];

const achievements = [
  ['Éxito', '🏆'], ['Triunfo', '🥇'], ['Meta alcanzada', '🎯'], ['Graduación', '🎓'],
  ['Ceremonia', '🎉'], ['Reconocimiento', '🏅'], ['Ascenso laboral', '📈'], ['Nuevo proyecto', '💡'],
  ['Abundancia', '🌾'], ['Dinero', '💰'], ['Prosperidad', '✨'], ['Trabajo', '💼'],
  ['Viaje', '✈️'], ['Nuevo país', '🌍'], ['Hogar propio', '🏡'], ['Emprendimiento', '🚀'],
  ['Creatividad', '🎨'], ['Salud y bienestar', '🌿'], ['Estudios', '📚'], ['Unión familiar', '🫶'],
  ['Celebración', '🎊'], ['Independencia', '🦋'], ['Ahorro', '🏦'], ['Oportunidad', '🌈'],
];

const concepts = [
  ['Dinero / Abundancia', '💰'], ['Enfermedad / Síntoma', '🩺'], ['Destino', '🧭'],
  ['Trauma / Secreto', '🔒'], ['Muerte', '🕯️'], ['País de origen', '🏞️'],
  ['Culpa', '🪨'], ['Trabajo / Vocación', '🧰'], ['Casa / Hogar', '🏡'],
  ['Guerra / Migración', '🕊️'], ['Amor no correspondido', '💔'],
];

const groups: Array<[Category, ArchetypeInput[]]> = [
  ['mujeres', women],
  ['hombres', men],
  ['ancianos', elders],
  ['ninos', children],
  ['roles', roles],
  ['animales', animals],
  ['emociones', emotions.map(([name, icon]) => symbol(name!, icon!, 'Sentimiento o estado emocional', '#ec8a62'))],
  ['logros', achievements.map(([name, icon]) => symbol(name!, icon!, 'Meta, recurso o proyecto', '#e7aa56'))],
  ['conceptos', concepts.map(([name, icon]) => symbol(name!, icon!, 'Concepto sistémico', '#64748b'))],
];

export const categoryOrder = groups.map(([category]) => category);

export const archetypes: Archetype[] = groups.flatMap(([category, items]) =>
  items.map((item, index) => ({
    ...item,
    id: `${category}-${index}`,
    category,
  })),
);
