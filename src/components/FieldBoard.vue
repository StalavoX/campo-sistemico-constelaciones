<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FieldLine, FieldNode } from '../types';
import { getTwemojiAssetPath } from '../utils';

const props = withDefaults(defineProps<{
  nodes: FieldNode[];
  lines: FieldLine[];
  selectedNodeId: string | null;
  selectedLineId: string | null;
  connectMode: boolean;
  firstConnectionNodeId?: string | null;
  snapToGrid: boolean;
  theme?: 'dark' | 'light';
}>(), {
  theme: 'dark',
});

const emit = defineEmits<{
  activate: [id: string];
  selectLine: [id: string];
  deleteLine: [id: string];
  move: [id: string, x: number, y: number];
  dragEnd: [];
}>();

const TICKS = Array.from({ length: 60 }, (_, index) => {
  const angle = (index / 60) * Math.PI * 2 - Math.PI / 2;
  const major = index % 5 === 0;
  const start = major ? 458 : 468;
  return {
    x1: 500 + Math.cos(angle) * start,
    y1: 500 + Math.sin(angle) * start,
    x2: 500 + Math.cos(angle) * 476,
    y2: 500 + Math.sin(angle) * 476,
    major,
  };
});

const HOURS = Array.from({ length: 12 }, (_, index) => {
  const hour = index === 0 ? 12 : index;
  const angle = (hour / 12) * Math.PI * 2 - Math.PI / 2;
  return { hour, x: 500 + Math.cos(angle) * 420, y: 500 + Math.sin(angle) * 420 };
});

const SPRITE_GAZE_VECTORS = [
  { x: -0.707, y: -0.707 },
  { x: 0, y: -1 },
  { x: 0.707, y: -0.707 },
  { x: -1, y: 0 },
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: -0.707, y: 0.707 },
  { x: 0, y: 1 },
  { x: 0.707, y: 0.707 },
];

const svgElement = ref<SVGSVGElement | null>(null);
const draggingId = ref<string | null>(null);
const dragOffset = ref({ x: 0, y: 0 });
const dragStart = ref({ x: 0, y: 0 });
const hasDragged = ref(false);

// Zoom interactivo centrado en el medio (el reloj se mantiene fijo en el centro)
const zoom = ref(1);
const viewBoxSize = computed(() => 1000 / zoom.value);
const viewBoxOffset = computed(() => (1000 - viewBoxSize.value) / 2);
const currentViewBox = computed(() => `${viewBoxOffset.value} ${viewBoxOffset.value} ${viewBoxSize.value} ${viewBoxSize.value}`);

function setZoom(val: number) {
  zoom.value = Math.min(3.0, Math.max(0.6, Math.round(val * 100) / 100));
}

function zoomIn() {
  setZoom(zoom.value * 1.2);
}

function zoomOut() {
  setZoom(zoom.value / 1.2);
}

function resetZoom() {
  zoom.value = 1;
}

function onWheel(event: WheelEvent) {
  event.preventDefault();
  const factor = event.deltaY < 0 ? 1.12 : 0.89;
  setZoom(zoom.value * factor);
}

function clampToBoard(rawX: number, rawY: number): { x: number; y: number } {
  let x = Math.min(960, Math.max(40, rawX));
  let y = Math.min(960, Math.max(40, rawY));
  const dx = x - 500;
  const dy = y - 500;
  const distance = Math.hypot(dx, dy);
  if (distance > 466) {
    x = Math.round(500 + (dx / distance) * 466);
    y = Math.round(500 + (dy / distance) * 466);
  }
  return { x, y };
}

function getSvgPoint(clientX: number, clientY: number): { x: number; y: number } {
  if (!svgElement.value) return { x: 500, y: 500 };
  const ctm = svgElement.value.getScreenCTM();
  if (!ctm) return { x: 500, y: 500 };
  const pt = svgElement.value.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const transformed = pt.matrixTransform(ctm.inverse());
  return { x: transformed.x, y: transformed.y };
}

function getPoint(event: PointerEvent) {
  const pt = getSvgPoint(event.clientX, event.clientY);
  let x = Math.round(pt.x);
  let y = Math.round(pt.y);
  if (props.snapToGrid) {
    x = Math.round(x / 20) * 20;
    y = Math.round(y / 20) * 20;
  }
  return clampToBoard(x, y);
}

function startNode(event: PointerEvent, node: FieldNode) {
  event.preventDefault();
  event.stopPropagation();
  if (props.connectMode) {
    emit('activate', node.id);
    return;
  }
  emit('activate', node.id);
  const point = getPoint(event);
  dragOffset.value = { x: point.x - node.x, y: point.y - node.y };
  dragStart.value = { x: event.clientX, y: event.clientY };
  hasDragged.value = false;
  draggingId.value = node.id;
  try {
    svgElement.value?.setPointerCapture(event.pointerId);
  } catch {
    // Algunos navegadores pueden ignorar capturas si el puntero se liberó
  }
}

function moveNode(event: PointerEvent) {
  if (!draggingId.value) return;
  if (!hasDragged.value && Math.hypot(event.clientX - dragStart.value.x, event.clientY - dragStart.value.y) < 12) return;
  hasDragged.value = true;
  const point = getPoint(event);
  const rawTargetX = point.x - dragOffset.value.x;
  const rawTargetY = point.y - dragOffset.value.y;
  const clamped = clampToBoard(rawTargetX, rawTargetY);
  emit('move', draggingId.value, clamped.x, clamped.y);
}

function backgroundClick(event: PointerEvent) {
  if ((event.target as Element).closest('[data-node-id], [data-line-id]')) return;
  if (!props.connectMode) emit('activate', '');
}

function finishDrag(event?: PointerEvent) {
  if (event && svgElement.value?.hasPointerCapture(event.pointerId)) {
    try {
      svgElement.value.releasePointerCapture(event.pointerId);
    } catch {
      // noop
    }
  }
  if (draggingId.value && hasDragged.value) emit('dragEnd');
  draggingId.value = null;
  hasDragged.value = false;
}

function figureTransform(node: FieldNode): string | undefined {
  const mirroredAsset = node.icon.endsWith('|mirror');
  if (node.rotation === 270 || mirroredAsset) return 'scale(-1 1)';
  if (node.rotation === 0) return 'rotate(-32 0 0)';
  if (node.rotation === 180) return 'rotate(32 0 0)';
  return undefined;
}

function spriteGazeVector(direction: number) {
  return SPRITE_GAZE_VECTORS[direction]!;
}

function getLineEndpoints(line: FieldLine) {
  const fromNode = props.nodes.find((node) => node.id === line.from);
  const toNode = props.nodes.find((node) => node.id === line.to);
  if (!fromNode || !toNode) return null;

  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const distance = Math.hypot(dx, dy) || 1;
  const ux = dx / distance;
  const uy = dy / distance;

  const rFrom = (fromNode.figure || fromNode.sprite ? 44 : 38) * fromNode.scale;
  const rTo = (toNode.figure || toNode.sprite ? 44 : 38) * toNode.scale;

  const hasForwardArrow = line.arrow === 'forward' || line.arrow === 'both';
  const hasBackwardArrow = line.arrow === 'both';

  const x1 = Math.round(fromNode.x + ux * (hasBackwardArrow ? rFrom + 12 : 0));
  const y1 = Math.round(fromNode.y + uy * (hasBackwardArrow ? rFrom + 12 : 0));
  const x2 = Math.round(toNode.x - ux * (hasForwardArrow ? rTo + 12 : 0));
  const y2 = Math.round(toNode.y - uy * (hasForwardArrow ? rTo + 12 : 0));

  return { fromNode, toNode, x1, y1, x2, y2, hasForwardArrow, hasBackwardArrow };
}

function getLineMidpoint(line: FieldLine) {
  const fromNode = props.nodes.find((node) => node.id === line.from);
  const toNode = props.nodes.find((node) => node.id === line.to);
  if (!fromNode || !toNode) return null;
  return {
    x: Math.round((fromNode.x + toNode.x) / 2),
    y: Math.round((fromNode.y + toNode.y) / 2),
  };
}

function formatNodeLabel(name: string): { line1: string; line2?: string } {
  const parenMatch = name.match(/^(.*?)\s*\((.*?)\)$/);
  if (parenMatch) {
    const main = parenMatch[1]!.trim();
    const sub = parenMatch[2]!.trim();
    const shortSub = sub.length > 20 ? `${sub.slice(0, 19)}…` : sub;
    return { line1: main, line2: shortSub };
  }
  if (name.length > 18 && name.includes(' ')) {
    const words = name.split(' ');
    let line1 = '';
    let line2 = '';
    for (const word of words) {
      if ((line1 + ' ' + word).trim().length <= 16 && !line2) {
        line1 = (line1 + ' ' + word).trim();
      } else {
        line2 = (line2 + ' ' + word).trim();
      }
    }
    if (line2) {
      const shortLine2 = line2.length > 19 ? `${line2.slice(0, 18)}…` : line2;
      return { line1, line2: shortLine2 };
    }
  }
  const clean = name.length > 21 ? `${name.slice(0, 20)}…` : name;
  return { line1: clean };
}
</script>

<template>
  <div class="board-wrap" :class="{ 'is-connecting': connectMode }">
    <svg
      ref="svgElement"
      class="field-board"
      :viewBox="currentViewBox"
      role="application"
      aria-label="Reloj sistémico interactivo. Arrastra los elementos para cambiar su posición."
      @wheel="onWheel"
      @pointermove="moveNode"
      @pointerup="finishDrag"
      @pointercancel="finishDrag"
      @pointerdown="backgroundClick"
    >
      <defs>
        <radialGradient id="board-glow" cx="50%" cy="45%" r="65%">
          <stop offset="0%" :stop-color="theme === 'light' ? '#ffffff' : '#253457'" />
          <stop offset="68%" :stop-color="theme === 'light' ? '#f8fafc' : '#121d32'" />
          <stop offset="100%" :stop-color="theme === 'light' ? '#e2e8f0' : '#0b1220'" />
        </radialGradient>
        <filter id="node-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        <!-- Marcadores para flechas direccionales en vínculos -->
        <marker
          id="relation-arrow-end"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-stroke" />
        </marker>
        <marker
          id="relation-arrow-start"
          viewBox="0 0 10 10"
          refX="2"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-stroke" />
        </marker>
        <marker id="sprite-gaze-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="#f59e0b" />
        </marker>
      </defs>

      <!-- Fondo y anillos del reloj sistémico fijo en el centro -->
      <circle cx="500" cy="500" r="486" :fill="theme === 'light' ? '#cbd5e1' : '#0b1220'" :stroke="theme === 'light' ? '#94a3b8' : '#64748b'" stroke-opacity=".45" stroke-width="2" />
      <circle cx="500" cy="500" r="475" fill="url(#board-glow)" :stroke="theme === 'light' ? '#6366f1' : '#a5b4fc'" :stroke-opacity="theme === 'light' ? '.45' : '.32'" stroke-width="2" />
      <circle cx="500" cy="500" r="444" fill="none" stroke="#94a3b8" :stroke-opacity="theme === 'light' ? '.35' : '.13'" />

      <!-- Marcas de minutos/grados del reloj -->
      <line
        v-for="(tick, index) in TICKS"
        :key="`tick-${index}`"
        :x1="tick.x1"
        :y1="tick.y1"
        :x2="tick.x2"
        :y2="tick.y2"
        :stroke="tick.major ? (theme === 'light' ? '#4f46e5' : '#c7d2fe') : (theme === 'light' ? '#94a3b8' : '#64748b')"
        :stroke-opacity="tick.major ? (theme === 'light' ? '.7' : '.55') : (theme === 'light' ? '.4' : '.25')"
        :stroke-width="tick.major ? 2.5 : 1.2"
      />

      <!-- Zonas sistémicas concéntricas (núcleo, medio, exterior) -->
      <circle cx="500" cy="500" r="340" fill="none" :stroke="theme === 'light' ? '#4f46e5' : '#818cf8'" :stroke-opacity="theme === 'light' ? '.45' : '.28'" stroke-width="2" stroke-dasharray="5 9" />
      <circle cx="500" cy="500" r="184" fill="none" :stroke="theme === 'light' ? '#0284c7' : '#7dd3fc'" :stroke-opacity="theme === 'light' ? '.55' : '.28'" stroke-width="2" />

      <!-- Etiquetas horarias del reloj (1 a 12) -->
      <g v-for="entry in HOURS" :key="`hour-${entry.hour}`" class="clock-hour-label" aria-hidden="true">
        <circle :cx="entry.x" :cy="entry.y" r="22" />
        <text :x="entry.x" :y="entry.y + 6">{{ entry.hour }}</text>
      </g>

      <!-- Textos de orientación espacial en el reloj: Arriba, Abajo, Izquierda, Derecha -->
      <g class="clock-cardinals" aria-hidden="true">
        <text x="500" y="138" class="clock-cardinal-label" text-anchor="middle">Arriba</text>
        <text x="500" y="876" class="clock-cardinal-label" text-anchor="middle">Abajo</text>
        <text x="145" y="505" class="clock-cardinal-label" text-anchor="middle">Izquierda</text>
        <text x="855" y="505" class="clock-cardinal-label" text-anchor="middle">Derecha</text>
      </g>

      <!-- Vínculos / Relaciones entre figuras -->
      <g v-for="line in lines" :key="line.id" class="field-relation" :class="{ 'relation-selected': selectedLineId === line.id }">
        <template v-if="getLineEndpoints(line)">
          <!-- Zona de interacción táctil más amplia para facilitar clic/selección -->
          <line
            :x1="getLineEndpoints(line)!.x1"
            :y1="getLineEndpoints(line)!.y1"
            :x2="getLineEndpoints(line)!.x2"
            :y2="getLineEndpoints(line)!.y2"
            class="relation-hitbox"
            stroke="transparent"
            stroke-width="26"
            stroke-linecap="round"
            @click.stop="emit('selectLine', line.id)"
          />
          <!-- Línea visible de la relación -->
          <line
            :x1="getLineEndpoints(line)!.x1"
            :y1="getLineEndpoints(line)!.y1"
            :x2="getLineEndpoints(line)!.x2"
            :y2="getLineEndpoints(line)!.y2"
            :stroke="line.color"
            :stroke-width="selectedLineId === line.id ? 4.5 : 3"
            :stroke-dasharray="line.kind === 'dashed' ? '8 6' : line.kind === 'dotted' ? '3 5' : undefined"
            :marker-end="getLineEndpoints(line)!.hasForwardArrow ? 'url(#relation-arrow-end)' : undefined"
            :marker-start="getLineEndpoints(line)!.hasBackwardArrow ? 'url(#relation-arrow-start)' : undefined"
            stroke-linecap="round"
            @click.stop="emit('selectLine', line.id)"
          />
          <!-- Etiqueta o nombre del vínculo con su frase -->
          <g
            v-if="getLineMidpoint(line) && (line.label || line.phrase)"
            class="relation-badge"
            :transform="`translate(${getLineMidpoint(line)!.x} ${getLineMidpoint(line)!.y})`"
            @click.stop="emit('selectLine', line.id)"
          >
            <rect
              :x="-Math.max(50, Math.min(100, Math.max(line.label.length, (line.phrase || '').length) * 4.6))"
              :y="line.phrase ? -20 : -13"
              :width="Math.max(100, Math.min(200, Math.max(line.label.length, (line.phrase || '').length) * 9.2))"
              :height="line.phrase ? 40 : 26"
              rx="8"
              :fill="theme === 'light' ? '#ffffff' : '#0f172a'"
              :stroke="line.color"
              :stroke-width="selectedLineId === line.id ? 2 : 1"
            />
            <text :y="line.phrase ? -4 : 4" :fill="theme === 'light' ? '#0f172a' : '#f8fafc'">{{ line.label }}</text>
            <text v-if="line.phrase" y="12" class="relation-phrase-text" :fill="theme === 'light' ? '#6366f1' : '#a5b4fc'">{{ line.phrase }}</text>
          </g>
          <!-- Botón de eliminación rápida cuando el vínculo está seleccionado -->
          <g
            v-if="selectedLineId === line.id && getLineMidpoint(line)"
            class="relation-delete-btn"
            :transform="`translate(${getLineMidpoint(line)!.x + 44} ${getLineMidpoint(line)!.y - 20})`"
            role="button"
            aria-label="Eliminar vínculo"
            @click.stop="emit('deleteLine', line.id)"
          >
            <circle cx="0" cy="0" r="16" fill="#ef4444" stroke="#ffffff" stroke-width="2.5" />
            <text x="0" y="5" fill="#ffffff" text-anchor="middle" font-size="14" font-weight="bold">×</text>
          </g>
        </template>
      </g>

      <!-- Figuras y elementos en el campo -->
      <g
        v-for="node in nodes"
        :key="node.id"
        class="field-node"
        :class="{
          'node-selected': selectedNodeId === node.id,
          'node-dragging': draggingId === node.id,
          'node-connect-source': connectMode && firstConnectionNodeId === node.id
        }"
        :transform="`translate(${node.x} ${node.y})`"
        :data-node-id="node.id"
        tabindex="0"
        role="button"
        :aria-label="`${node.name || 'Figura'}, posicionada en el tablero`"
        @pointerdown="startNode($event, node)"
        @keydown.enter.prevent="emit('activate', node.id)"
        @keydown.space.prevent="emit('activate', node.id)"
      >
        <!-- Flecha indicadora de orientación de la mirada -->
        <path
          v-if="!node.sprite"
          :d="`M 0 ${-52 - 13 * node.scale} L -8 ${-40 - 13 * node.scale} L 8 ${-40 - 13 * node.scale} Z`"
          fill="#a5b4fc"
          :transform="`rotate(${node.rotation})`"
        />
        <line
          v-if="node.sprite && node.sprite.direction !== 4"
          x1="0"
          y1="0"
          :x2="spriteGazeVector(node.sprite.direction).x * 68 * node.scale"
          :y2="spriteGazeVector(node.sprite.direction).y * 68 * node.scale"
          stroke="#f59e0b"
          stroke-width="3"
          stroke-dasharray="5 4"
          marker-end="url(#sprite-gaze-arrow)"
          pointer-events="none"
        />

        <!-- Resplandor / Halo de origen en modo conexión -->
        <circle
          v-if="connectMode && firstConnectionNodeId === node.id"
          :r="(node.figure || node.sprite ? 52 : 46) * node.scale"
          fill="none"
          stroke="#38bdf8"
          stroke-width="4"
          stroke-dasharray="6 4"
          class="connect-pulse"
        />

        <!-- Halo de selección dorado para figuras con sprite (con fill="none" para transparencia total) -->
        <circle
          v-if="node.sprite && selectedNodeId === node.id"
          :r="46 * node.scale"
          fill="none"
          stroke="#fbbf24"
          :stroke-width="3.5 * node.scale"
          stroke-dasharray="6 3"
          filter="url(#node-glow)"
          pointer-events="none"
        />

        <!-- Base circular del elemento tradicional (iconos estándar) -->
        <circle
          v-if="!node.figure && !node.sprite"
          :r="(node.figure || node.sprite ? 42 : 36) * node.scale"
          :fill="node.color"
          :stroke="selectedNodeId === node.id ? '#fbbf24' : '#f8fafc'"
          :stroke-width="(selectedNodeId === node.id ? 5 : 3) * node.scale"
          filter="url(#node-glow)"
        />

        <!-- Ilustración / Icono (Sapiens o Twemoji) -->
        <g v-if="!node.sprite" :transform="figureTransform(node)">
          <image
            :href="getTwemojiAssetPath(node.icon)"
            :class="{ 'sapiens-asset': node.icon.startsWith('sapiens:') }"
            :x="(node.figure ? -36 : -23) * node.scale"
            :y="(node.figure ? -36 : -23) * node.scale"
            :width="(node.figure ? 72 : 46) * node.scale"
            :height="(node.figure ? 72 : 46) * node.scale"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          />
        </g>
        <svg
          v-else-if="node.sprite.spriteSheet"
          :x="-36 * node.scale"
          :y="-36 * node.scale"
          :width="72 * node.scale"
          :height="72 * node.scale"
          :viewBox="`${node.sprite.direction % 3} ${Math.floor(node.sprite.direction / 3)} 1 1`"
          preserveAspectRatio="xMidYMid meet"
          overflow="hidden"
          aria-hidden="true"
        >
          <image :href="node.sprite.src" x="0" y="0" width="3" height="3" preserveAspectRatio="none" />
        </svg>
        <image
          v-else
          :href="node.sprite.src"
          :x="-36 * node.scale"
          :y="-36 * node.scale"
          :width="72 * node.scale"
          :height="72 * node.scale"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        />

        <!-- Etiqueta con el nombre o rol (solo se muestra si tiene un nombre asignado) -->
        <g v-if="node.name && node.name.trim()" class="node-label">
          <template v-if="formatNodeLabel(node.name).line2">
            <rect x="-96" :y="node.figure || node.sprite ? 50 : 43" width="192" height="46" rx="10" />
            <text :y="node.figure || node.sprite ? 68 : 61" font-weight="600">{{ formatNodeLabel(node.name).line1 }}</text>
            <text :y="node.figure || node.sprite ? 84 : 77" class="node-label-sub">{{ formatNodeLabel(node.name).line2 }}</text>
          </template>
          <template v-else>
            <rect x="-96" :y="node.figure || node.sprite ? 52 : 45" width="192" height="38" rx="10" />
            <text :y="node.figure || node.sprite ? 77 : 70">{{ formatNodeLabel(node.name).line1 }}</text>
          </template>
        </g>
      </g>

      <!-- Punto central del sistema -->
      <circle class="board-center" cx="500" cy="500" r="9" />
    </svg>

    <!-- Controles flotantes de Zoom centrados -->
    <div class="board-zoom-controls" role="group" aria-label="Controles de zoom">
      <button type="button" class="zoom-btn" title="Acercar (+)" aria-label="Acercar tablero" @click="zoomIn">+</button>
      <button
        type="button"
        class="zoom-btn zoom-level"
        :title="zoom !== 1 ? 'Restablecer zoom al 100%' : 'Zoom actual'"
        aria-label="Restablecer zoom al 100%"
        @click="resetZoom"
      >
        {{ Math.round(zoom * 100) }}%
      </button>
      <button type="button" class="zoom-btn" title="Alejar (-)" aria-label="Alejar tablero" @click="zoomOut">−</button>
      <button
        v-if="zoom !== 1"
        type="button"
        class="zoom-btn zoom-reset"
        title="Restablecer zoom al 100%"
        aria-label="Restablecer zoom al 100%"
        @click="resetZoom"
      >
        ⊙
      </button>
    </div>

    <!-- Estado vacío inicial -->
    <div v-if="nodes.length === 0" class="board-empty" aria-hidden="true">
      <span class="empty-star">✧</span>
      <strong>Tu espacio de trabajo</strong>
      <span>Elige una figura de la biblioteca para comenzar</span>
    </div>
  </div>
</template>

<style scoped>
.clock-cardinal-label {
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  fill: #818cf8;
  opacity: 0.65;
  pointer-events: none;
  user-select: none;
}

:global(.theme-light) .clock-cardinal-label {
  fill: #4f46e5;
  opacity: 0.75;
}

.board-zoom-controls {
  position: absolute;
  bottom: 14px;
  right: 14px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 6px;
  border: 1px solid var(--border, rgba(148, 163, 184, 0.2));
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24);
}

.zoom-btn {
  display: grid;
  place-items: center;
  min-width: 26px;
  height: 26px;
  padding: 0 4px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #cbd5e1;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}

.zoom-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.zoom-btn.zoom-level {
  font-size: 11px;
  min-width: 38px;
  color: #a5b4fc;
}

.zoom-btn.zoom-reset {
  font-size: 14px;
  color: #fbbf24;
}

:global(.theme-light) .board-zoom-controls {
  background: rgba(255, 255, 255, 0.88);
  border-color: rgba(148, 163, 184, 0.35);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
}

:global(.theme-light) .zoom-btn {
  color: #334155;
}

:global(.theme-light) .zoom-btn:hover {
  background: rgba(15, 23, 42, 0.06);
  color: #0f172a;
}

:global(.theme-light) .zoom-btn.zoom-level {
  color: #4f46e5;
}
</style>
