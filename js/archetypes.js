/**
 * Base de Datos de Arquetipos (>110 Elementos)
 */
const femaleEthnicityIcons = [
  'femaleBrownHair', 'femaleCurly', 'femaleAsian', 'femaleBlonde',
  'femaleIndigenous', 'femaleArab', 'femaleBrownHair', 'femaleBraided',
  'femalePolynesian'
];

const femaleAppearances = [
  { name: 'Mujer pelirroja', eth: 'Cabello pelirrojo', icon: 'femaleRedhead' },
  { name: 'Mujer de cabello negro', eth: 'Cabello negro', icon: 'femaleBlackHair' },
  { name: 'Mujer rubia', eth: 'Cabello rubio', icon: 'femaleBlonde' },
  { name: 'Mujer de cabello castaño', eth: 'Cabello castaño', icon: 'femaleBrownHair' },
  { name: 'Mujer joven', eth: 'Edad', icon: 'femaleYoung' },
  { name: 'Mujer adulta mayor', eth: 'Edad', icon: 'femaleOlder' },
  { name: 'Mujer de cabello rizado', eth: 'Cabello rizado', icon: 'femaleCurly' },
  { name: 'Mujer de cabello trenzado', eth: 'Cabello trenzado', icon: 'femaleBraided' },
  { name: 'Mujer de cabello corto', eth: 'Cabello corto', icon: 'femaleShortHair' }
];

const rawArchetypes = [
  // Mujeres (Etnias y Variaciones)
  ...['Hispana', 'Afro', 'Asiática', 'Caucásica', 'Indígena', 'Árabe', 'Mestiza', 'Romani', 'Polinesia'].map((e, i) => 
    ({ id: `m_${i}`, name: `Mujer ${e}`, cat: 'mujeres', eth: e, icon: femaleEthnicityIcons[i], color: '#ec4899' })),
  ...femaleAppearances.map((appearance, i) =>
    ({ id: `m_ap_${i}`, ...appearance, cat: 'mujeres', color: '#ec4899' })),
  
  // Hombres (Etnias y Variaciones)
  ...['Hispano', 'Afro', 'Asiático', 'Caucásico', 'Indígena', 'Árabe', 'Mestizo', 'Romani', 'Polinesio'].map((e, i) => 
    ({ id: `h_${i}`, name: `Hombre ${e}`, cat: 'hombres', eth: e, icon: ['male', 'maleAfro', 'maleAsian', 'male', 'maleIndigenous', 'maleArab', 'male', 'male', 'malePolynesian'][i], color: '#2563eb' })),

  // Ancianos / Ancestros
  ...['Abuela Paterna', 'Abuela Materna', 'Abuelo Paterno', 'Abuelo Materno', 'Bisabuela', 'Bisabuelo', 'Ancestro Sabio', 'Ancestro Excluido'].map((r, i) =>
    ({ id: `anc_${i}`, name: r, cat: 'ancianos', eth: 'Ancestral', icon: r.includes('Abuela') || r === 'Bisabuela' ? 'femaleOlder' : 'senior', color: i < 2 || i === 4 ? '#9333ea' : '#4f46e5' })),

  // Niños / Bebés / Feto
  ...['Hijo/a Primogénito', 'Segundo Hijo/a', 'Hijo/a Menor', 'Bebé', 'Gemelo/a', 'Hijo No Nacido / Aborto', 'Niño Interior'].map((r, i) =>
    ({ id: `nin_${i}`, name: r, cat: 'ninos', eth: 'Familia', icon: ['child', 'childGirl', 'child', 'baby', 'twins', 'star', 'heart'][i], color: '#f472b6' })),

  // Roles Familiares Específicos
  ...['Matriarca', 'Patriarca', 'Madre Adoptiva', 'Padre Adoptivo', 'Tío / Tía', 'Primo / Prima', 'Primer Amor', 'Ex-Pareja', 'Pareja Actual', 'Hermano no Logrado', 'Hijo Adoptado'].map((r, i) =>
    ({ id: `rol_${i}`, name: r, cat: 'roles', eth: 'Vínculo', icon: ['matriarch', 'patriarch', 'adoptiveMother', 'adoptiveFather', 'auntUncle', 'cousin', 'firstLove', 'exPartner', 'currentPartner', 'lostSibling', 'adoptedChild'][i], color: '#0d9488' })),

  // Animales Domésticos & Salvajes
  ...['Perro (Lealtad)', 'Gato (Intuitivo)', 'Caballo (Fuerza)', 'Lobo (Manada)', 'Águila (Visión)', 'Búho (Sabiduría)', 'Serpiente (Sanación)', 'Oso (Protección)', 'Delfín / Pez (Emoción)', 'Mariposa (Transformación)', 'Colibrí (Alegría)', 'Zorro (Astucia)', 'Elefante (Memoria)', 'Tortuga (Longevidad)'].map((a, i) =>
    ({ id: `ani_${i}`, name: a, cat: 'animales', eth: 'Tótem / Mascota', icon: ['dog', 'cat', 'horse', 'wolf', 'eagle', 'owl', 'snake', 'bear', 'dolphin', 'butterfly', 'hummingbird', 'fox', 'elephant', 'turtle'][i], color: '#10b981' })),

  // Conceptos Sistémicos y Abstracciones
  ...['El Dinero / Abundancia', 'Enfermedad / Síntoma', 'El Destino', 'El Trauma / Secreto', 'La Muerte', 'El País de Origen', 'La Culpa', 'El Trabajo / Vocación', 'La Casa / Hogar', 'Guerra / Migración', 'El Amor No Correspondido'].map((c, i) =>
    ({ id: `cnc_${i}`, name: c, cat: 'conceptos', eth: 'Abstracto', icon: ['money', 'illness', 'destiny', 'trauma', 'death', 'homeland', 'guilt', 'work', 'home', 'war', 'unrequitedLove'][i], color: i === 1 ? '#ef4444' : i === 0 ? '#eab308' : '#64748b' }))
];
