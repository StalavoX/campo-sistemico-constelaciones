/**
 * Lógica Principal de la Aplicación del Campo Sistémico
 */
let fieldNodes = [];
let fieldLines = [];
let selectedNodeId = null;
let currentCat = 'all';
let lineModeActive = false;
let lineStartNodeId = null;

// Gestor de historial
function pushState() {
  historyMgr.saveState(fieldNodes, fieldLines);
}

function undo() {
  const state = historyMgr.undo();
  if (state) {
    fieldNodes = state.nodes;
    fieldLines = state.lines;
    deselectNode();
    renderField();
  }
}

function redo() {
  const state = historyMgr.redo();
  if (state) {
    fieldNodes = state.nodes;
    fieldLines = state.lines;
    deselectNode();
    renderField();
  }
}

// Renderizado del Catálogo de Arquetipos
function renderCatalog() {
  const container = document.getElementById('catalogList');
  const query = document.getElementById('searchInput').value.toLowerCase();
  container.innerHTML = '';

  const items = rawArchetypes.filter(item => {
    const catMatch = currentCat === 'all' || item.cat === currentCat;
    const searchMatch = item.name.toLowerCase().includes(query) || item.eth.toLowerCase().includes(query);
    return catMatch && searchMatch;
  });

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'bg-slate-900 border border-slate-700 hover:border-indigo-500 rounded p-2 cursor-pointer flex flex-col items-center text-center transition group';
    card.onclick = () => addNode(item);
    card.innerHTML = `
      <div class="w-12 h-12 rounded-2xl flex items-center justify-center mb-1.5 shadow-md ring-1 ring-white/20 group-hover:scale-110 group-hover:-rotate-3 transition" style="background: linear-gradient(145deg, ${item.color}, ${item.color}bb)">
        ${getSvgIcon(item.icon)}
      </div>
      <span class="font-medium text-slate-200 line-clamp-1">${item.name}</span>
      <span class="text-[9px] text-slate-500">${item.eth}</span>
    `;
    container.appendChild(card);
  });
}

function setCategory(cat, clickEvent) {
  currentCat = cat;
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.classList.remove('bg-indigo-600', 'text-white');
    btn.classList.add('bg-slate-700', 'text-slate-300');
  });
  clickEvent.currentTarget.classList.remove('bg-slate-700', 'text-slate-300');
  clickEvent.currentTarget.classList.add('bg-indigo-600', 'text-white');
  renderCatalog();
}

// Añadir Nodo al Campo
function addNode(archetype) {
  const arena = document.getElementById('fieldArena');
  const rect = arena.getBoundingClientRect();

  const node = {
    id: 'node_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    name: archetype.name,
    icon: archetype.icon,
    color: archetype.color,
    x: (rect.width / 2) + (Math.random() * 80 - 40),
    y: (rect.height / 2) + (Math.random() * 80 - 40),
    rotation: 0,
    scale: 1.0
  };

  fieldNodes.push(node);
  pushState();
  renderField();
  selectNode(node.id);
}

// Modo Conexión de Líneas
function toggleLineMode() {
  lineModeActive = !lineModeActive;
  lineStartNodeId = null;
  const btn = document.getElementById('lineModeBtn');
  const hint = document.getElementById('statusHint');

  if (lineModeActive) {
    btn.classList.remove('bg-slate-700');
    btn.classList.add('bg-indigo-600', 'border-indigo-400');
    hint.innerText = '• Haz clic en el 1er y 2do elemento para unirlos';
  } else {
    btn.classList.remove('bg-indigo-600', 'border-indigo-400');
    btn.classList.add('bg-slate-700');
    hint.innerText = '';
  }
}

function handleNodeClick(nodeId) {
  if (lineModeActive) {
    if (!lineStartNodeId) {
      lineStartNodeId = nodeId;
      document.getElementById('statusHint').innerText = '• Selecciona el 2do elemento';
    } else if (lineStartNodeId !== nodeId) {
      fieldLines.push({
        id: 'line_' + Date.now(),
        from: lineStartNodeId,
        to: nodeId,
        style: 'solid',
        color: '#ef4444'
      });
      lineStartNodeId = null;
      toggleLineMode();
      pushState();
      renderField();
    }
  } else {
    selectNode(nodeId);
  }
}

// Renderizar Nodos y Líneas
function renderField() {
  const arena = document.getElementById('fieldArena');
  arena.innerHTML = '';

  fieldNodes.forEach(node => {
    const el = document.createElement('div');
    const isSelected = selectedNodeId === node.id;
    el.className = `node-item absolute flex flex-col items-center justify-center cursor-move ${isSelected ? 'z-30' : 'z-20'}`;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    el.style.transform = `translate(-50%, -50%) scale(${node.scale})`;

    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        <div class="absolute -top-3 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[9px] border-b-indigo-400 pointer-events-none"
             style="transform: rotate(${node.rotation}deg) translateY(-18px); transform-origin: center 25px;"></div>
        <div class="w-12 h-12 rounded-2xl border-2 ${isSelected ? 'border-amber-400 ring-4 ring-amber-400/40' : 'border-white/90'} flex items-center justify-center shadow-lg"
             style="background-color: ${node.color}">
          <div style="transform: rotate(${node.rotation}deg)">
            ${getSvgIcon(node.icon)}
          </div>
        </div>
      </div>
      <span data-node-label class="mt-1 bg-slate-900/90 text-slate-100 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-700 shadow max-w-[100px] truncate text-center pointer-events-none"></span>
    `;
    el.querySelector('[data-node-label]').textContent = node.name;

    el.addEventListener('pointerdown', (e) => {
      const connecting = lineModeActive;
      handleNodeClick(node.id);
      if (!connecting) startDrag(e, node);
    });

    arena.appendChild(el);
  });

  const svg = document.getElementById('svgLines');
  svg.innerHTML = '';

  fieldLines.forEach(line => {
    const fromNode = fieldNodes.find(n => n.id === line.from);
    const toNode = fieldNodes.find(n => n.id === line.to);

    if (fromNode && toNode) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      path.setAttribute('x1', fromNode.x);
      path.setAttribute('y1', fromNode.y);
      path.setAttribute('x2', toNode.x);
      path.setAttribute('y2', toNode.y);
      path.setAttribute('stroke', line.color);
      path.setAttribute('stroke-width', '2.5');

      if (line.style === 'dashed') path.setAttribute('stroke-dasharray', '6,6');
      if (line.style === 'dotted') path.setAttribute('stroke-dasharray', '2,4');

      svg.appendChild(path);
    }
  });

  document.getElementById('elemCounter').innerText = fieldNodes.length;
  document.getElementById('lineCounter').innerText = fieldLines.length;
}

// Lógica Drag and Drop
let isDragging = false;
let dragTarget = null;
let dragOffset = { x: 0, y: 0 };

function startDrag(e, node) {
  if (lineModeActive) return;
  isDragging = true;
  dragTarget = node;

  const arena = document.getElementById('fieldArena');
  const rect = arena.getBoundingClientRect();
  dragOffset.x = e.clientX - (rect.left + node.x);
  dragOffset.y = e.clientY - (rect.top + node.y);

  window.addEventListener('pointermove', onDrag);
  window.addEventListener('pointerup', stopDrag);
}

function onDrag(e) {
  if (!isDragging || !dragTarget) return;
  const arena = document.getElementById('fieldArena');
  const rect = arena.getBoundingClientRect();

  let nx = e.clientX - rect.left - dragOffset.x;
  let ny = e.clientY - rect.top - dragOffset.y;

  const radius = rect.width / 2 - 20;
  const dx = nx - rect.width / 2;
  const dy = ny - rect.height / 2;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > radius) {
    nx = rect.width / 2 + (dx / dist) * radius;
    ny = rect.height / 2 + (dy / dist) * radius;
  }

  dragTarget.x = nx;
  dragTarget.y = ny;
  renderField();
}

function stopDrag() {
  if (isDragging) {
    pushState();
  }
  isDragging = false;
  dragTarget = null;
  window.removeEventListener('pointermove', onDrag);
  window.removeEventListener('pointerup', stopDrag);
}

// Inspector de Propiedades
function selectNode(id) {
  selectedNodeId = id;
  const node = fieldNodes.find(n => n.id === id);
  const inspector = document.getElementById('inspector');

  if (node) {
    inspector.classList.remove('hidden');
    document.getElementById('inspLabel').value = node.name;
    document.getElementById('inspRot').value = node.rotation;
    document.getElementById('inspScale').value = node.scale;
    document.getElementById('inspDeg').innerText = node.rotation;
    document.getElementById('inspScaleVal').innerText = node.scale;
  } else {
    inspector.classList.add('hidden');
  }
  renderField();
}

function deselectNode() {
  selectedNodeId = null;
  document.getElementById('inspector').classList.add('hidden');
  renderField();
}

function updateNodeProps() {
  if (!selectedNodeId) return;
  const node = fieldNodes.find(n => n.id === selectedNodeId);
  if (node) {
    node.name = document.getElementById('inspLabel').value;
    node.rotation = parseInt(document.getElementById('inspRot').value);
    node.scale = parseFloat(document.getElementById('inspScale').value);
    document.getElementById('inspDeg').innerText = node.rotation;
    document.getElementById('inspScaleVal').innerText = node.scale;
    renderField();
  }
}

function deleteSelectedNode() {
  if (!selectedNodeId) return;
  fieldNodes = fieldNodes.filter(n => n.id !== selectedNodeId);
  fieldLines = fieldLines.filter(l => l.from !== selectedNodeId && l.to !== selectedNodeId);
  deselectNode();
  pushState();
  renderField();
}

function clearAll() {
  if (confirm('¿Vaciar completamente el mapa sistémico?')) {
    fieldNodes = [];
    fieldLines = [];
    deselectNode();
    pushState();
    renderField();
  }
}

function insertPhrase(phrase) {
  const notes = document.getElementById('sessionNotes');
  notes.value += (notes.value ? '\n\n' : '') + `• Frase Sanadora: "${phrase}"`;
}

function parseSessionData(rawData) {
  const data = JSON.parse(rawData);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('El archivo debe contener un objeto JSON.');
  }

  const nodes = data.nodes === undefined ? [] : data.nodes;
  const lines = data.lines === undefined ? [] : data.lines;
  if (!Array.isArray(nodes) || !Array.isArray(lines)) {
    throw new Error('La sesión debe incluir listas válidas de elementos y vínculos.');
  }

  const validNodes = nodes.map((node, index) => {
    if (!node || typeof node !== 'object' || typeof node.id !== 'string' ||
        typeof node.name !== 'string' || !Number.isFinite(Number(node.x)) ||
        !Number.isFinite(Number(node.y))) {
      throw new Error(`El elemento ${index + 1} tiene datos incompletos o inválidos.`);
    }
    return {
      ...node,
      icon: typeof node.icon === 'string' ? node.icon : 'star',
      color: typeof node.color === 'string' ? node.color : '#6366f1',
      x: Number(node.x),
      y: Number(node.y),
      rotation: Number.isFinite(Number(node.rotation)) ? Number(node.rotation) : 0,
      scale: Number.isFinite(Number(node.scale)) ? Number(node.scale) : 1
    };
  });

  const validLines = lines.map((line, index) => {
    if (!line || typeof line !== 'object' || typeof line.from !== 'string' ||
        typeof line.to !== 'string') {
      throw new Error(`El vínculo ${index + 1} tiene datos incompletos o inválidos.`);
    }
    return {
      ...line,
      style: ['solid', 'dashed', 'dotted'].includes(line.style) ? line.style : 'solid',
      color: typeof line.color === 'string' ? line.color : '#ef4444'
    };
  });

  return {
    nodes: validNodes,
    lines: validLines,
    notes: typeof data.notes === 'string' ? data.notes : '',
    client: typeof data.client === 'string' ? data.client : ''
  };
}

// Persistencia
function saveLocal() {
  const data = { nodes: fieldNodes, lines: fieldLines, notes: document.getElementById('sessionNotes').value, client: document.getElementById('sessionClient').value };
  try {
    localStorage.setItem('constelacion_pro_data', JSON.stringify(data));
    alert('¡Estado guardado localmente!');
  } catch (error) {
    alert(`No se pudo guardar la sesión localmente: ${error.message}`);
  }
}

function loadLocal() {
  let saved;
  try {
    saved = localStorage.getItem('constelacion_pro_data');
  } catch (error) {
    alert(`No se pudo acceder al guardado local: ${error.message}`);
    return;
  }
  if (saved) {
    try {
      const data = parseSessionData(saved);
      fieldNodes = data.nodes;
      fieldLines = data.lines;
      document.getElementById('sessionNotes').value = data.notes;
      document.getElementById('sessionClient').value = data.client;
      pushState();
      renderField();
    } catch (error) {
      alert(`No se pudo cargar la sesión guardada: ${error.message}`);
    }
  }
}

function exportJSON() {
  const data = { nodes: fieldNodes, lines: fieldLines, notes: document.getElementById('sessionNotes').value, client: document.getElementById('sessionClient').value };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `constelacion_${Date.now()}.json`;
  a.click();
}

function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = parseSessionData(evt.target.result);
      fieldNodes = data.nodes;
      fieldLines = data.lines;
      document.getElementById('sessionNotes').value = data.notes;
      document.getElementById('sessionClient').value = data.client;
      pushState();
      renderField();
    } catch (error) {
      alert(`No se pudo importar el archivo: ${error.message}`);
    } finally {
      e.target.value = '';
    }
  };
  reader.onerror = () => {
    alert('No se pudo leer el archivo seleccionado.');
    e.target.value = '';
  };
  reader.readAsText(file);
}

// Generación de Imágenes y Reportes
function drawConstellation(canvas) {
  const ctx = canvas.getContext('2d');
  const width = 1000;
  const height = 1080;
  const centerX = width / 2;
  const centerY = 548;
  const radius = 432;
  const arenaSize = Math.max(1, document.getElementById('fieldArena').getBoundingClientRect().width);
  const exportScale = (radius * 2) / arenaSize;
  canvas.width = width;
  canvas.height = height;

  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, '#0f172a');
  background.addColorStop(0.55, '#111827');
  background.addColorStop(1, '#080d19');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  [[64, 106], [174, 202], [875, 92], [930, 236], [58, 754], [120, 940], [900, 835], [812, 1000], [265, 984], [744, 117]].forEach(([x, y], i) => {
    ctx.beginPath();
    ctx.arc(x, y, i % 3 === 0 ? 2 : 1.3, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(199, 210, 254, .8)' : 'rgba(186, 230, 253, .65)';
    ctx.shadowColor = '#a5b4fc';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  ctx.fillStyle = '#e0e7ff';
  ctx.font = '600 30px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CAMPO SISTÉMICO', centerX, 51);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px Arial, sans-serif';
  const client = document.getElementById('sessionClient').value.trim();
  ctx.fillText(`${client ? `Sesión: ${client}  ·  ` : ''}${new Date().toLocaleDateString()}`, centerX, 80);

  const disk = ctx.createRadialGradient(centerX, centerY - 35, 40, centerX, centerY, radius);
  disk.addColorStop(0, '#1b2944');
  disk.addColorStop(0.64, '#111c30');
  disk.addColorStop(1, '#0b1220');
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = disk;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(199, 210, 254, .55)';
  ctx.shadowColor = 'rgba(99, 102, 241, .35)';
  ctx.shadowBlur = 26;
  ctx.stroke();
  ctx.shadowBlur = 0;

  [radius * 0.70, radius * 0.38].forEach((ringRadius, i) => {
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.setLineDash(i === 0 ? [5, 8] : []);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = i === 0 ? 'rgba(129, 140, 248, .38)' : 'rgba(125, 211, 252, .38)';
    ctx.stroke();
  });
  ctx.setLineDash([]);

  for (let tick = 0; tick < 60; tick++) {
    const angle = (tick / 60) * Math.PI * 2 - Math.PI / 2;
    const major = tick % 5 === 0;
    const innerRadius = radius - (major ? 24 : 13);
    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(angle) * innerRadius, centerY + Math.sin(angle) * innerRadius);
    ctx.lineTo(centerX + Math.cos(angle) * (radius - 7), centerY + Math.sin(angle) * (radius - 7));
    ctx.lineWidth = major ? 2 : 1;
    ctx.strokeStyle = major ? 'rgba(199, 210, 254, .8)' : 'rgba(148, 163, 184, .38)';
    ctx.stroke();
  }

  ctx.font = '600 18px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let hour = 1; hour <= 12; hour++) {
    const angle = (hour / 12) * Math.PI * 2 - Math.PI / 2;
    const labelRadius = radius - 52;
    const x = centerX + Math.cos(angle) * labelRadius;
    const y = centerY + Math.sin(angle) * labelRadius;
    ctx.beginPath();
    ctx.arc(x, y, 17, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, .78)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, .23)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#c7d2fe';
    ctx.fillText(String(hour), x, y + 1);
  }

  fieldLines.forEach(l => {
    const fn = fieldNodes.find(n => n.id === l.from);
    const tn = fieldNodes.find(n => n.id === l.to);
    if (fn && tn) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX + (fn.x - arenaSize / 2) * exportScale, centerY + (fn.y - arenaSize / 2) * exportScale);
      ctx.lineTo(centerX + (tn.x - arenaSize / 2) * exportScale, centerY + (tn.y - arenaSize / 2) * exportScale);
      ctx.strokeStyle = l.color || '#f87171';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.shadowColor = l.color || '#f87171';
      ctx.shadowBlur = 8;
      if (l.style === 'dashed') ctx.setLineDash([12, 9]);
      if (l.style === 'dotted') ctx.setLineDash([3, 8]);
      ctx.stroke();
      ctx.restore();
    }
  });

  fieldNodes.forEach(n => {
    const cx = centerX + (n.x - arenaSize / 2) * exportScale;
    const cy = centerY + (n.y - arenaSize / 2) * exportScale;
    const nodeRadius = Math.max(25, 28 * n.scale);
    ctx.beginPath();
    ctx.arc(cx, cy, nodeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = n.color || '#818cf8';
    ctx.shadowColor = n.color || '#818cf8';
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, nodeRadius - 3, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = n.color || '#4f46e5';
    ctx.fillRect(cx - nodeRadius, cy - nodeRadius, nodeRadius * 2, nodeRadius * 2);
    ctx.font = `${Math.round(nodeRadius * 1.12)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SVGIcons[n.icon] || SVGIcons.star, cx, cy + 1);
    ctx.restore();

    const maxLabelWidth = 190;
    ctx.font = '600 14px Arial, sans-serif';
    const label = n.name.length > 25 ? `${n.name.slice(0, 23)}…` : n.name;
    const labelWidth = Math.min(maxLabelWidth, ctx.measureText(label).width + 20);
    const labelY = cy + nodeRadius + 14;
    ctx.beginPath();
    ctx.roundRect(cx - labelWidth / 2, labelY, labelWidth, 27, 8);
    ctx.fillStyle = 'rgba(8, 13, 25, .92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, .35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, labelY + 14, maxLabelWidth - 12);
  });

  ctx.beginPath();
  ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#818cf8';
  ctx.shadowColor = '#818cf8';
  ctx.shadowBlur = 18;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '14px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${fieldNodes.length} elementos  ·  ${fieldLines.length} vínculos`, centerX, 1030);
}

function exportPNG() {
  const canvas = document.getElementById('exportCanvas');
  drawConstellation(canvas);
  const a = document.createElement('a');
  a.download = `constelacion_${Date.now()}.png`;
  a.href = canvas.toDataURL();
  a.click();
}

function printReport() {
  const client = document.getElementById('sessionClient').value || 'Sin nombre';
  const notes = document.getElementById('sessionNotes').value || 'Sin notas registradas.';
  const report = document.getElementById('printableReport');
  const canvas = document.getElementById('exportCanvas');
  drawConstellation(canvas);
  report.replaceChildren();

  const header = document.createElement('header');
  header.className = 'report-header';
  const titleBlock = document.createElement('div');
  const title = document.createElement('h1');
  title.className = 'report-title';
  title.textContent = 'Informe de Campo Sistémico';
  const subtitle = document.createElement('p');
  subtitle.className = 'report-subtitle';
  subtitle.textContent = 'Registro de sesión y disposición de elementos';
  titleBlock.append(title, subtitle);
  const metadata = document.createElement('p');
  metadata.className = 'report-meta';
  metadata.textContent = `Fecha: ${new Date().toLocaleDateString()} · Cliente: ${client}`;
  header.append(titleBlock, metadata);
  report.appendChild(header);

  const summary = document.createElement('div');
  summary.className = 'report-summary';
  [
    ['Elementos', fieldNodes.length],
    ['Vínculos', fieldLines.length],
    ['Notas', document.getElementById('sessionNotes').value.trim() ? 'Registradas' : 'Sin notas']
  ].forEach(([label, value]) => {
    const stat = document.createElement('div');
    stat.className = 'report-stat';
    const count = document.createElement('strong');
    count.textContent = value;
    stat.append(count, document.createTextNode(label));
    summary.appendChild(stat);
  });
  report.appendChild(summary);

  const addSection = (heading) => {
    const section = document.createElement('section');
    section.className = 'report-section';
    const h2 = document.createElement('h2');
    h2.textContent = heading;
    section.appendChild(h2);
    report.appendChild(section);
    return section;
  };

  const fieldSection = addSection('Mapa de la constelación');
  const image = document.createElement('img');
  image.className = 'report-clock';
  image.alt = 'Representación del reloj sistémico con elementos y vínculos';
  image.src = canvas.toDataURL('image/png');
  fieldSection.appendChild(image);

  const elementsSection = addSection('Elementos en el campo');
  const arenaSize = Math.max(1, document.getElementById('fieldArena').getBoundingClientRect().width);
  const arenaCenter = arenaSize / 2;
  const table = document.createElement('table');
  table.className = 'report-table';
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Elemento', 'Zona', 'Hora', 'Mirada', 'Escala'].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  fieldNodes.forEach(node => {
    const dx = node.x - arenaCenter;
    const dy = node.y - arenaCenter;
    const distance = Math.sqrt(dx * dx + dy * dy) / arenaCenter;
    const zone = distance <= 0.38 ? 'Núcleo' : distance <= 0.70 ? 'Medio' : 'Exterior';
    const hour = distance < 0.04 ? 'Centro' : String(Math.round((Math.atan2(dx, -dy) * 6 / Math.PI + 12) % 12) || 12);
    const row = document.createElement('tr');
    [
      `${SVGIcons[node.icon] || SVGIcons.star} ${node.name}`,
      zone,
      hour,
      `${node.rotation}°`,
      `${Number(node.scale).toFixed(1)}×`
    ].forEach(value => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  elementsSection.appendChild(table);

  const linesSection = addSection('Vínculos y relaciones');
  const linesList = document.createElement('ul');
  fieldLines.forEach(line => {
    const from = fieldNodes.find(node => node.id === line.from);
    const to = fieldNodes.find(node => node.id === line.to);
    if (!from || !to) return;
    const item = document.createElement('li');
    const style = line.style === 'dashed' ? 'discontinuo' : line.style === 'dotted' ? 'punteado' : 'continuo';
    item.textContent = `${from.name} ↔ ${to.name} · trazo ${style}`;
    linesList.appendChild(item);
  });
  if (!linesList.childElementCount) {
    const empty = document.createElement('li');
    empty.textContent = 'No se registraron vínculos.';
    linesList.appendChild(empty);
  }
  linesSection.appendChild(linesList);

  const notesSection = addSection('Notas y observaciones');
  const notesBlock = document.createElement('p');
  notesBlock.className = 'report-notes';
  notesBlock.textContent = notes;
  notesSection.appendChild(notesBlock);

  const footer = document.createElement('footer');
  footer.className = 'report-footer';
  footer.textContent = 'Documento generado desde Campo Sistémico Pro.';
  report.appendChild(footer);

  report.classList.remove('hidden');
  window.print();
  report.classList.add('hidden');
}

// Inicialización
window.onload = () => {
  renderCatalog();
  pushState();
  loadLocal();
};
