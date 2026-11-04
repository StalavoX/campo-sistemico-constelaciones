<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import FieldBoard from './components/FieldBoard.vue';
import { archetypes, categoryOrder } from './data/archetypes';
import { listSessions, removeSession, saveSession } from './storage';
import type { Category, FieldLine, FieldNode, Session } from './types';
import { categoryLabels } from './types';
import { cloneState, createSession, getClockHour, getOrientationLabel, getZone, validateSession } from './utils';

type Snapshot = { nodes: FieldNode[]; lines: FieldLine[] };
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

const session = ref<Session>(createSession('Mi primera sesión'));
const sessions = ref<Session[]>([]);
const search = ref('');
const category = ref<Category | 'all'>('all');
const selectedNodeId = ref<string | null>(null);
const selectedLineId = ref<string | null>(null);
const connectMode = ref(false);
const firstConnectionNode = ref<string | null>(null);
const snapToGrid = ref(false);
const showCatalog = ref(false);
const showDetails = ref(false);
const largeText = ref(false);
const saveStatus = ref<'saved' | 'saving' | 'error'>('saved');
const toastMessage = ref('');
const installEvent = ref<InstallEvent | null>(null);
const reportVisible = ref(false);
const reportImage = ref('');
const importInput = ref<HTMLInputElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
let saveTimer = 0;
let toastTimer = 0;
const history = ref<Snapshot[]>([]);
const historyIndex = ref(-1);
const directions = [
  { rotation: 0, label: 'Frente', icon: '↑' },
  { rotation: 90, label: 'Derecha', icon: '→' },
  { rotation: 180, label: 'Espalda', icon: '↓' },
  { rotation: 270, label: 'Izquierda', icon: '←' },
];

const filteredArchetypes = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('es');
  return archetypes.filter((item) => {
    const categoryMatches = category.value === 'all' || item.category === category.value;
    const queryMatches = !query || `${item.name} ${item.detail} ${categoryLabels[item.category]}`.toLocaleLowerCase('es').includes(query);
    return categoryMatches && queryMatches;
  });
});
const selectedNode = computed(() => session.value.nodes.find((node) => node.id === selectedNodeId.value) ?? null);
const selectedLine = computed(() => session.value.lines.find((line) => line.id === selectedLineId.value) ?? null);
const totalCount = computed(() => session.value.nodes.length);

function showToast(message: string) {
  toastMessage.value = message;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toastMessage.value = ''; }, 3200);
}

function resetHistory() {
  history.value = [cloneState({ nodes: session.value.nodes, lines: session.value.lines })];
  historyIndex.value = 0;
}

function commitHistory() {
  const next = cloneState({ nodes: session.value.nodes, lines: session.value.lines });
  if (JSON.stringify(history.value[historyIndex.value]) === JSON.stringify(next)) return;
  history.value = history.value.slice(0, historyIndex.value + 1);
  history.value.push(next);
  historyIndex.value = history.value.length - 1;
}

function undo() {
  if (historyIndex.value <= 0) return;
  historyIndex.value -= 1;
  Object.assign(session.value, cloneState(history.value[historyIndex.value]!));
}

function redo() {
  if (historyIndex.value >= history.value.length - 1) return;
  historyIndex.value += 1;
  Object.assign(session.value, cloneState(history.value[historyIndex.value]!));
}

function scheduleSave() {
  saveStatus.value = 'saving';
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => { void persistSession(); }, 500);
}

async function persistSession() {
  session.value.updatedAt = new Date().toISOString();
  try {
    await saveSession(cloneState(session.value));
    const index = sessions.value.findIndex((item) => item.id === session.value.id);
    if (index === -1) sessions.value.unshift(cloneState(session.value));
    else sessions.value[index] = cloneState(session.value);
    saveStatus.value = 'saved';
  } catch (error) {
    saveStatus.value = 'error';
    showToast(`No se pudo guardar localmente: ${error instanceof Error ? error.message : 'error desconocido'}`);
  }
}

watch(() => JSON.stringify({
  id: session.value.id,
  name: session.value.name,
  facilitator: session.value.facilitator,
  client: session.value.client,
  notes: session.value.notes,
  nodes: session.value.nodes,
  lines: session.value.lines,
}), scheduleSave);

function addNode(archetype: typeof archetypes[number]) {
  const index = session.value.nodes.length;
  const angle = index * 2.399963;
  const distance = Math.min(350, 150 + index * 8);
  const node: FieldNode = {
    id: crypto.randomUUID(),
    name: archetype.name,
    icon: archetype.icon,
    color: archetype.color,
    ...(archetype.figure ? { figure: cloneState(archetype.figure) } : {}),
    x: Math.round(500 + Math.cos(angle) * distance),
    y: Math.round(500 + Math.sin(angle) * distance),
    rotation: 0,
    scale: 1,
  };
  session.value.nodes.push(node);
  selectedNodeId.value = node.id;
  selectedLineId.value = null;
  commitHistory();
}

function activateNode(id: string) {
  if (!id) {
    selectedNodeId.value = null;
    selectedLineId.value = null;
    return;
  }
  if (!connectMode.value) {
    selectedNodeId.value = id;
    selectedLineId.value = null;
    showDetails.value = true;
    return;
  }
  if (!firstConnectionNode.value) {
    firstConnectionNode.value = id;
    selectedNodeId.value = id;
    showToast('Selecciona el segundo elemento para crear el vínculo.');
  } else if (firstConnectionNode.value !== id) {
    if (session.value.lines.some((line) => line.from === firstConnectionNode.value && line.to === id || line.from === id && line.to === firstConnectionNode.value)) {
      showToast('Ya existe un vínculo entre estos elementos.');
    } else {
      session.value.lines.push({
        id: crypto.randomUUID(),
        from: firstConnectionNode.value,
        to: id,
        kind: 'solid',
        label: 'Vínculo',
        color: '#a5b4fc',
      });
      selectedLineId.value = session.value.lines.at(-1)!.id;
      selectedNodeId.value = null;
      commitHistory();
      showDetails.value = true;
    }
    connectMode.value = false;
    firstConnectionNode.value = null;
  }
}

function toggleConnect() {
  connectMode.value = !connectMode.value;
  firstConnectionNode.value = null;
  if (connectMode.value) showToast('Elige dos elementos para conectarlos.');
}

function moveNode(id: string, x: number, y: number) {
  const node = session.value.nodes.find((item) => item.id === id);
  if (node) {
    node.x = x;
    node.y = y;
  }
}

function deleteSelected() {
  if (selectedNodeId.value) {
    session.value.nodes = session.value.nodes.filter((node) => node.id !== selectedNodeId.value);
    session.value.lines = session.value.lines.filter((line) => line.from !== selectedNodeId.value && line.to !== selectedNodeId.value);
    selectedNodeId.value = null;
    commitHistory();
  } else if (selectedLineId.value) {
    session.value.lines = session.value.lines.filter((line) => line.id !== selectedLineId.value);
    selectedLineId.value = null;
    commitHistory();
  }
}

function centerNodes() {
  const count = session.value.nodes.length;
  if (!count) return;
  const radius = Math.min(290, 90 + count * 13);
  session.value.nodes.forEach((node, index) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    node.x = Math.round(500 + Math.cos(angle) * radius);
    node.y = Math.round(500 + Math.sin(angle) * radius);
  });
  commitHistory();
  showToast('Elementos distribuidos alrededor del centro.');
}

async function createNewSession() {
  window.clearTimeout(saveTimer);
  await persistSession();
  const next = createSession(`Sesión ${new Date().toLocaleDateString('es')}`);
  session.value = next;
  sessions.value.unshift(cloneState(next));
  resetHistory();
  selectedNodeId.value = null;
  selectedLineId.value = null;
}

async function duplicateSession() {
  window.clearTimeout(saveTimer);
  await persistSession();
  const copy = cloneState(session.value);
  copy.id = crypto.randomUUID();
  copy.name = `${copy.name} (copia)`;
  copy.createdAt = new Date().toISOString();
  copy.updatedAt = copy.createdAt;
  session.value = copy;
  sessions.value.unshift(cloneState(copy));
  resetHistory();
  showToast('Se creó una copia de la sesión.');
}

async function switchSession(event: Event) {
  const id = (event.target as HTMLSelectElement).value;
  const chosen = sessions.value.find((item) => item.id === id);
  if (!chosen || chosen.id === session.value.id) return;
  window.clearTimeout(saveTimer);
  await persistSession();
  session.value = cloneState(chosen);
  resetHistory();
  selectedNodeId.value = null;
  selectedLineId.value = null;
}

async function deleteSession() {
  if (!window.confirm(`¿Eliminar la sesión «${session.value.name}» de este dispositivo?`)) return;
  window.clearTimeout(saveTimer);
  try {
    await removeSession(session.value.id);
    sessions.value = sessions.value.filter((item) => item.id !== session.value.id);
    session.value = sessions.value.length ? cloneState(sessions.value[0]!) : createSession('Mi primera sesión');
    resetHistory();
    showToast('Sesión eliminada de este dispositivo.');
  } catch (error) {
    showToast(`No se pudo eliminar: ${error instanceof Error ? error.message : 'error desconocido'}`);
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportJson() {
  downloadBlob(new Blob([JSON.stringify(session.value, null, 2)], { type: 'application/json' }), `${safeFileName(session.value.name)}.json`);
  showToast('Sesión exportada como JSON.');
}

function safeFileName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'sesion';
}

async function importJson(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const imported = validateSession(JSON.parse(await file.text()));
    imported.id = crypto.randomUUID();
    imported.name = `${imported.name} (importada)`;
    imported.createdAt = new Date().toISOString();
    imported.updatedAt = imported.createdAt;
    session.value = imported;
    sessions.value.unshift(cloneState(imported));
    resetHistory();
    showToast('Sesión importada correctamente.');
  } catch (error) {
    showToast(`No se pudo importar: ${error instanceof Error ? error.message : 'archivo inválido'}`);
  } finally {
    input.value = '';
  }
}

function svgDataUrl(): string {
  const svg = document.querySelector<SVGSVGElement>('.field-board');
  if (!svg) throw new Error('No se encontró el tablero para exportar.');
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', '1000');
  clone.setAttribute('height', '1000');
  clone.querySelectorAll('[tabindex]').forEach((element) => element.removeAttribute('tabindex'));
  const styles = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styles.textContent = `
    text { font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif; }
    .clock-hour-label circle { fill: #0f172a; fill-opacity: .84; stroke: #94a3b8; stroke-opacity: .32; }
    .clock-hour-label text { fill: #c7d2fe; text-anchor: middle; font: 600 18px Arial, sans-serif; }
    .node-emoji { text-anchor: middle; dominant-baseline: middle; }
    .node-label rect { fill: #080d19; fill-opacity: .94; stroke: #94a3b8; stroke-opacity: .42; }
    .node-label text { fill: #f8fafc; text-anchor: middle; font: 600 18px Arial, sans-serif; }
    .board-center { fill: #818cf8; stroke: #e0e7ff; stroke-width: 3; }
  `;
  clone.insertBefore(styles, clone.firstChild);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
}

async function exportPng() {
  try {
    const image = new Image();
    image.src = svgDataUrl();
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1600;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No se pudo crear el lienzo de exportación.');
    context.fillStyle = '#0b1020';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('No se pudo generar la imagen PNG.')), 'image/png'));
    downloadBlob(blob, `${safeFileName(session.value.name)}.png`);
    showToast('Mapa exportado como PNG.');
  } catch (error) {
    showToast(`No se pudo exportar la imagen: ${error instanceof Error ? error.message : 'error desconocido'}`);
  }
}

async function printReport() {
  try {
    reportImage.value = svgDataUrl();
    reportVisible.value = true;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    window.print();
  } catch (error) {
    showToast(`No se pudo preparar el informe: ${error instanceof Error ? error.message : 'error desconocido'}`);
  } finally {
    reportVisible.value = false;
  }
}

function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    event.shiftKey ? redo() : undo();
  } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
    event.preventDefault();
    redo();
  } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    window.clearTimeout(saveTimer);
    void persistSession();
  } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput.value?.focus();
  } else if (!typing && selectedNodeId.value && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    const node = session.value.nodes.find((item) => item.id === selectedNodeId.value);
    if (!node) return;
    event.preventDefault();
    const step = snapToGrid.value ? 20 : 10;
    if (event.key === 'ArrowUp') node.y = Math.max(40, node.y - step);
    if (event.key === 'ArrowDown') node.y = Math.min(960, node.y + step);
    if (event.key === 'ArrowLeft') node.x = Math.max(40, node.x - step);
    if (event.key === 'ArrowRight') node.x = Math.min(960, node.x + step);
    commitHistory();
  } else if (!typing && (event.key === 'Delete' || event.key === 'Backspace')) {
    deleteSelected();
  } else if (event.key === 'Escape') {
    selectedNodeId.value = null;
    selectedLineId.value = null;
    connectMode.value = false;
    firstConnectionNode.value = null;
  }
}

async function installApp() {
  if (!installEvent.value) return;
  await installEvent.value.prompt();
  installEvent.value = null;
}

function onBeforeInstall(event: Event) {
  event.preventDefault();
  installEvent.value = event as InstallEvent;
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('beforeinstallprompt', onBeforeInstall);
  try {
    sessions.value = await listSessions();
    if (sessions.value.length) session.value = cloneState(sessions.value[0]!);
    else {
      sessions.value = [cloneState(session.value)];
      await saveSession(cloneState(session.value));
    }
  } catch (error) {
    saveStatus.value = 'error';
    showToast(`No se pudo abrir el almacenamiento local: ${error instanceof Error ? error.message : 'error desconocido'}`);
  }
  resetHistory();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  window.clearTimeout(saveTimer);
  window.clearTimeout(toastTimer);
});
</script>

<template>
  <div class="app-shell" :class="{ 'large-text': largeText }">
    <header class="topbar">
      <a class="brand" href="./" aria-label="Campo Sistémico, inicio">
        <span class="brand-mark">✧</span>
        <span class="brand-copy"><strong>Campo Sistémico</strong><small>Espacio de trabajo</small></span>
      </a>
      <div class="session-controls">
        <label class="sr-only" for="session-picker">Sesión activa</label>
        <select id="session-picker" :value="session.id" aria-label="Seleccionar sesión" @change="switchSession">
          <option v-for="item in sessions" :key="item.id" :value="item.id">{{ item.name || 'Sesión sin título' }}</option>
        </select>
        <button class="icon-button" title="Crear nueva sesión" aria-label="Crear nueva sesión" @click="createNewSession">＋</button>
        <button class="icon-button optional-action" title="Duplicar sesión actual" aria-label="Duplicar sesión actual" @click="duplicateSession">▢</button>
      </div>
      <div class="top-actions">
        <span class="save-indicator" :class="`save-${saveStatus}`" role="status">
          <i></i>{{ saveStatus === 'saved' ? 'Guardado' : saveStatus === 'saving' ? 'Guardando…' : 'Error al guardar' }}
        </span>
        <button class="icon-button text-size-toggle" :aria-pressed="largeText" :title="largeText ? 'Reducir tamaño del texto' : 'Aumentar tamaño del texto'" :aria-label="largeText ? 'Reducir tamaño del texto' : 'Aumentar tamaño del texto'" @click="largeText = !largeText">A+</button>
        <button v-if="installEvent" class="button button-subtle install-button" @click="installApp">Instalar app</button>
        <button class="icon-button mobile-toggle" aria-label="Abrir catálogo" @click="showCatalog = !showCatalog">☰</button>
      </div>
    </header>

    <div class="workspace">
      <aside class="catalog-panel" :class="{ 'mobile-open': showCatalog }">
        <div class="panel-heading">
          <div><span class="eyebrow">BIBLIOTECA</span><h2>Elementos</h2></div>
          <span class="count-pill">{{ filteredArchetypes.length }}</span>
          <button class="icon-button mobile-close" aria-label="Cerrar catálogo" @click="showCatalog = false">×</button>
        </div>
        <label class="search-field">
          <span aria-hidden="true">⌕</span>
          <input ref="searchInput" v-model="search" type="search" placeholder="Buscar figura o concepto…" aria-label="Buscar elementos" />
          <kbd>⌘ K</kbd>
        </label>
        <div class="category-list" role="group" aria-label="Filtrar por categoría">
          <button :class="{ active: category === 'all' }" @click="category = 'all'">Todo <span>{{ archetypes.length }}</span></button>
          <button v-for="item in categoryOrder" :key="item" :class="{ active: category === item }" @click="category = item">
            {{ categoryLabels[item] }}
          </button>
        </div>
        <div class="catalog-grid">
          <button
            v-for="item in filteredArchetypes"
            :key="item.id"
            class="archetype-card"
            :style="{ '--accent': item.color }"
            :aria-label="`Añadir ${item.name} al tablero`"
            @click="addNode(item); showCatalog = false"
          >
            <span class="archetype-icon">{{ item.icon }}</span>
            <span class="archetype-name">{{ item.name }}</span>
            <span class="archetype-detail">{{ item.detail }}</span>
          </button>
          <div v-if="filteredArchetypes.length === 0" class="empty-search">No encontramos elementos con esa búsqueda.</div>
        </div>
        <div class="privacy-note"><span>◈</span><p>Privado en este dispositivo.<br />No enviamos datos a ningún servidor.</p></div>
      </aside>

      <main class="work-area">
        <div class="canvas-toolbar">
          <div class="canvas-context">
            <span class="eyebrow">SESIÓN</span>
            <input v-model="session.name" class="session-title" aria-label="Nombre de la sesión" />
            <span class="session-client">{{ session.client || 'Sin cliente asignado' }}</span>
          </div>
          <div class="toolbar-actions">
            <button class="tool-button" :disabled="historyIndex <= 0" title="Deshacer (Ctrl+Z)" aria-label="Deshacer" @click="undo">↶</button>
            <button class="tool-button" :disabled="historyIndex >= history.length - 1" title="Rehacer (Ctrl+Y)" aria-label="Rehacer" @click="redo">↷</button>
            <span class="toolbar-divider"></span>
            <button class="tool-button" :class="{ 'tool-active': connectMode }" :aria-pressed="connectMode" title="Conectar dos elementos" @click="toggleConnect">⌁ <span class="tool-label">Vínculo</span></button>
            <button class="tool-button" :class="{ 'tool-active': snapToGrid }" :aria-pressed="snapToGrid" title="Ajustar posiciones a cuadrícula" @click="snapToGrid = !snapToGrid">▦</button>
            <button class="tool-button" title="Distribuir alrededor del centro" :disabled="!totalCount" @click="centerNodes">⊙</button>
            <button class="tool-button" title="Exportar mapa a PNG" @click="exportPng">↓ <span class="tool-label">PNG</span></button>
            <button class="button button-primary report-button" @click="printReport">Informe PDF</button>
            <button class="icon-button mobile-toggle" aria-label="Abrir detalles de sesión" @click="showDetails = !showDetails">☷</button>
          </div>
        </div>

        <div class="canvas-stage" :class="{ 'connection-mode': connectMode }">
          <div class="canvas-meta"><span><b>{{ totalCount }}</b> elementos</span><span class="meta-dot"></span><span><b>{{ session.lines.length }}</b> vínculos</span></div>
          <div v-if="connectMode" class="mode-banner">⌁ {{ firstConnectionNode ? 'Selecciona el segundo elemento' : 'Selecciona el primer elemento' }} <button @click="toggleConnect">Cancelar</button></div>
          <FieldBoard
            :nodes="session.nodes"
            :lines="session.lines"
            :selected-node-id="selectedNodeId"
            :selected-line-id="selectedLineId"
            :connect-mode="connectMode"
            :snap-to-grid="snapToGrid"
            @activate="activateNode"
            @select-line="selectedLineId = $event; selectedNodeId = null; showDetails = true"
            @move="moveNode"
            @drag-end="commitHistory"
          />
          <div class="canvas-legend"><span><i class="legend-core"></i>Núcleo</span><span><i class="legend-mid"></i>Medio</span><span><i class="legend-outer"></i>Exterior</span></div>
        </div>
        <footer class="workspace-footer"><span>Uso de apoyo visual · No sustituye evaluación profesional</span><span><kbd>Ctrl</kbd> + <kbd>Z</kbd> Deshacer</span></footer>
      </main>

      <aside class="details-panel" :class="{ 'mobile-open': showDetails }">
        <div class="panel-heading">
          <div><span class="eyebrow">PROPIEDADES</span><h2>{{ selectedLine ? 'Vínculo' : selectedNode ? 'Elemento' : 'Sesión' }}</h2></div>
          <button class="icon-button mobile-close" aria-label="Cerrar detalles" @click="showDetails = false">×</button>
        </div>
        <template v-if="selectedNode">
          <div class="selected-preview" :style="{ '--accent': selectedNode.color }"><span>{{ selectedNode.icon }}</span><div><strong>{{ selectedNode.name }}</strong><small>{{ getZone(selectedNode.x, selectedNode.y) }} · {{ getClockHour(selectedNode.x, selectedNode.y) ? `Hora ${getClockHour(selectedNode.x, selectedNode.y)}` : 'Centro' }}</small></div></div>
          <label class="field-label">Nombre o rol<input v-model="selectedNode.name" maxlength="80" @change="commitHistory" /></label>
          <div class="field-label direction-control">
            <span>Dirección de la mirada <output>{{ getOrientationLabel(selectedNode.rotation) }}</output></span>
            <div class="direction-options" role="group" aria-label="Dirección de la mirada">
              <button
                v-for="direction in directions"
                :key="direction.rotation"
                type="button"
                :class="{ active: selectedNode.rotation === direction.rotation }"
                :aria-pressed="selectedNode.rotation === direction.rotation"
                :aria-label="direction.label"
                :title="direction.label"
                @click="selectedNode.rotation = direction.rotation; commitHistory"
              >{{ direction.icon }}</button>
            </div>
          </div>
          <label class="field-label">Tamaño <output>{{ selectedNode.scale.toFixed(1) }}×</output><input v-model.number="selectedNode.scale" type="range" min="0.6" max="1.8" step="0.1" @change="commitHistory" /></label>
          <div class="coordinates">Posición <span>{{ selectedNode.x }}, {{ selectedNode.y }}</span></div>
          <button class="button button-danger full-width" @click="deleteSelected">Eliminar elemento</button>
        </template>
        <template v-else-if="selectedLine">
          <div class="selected-preview line-preview"><span>⌁</span><div><strong>{{ selectedLine.label }}</strong><small>Conexión entre dos elementos</small></div></div>
          <label class="field-label">Tipo de vínculo<input v-model="selectedLine.label" maxlength="60" placeholder="Ej. apoyo, tensión…" @change="commitHistory" /></label>
          <label class="field-label">Estilo
            <select v-model="selectedLine.kind" @change="commitHistory">
              <option value="solid">Continuo</option><option value="dashed">Discontinuo</option><option value="dotted">Punteado</option>
            </select>
          </label>
          <label class="field-label">Color<input v-model="selectedLine.color" type="color" @change="commitHistory" /></label>
          <button class="button button-danger full-width" @click="deleteSelected">Eliminar vínculo</button>
        </template>
        <template v-else>
          <div class="session-form">
            <label class="field-label">Facilitador/a<input v-model="session.facilitator" maxlength="120" placeholder="Nombre profesional" /></label>
            <label class="field-label">Cliente o motivo<input v-model="session.client" maxlength="120" placeholder="Nombre o tema de sesión" /></label>
            <label class="field-label">Notas de observación<textarea v-model="session.notes" rows="8" maxlength="6000" placeholder="Registra observaciones de la sesión…"></textarea><small class="character-count">{{ session.notes.length }} / 6000</small></label>
          </div>
          <div class="details-section">
            <div class="section-title"><span>Relaciones</span><small>{{ session.lines.length }}</small></div>
            <button v-for="line in session.lines" :key="line.id" class="relation-row" :class="{ chosen: selectedLineId === line.id }" @click="selectedLineId = line.id">
              <i :style="{ backgroundColor: line.color }"></i><span>{{ line.label }}</span><small>{{ session.nodes.find(node => node.id === line.from)?.name }} ↔ {{ session.nodes.find(node => node.id === line.to)?.name }}</small>
            </button>
            <p v-if="!session.lines.length" class="muted-copy">Los vínculos que dibujes aparecerán aquí.</p>
          </div>
          <div class="details-section">
            <div class="section-title"><span>Respaldo</span></div>
            <button class="secondary-row" @click="exportJson">Exportar sesión JSON <span>↗</span></button>
            <button class="secondary-row" @click="importInput?.click()">Importar sesión JSON <span>↗</span></button>
            <input ref="importInput" class="sr-only" type="file" accept=".json,application/json" @change="importJson" />
            <button class="secondary-row danger-row" @click="deleteSession">Eliminar esta sesión <span>×</span></button>
          </div>
          <p class="disclaimer">Las notas son registros de trabajo; esta herramienta no realiza diagnósticos ni interpreta resultados.</p>
        </template>
      </aside>
    </div>

    <div v-if="toastMessage" class="toast" role="status">{{ toastMessage }}</div>
    <section v-if="reportVisible" class="print-report" aria-label="Informe de sesión">
      <header class="report-header"><div><div class="report-brand"><span class="brand-mark">✧</span> Campo Sistémico</div><h1>Informe de sesión</h1></div><div class="report-metadata"><strong>{{ session.name }}</strong><span>Fecha: {{ new Date().toLocaleDateString('es') }}</span><span>Facilitador/a: {{ session.facilitator || 'No especificado' }}</span><span>Cliente: {{ session.client || 'No especificado' }}</span></div></header>
      <div class="report-stats"><div><strong>{{ session.nodes.length }}</strong><span>Elementos</span></div><div><strong>{{ session.lines.length }}</strong><span>Vínculos</span></div><div><strong>{{ session.notes ? 'Sí' : 'No' }}</strong><span>Notas</span></div></div>
      <section class="report-section"><h2>Mapa del campo</h2><img :src="reportImage" alt="Vista del reloj sistémico con elementos y vínculos" /></section>
      <section class="report-section"><h2>Elementos en el campo</h2><table><thead><tr><th>Elemento</th><th>Zona</th><th>Hora</th><th>Dirección</th><th>Escala</th></tr></thead><tbody><tr v-for="node in session.nodes" :key="node.id"><td>{{ node.icon }} {{ node.name }}</td><td>{{ getZone(node.x, node.y) }}</td><td>{{ getClockHour(node.x, node.y) ? `Hora ${getClockHour(node.x, node.y)}` : 'Centro' }}</td><td>{{ getOrientationLabel(node.rotation) }}</td><td>{{ node.scale.toFixed(1) }}×</td></tr></tbody></table><p v-if="!session.nodes.length" class="report-empty">No se agregaron elementos a esta sesión.</p></section>
      <section class="report-section"><h2>Vínculos</h2><ul><li v-for="line in session.lines" :key="line.id">{{ line.label }}: {{ session.nodes.find(node => node.id === line.from)?.name }} ↔ {{ session.nodes.find(node => node.id === line.to)?.name }}</li></ul><p v-if="!session.lines.length" class="report-empty">No se registraron vínculos.</p></section>
      <section class="report-section"><h2>Notas y observaciones</h2><p class="report-notes">{{ session.notes || 'Sin notas registradas.' }}</p></section>
      <footer class="report-footer">Informe generado localmente. Documento de apoyo visual; no constituye un diagnóstico.</footer>
    </section>
  </div>
</template>
