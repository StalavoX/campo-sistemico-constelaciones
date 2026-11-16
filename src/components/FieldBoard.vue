<script setup lang="ts">
import { ref } from 'vue';
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

const svgElement = ref<SVGSVGElement | null>(null);
const draggingId = ref<string | null>(null);
const dragOffset = ref({ x: 0, y: 0 });
const dragStart = ref({ x: 0, y: 0 });
const hasDragged = ref(false);

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

function getPoint(event: PointerEvent) {
  const rect = svgElement.value!.getBoundingClientRect();
  let x = Math.round(((event.clientX - rect.left) / rect.width) * 1000);
  let y = Math.round(((event.clientY - rect.top) / rect.height) * 1000);
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

function getLineEndpoints(line: FieldLine) {
  const fromNode = props.nodes.find((node) => node.id === line.from);
  const toNode = props.nodes.find((node) => node.id === line.to);
  if (!fromNode || !toNode) return null;

  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const distance = Math.hypot(dx, dy) || 1;
  const ux = dx / distance;
  const uy = dy / distance;

  const rFrom = (fromNode.figure ? 44 : 38) * fromNode.scale;
  const rTo = (toNode.figure ? 44 : 38) * toNode.scale;

  const hasForwardArrow = line.arrow === 'forward' || line.arrow === 'both';
  const hasBackwardArrow = line.arrow === 'both';

  const x1 = Math.round(fromNode.x + ux * (hasBackwardArrow ? rFrom + 12 : 0));
  const y1 = Math.round(fromNode.y + uy * (hasBackwardArrow ? rFrom + 12 : 0));
  const x2 = Math.round(toNode.x - ux * (hasForwardArrow ? rTo + 12 : 0));
  const y2 = Math.round(toNode.y - uy * (hasForwardArrow ? rTo + 12 : 0));

  return { fromNode, toNode, x1, y1, x2, y2, hasForwardArrow, hasBackwardArrow };
}

function backgroundClick(event: PointerEvent) {
  if ((event.target as Element).closest('[data-node-id], [data-line-id]')) return;
  if (!props.connectMode) emit('activate', '');
}
</script>

<template>
  <div class="board-wrap" :class="{ 'is-connecting': connectMode }">
    <svg
      ref="svgElement"
      class="field-board"
      viewBox="0 0 1000 1000"
      role="application"
      aria-label="Reloj sistémico interactivo. Arrastra los elementos para cambiar su posición."
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
      </defs>

      <!-- Fondo y anillos del reloj sistémico -->
      <circle cx="500" cy="500" r="486" :fill="theme === 'light' ? '#cbd5e1' : '#0b1220'" :stroke="theme === 'light' ? '#94a3b8' : '#64748b'" stroke-opacity=".45" stroke-width="2" />
      <circle cx="500" cy="500" r="475" fill="url(#board-glow)" :stroke="theme === 'light' ? '#6366f1' : '#a5b4fc'" :stroke-opacity="theme === 'light' ? '.45' : '.32'" stroke-width="2" />
      <circle cx="500" cy="500" r="444" fill="none" stroke="#94a3b8" :stroke-opacity="theme === 'light' ? '.35' : '.13'" />

      <!-- Marcas de minutos -->
      <g aria-hidden="true">
        <line
          v-for="(tick, index) in TICKS"
          :key="index"
          :x1="tick.x1" :y1="tick.y1" :x2="tick.x2" :y2="tick.y2"
          :stroke="tick.major ? (theme === 'light' ? '#4f46e5' : '#c7d2fe') : '#94a3b8'"
          :stroke-opacity="tick.major ? '.85' : '.35'"
          :stroke-width="tick.major ? 2 : 1"
        />
      </g>

      <!-- Zonas concéntricas: Exterior, Medio y Núcleo -->
      <circle cx="500" cy="500" r="340" fill="none" :stroke="theme === 'light' ? '#4f46e5' : '#818cf8'" :stroke-opacity="theme === 'light' ? '.45' : '.28'" stroke-width="2" stroke-dasharray="5 9" />
      <circle cx="500" cy="500" r="184" fill="none" :stroke="theme === 'light' ? '#0284c7' : '#7dd3fc'" :stroke-opacity="theme === 'light' ? '.55' : '.28'" stroke-width="2" />

      <!-- Posiciones horarias (1 a 12) -->
      <g v-for="position in HOURS" :key="position.hour" class="clock-hour-label" aria-hidden="true">
        <circle :cx="position.x" :cy="position.y" r="20" />
        <text :x="position.x" :y="position.y + 5">{{ position.hour }}</text>
      </g>

      <!-- Vínculos y relaciones entre elementos -->
      <g v-for="line in lines" :key="line.id">
        <template v-if="getLineEndpoints(line)">
          <!-- Área de impacto invisible para facilitar el clic o toque táctil -->
          <line
            :x1="getLineEndpoints(line)!.fromNode.x"
            :y1="getLineEndpoints(line)!.fromNode.y"
            :x2="getLineEndpoints(line)!.toNode.x"
            :y2="getLineEndpoints(line)!.toNode.y"
            stroke="transparent"
            stroke-width="26"
            class="relation-hitbox"
            @pointerdown.stop
            @click.stop="emit('selectLine', line.id)"
          />
          <!-- Línea visible con estilo, color y flechas -->
          <line
            :x1="getLineEndpoints(line)!.x1"
            :y1="getLineEndpoints(line)!.y1"
            :x2="getLineEndpoints(line)!.x2"
            :y2="getLineEndpoints(line)!.y2"
            :stroke="line.color"
            :stroke-width="selectedLineId === line.id ? 6 : 3"
            :stroke-dasharray="line.kind === 'dashed' ? '12 9' : line.kind === 'dotted' ? '2 9' : undefined"
            :marker-end="getLineEndpoints(line)!.hasForwardArrow ? 'url(#relation-arrow-end)' : undefined"
            :marker-start="getLineEndpoints(line)!.hasBackwardArrow ? 'url(#relation-arrow-start)' : undefined"
            :class="{ 'relation-line': true, 'relation-selected': selectedLineId === line.id }"
            :data-line-id="line.id"
            tabindex="0"
            role="button"
            :aria-label="`${line.label}: ${getLineEndpoints(line)!.fromNode.name} con ${getLineEndpoints(line)!.toNode.name}`"
            @pointerdown.stop
            @click.stop="emit('selectLine', line.id)"
            @keydown.enter.stop="emit('selectLine', line.id)"
          />
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
        :aria-label="`${node.name}, posicionado en el tablero`"
        @pointerdown="startNode($event, node)"
        @keydown.enter.prevent="emit('activate', node.id)"
        @keydown.space.prevent="emit('activate', node.id)"
      >
        <!-- Flecha indicadora de orientación de la mirada -->
        <path
          :d="`M 0 ${-52 - 13 * node.scale} L -8 ${-40 - 13 * node.scale} L 8 ${-40 - 13 * node.scale} Z`"
          fill="#a5b4fc"
          :transform="`rotate(${node.rotation})`"
        />

        <!-- Resplandor / Halo de origen en modo conexión -->
        <circle
          v-if="connectMode && firstConnectionNodeId === node.id"
          :r="(node.figure ? 52 : 46) * node.scale"
          fill="none"
          stroke="#38bdf8"
          stroke-width="4"
          stroke-dasharray="6 4"
          class="connect-pulse"
        />

        <!-- Base circular del elemento -->
        <circle
          v-if="!node.figure"
          :r="(node.figure ? 42 : 36) * node.scale"
          :fill="node.color"
          :stroke="selectedNodeId === node.id ? '#fbbf24' : '#f8fafc'"
          :stroke-width="(selectedNodeId === node.id ? 5 : 3) * node.scale"
          filter="url(#node-glow)"
        />

        <!-- Ilustración / Icono (Sapiens o Twemoji) -->
        <g :transform="figureTransform(node)">
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

        <!-- Etiqueta con el nombre o rol -->
        <g class="node-label">
          <rect x="-96" :y="node.figure ? 52 : 45" width="192" height="38" rx="10" />
          <text :y="node.figure ? 77 : 70">{{ node.name.length > 21 ? `${node.name.slice(0, 20)}…` : node.name }}</text>
        </g>
      </g>

      <!-- Punto central del sistema -->
      <circle class="board-center" cx="500" cy="500" r="9" />
    </svg>

    <!-- Estado vacío inicial -->
    <div v-if="nodes.length === 0" class="board-empty" aria-hidden="true">
      <span class="empty-star">✧</span>
      <strong>Tu espacio de trabajo</strong>
      <span>Elige una figura del catálogo para comenzar</span>
    </div>
  </div>
</template>
