<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FieldLine, FieldNode } from '../types';

const props = defineProps<{
  nodes: FieldNode[];
  lines: FieldLine[];
  selectedNodeId: string | null;
  selectedLineId: string | null;
  connectMode: boolean;
  snapToGrid: boolean;
}>();

const emit = defineEmits<{
  activate: [id: string];
  selectLine: [id: string];
  move: [id: string, x: number, y: number];
  dragEnd: [];
}>();

const svgElement = ref<SVGSVGElement | null>(null);
const draggingId = ref<string | null>(null);
const dragOffset = ref({ x: 0, y: 0 });
const dragStart = ref({ x: 0, y: 0 });
const hasDragged = ref(false);
const ticks = computed(() => Array.from({ length: 60 }, (_, index) => {
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
}));
const hours = computed(() => Array.from({ length: 12 }, (_, index) => {
  const hour = index === 0 ? 12 : index;
  const angle = (hour / 12) * Math.PI * 2 - Math.PI / 2;
  return { hour, x: 500 + Math.cos(angle) * 420, y: 500 + Math.sin(angle) * 420 };
}));

function getPoint(event: PointerEvent) {
  const rect = svgElement.value!.getBoundingClientRect();
  let x = Math.round(((event.clientX - rect.left) / rect.width) * 1000);
  let y = Math.round(((event.clientY - rect.top) / rect.height) * 1000);
  if (props.snapToGrid) {
    x = Math.round(x / 20) * 20;
    y = Math.round(y / 20) * 20;
  }
  const dx = x - 500;
  const dy = y - 500;
  const distance = Math.hypot(dx, dy);
  if (distance > 466) {
    x = Math.round(500 + (dx / distance) * 466);
    y = Math.round(500 + (dy / distance) * 466);
  }
  return { x, y };
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
  svgElement.value?.setPointerCapture(event.pointerId);
}

function moveNode(event: PointerEvent) {
  if (!draggingId.value) return;
  if (!hasDragged.value && Math.hypot(event.clientX - dragStart.value.x, event.clientY - dragStart.value.y) < 12) return;
  hasDragged.value = true;
  const point = getPoint(event);
  emit('move', draggingId.value, point.x - dragOffset.value.x, point.y - dragOffset.value.y);
}

function finishDrag() {
  if (draggingId.value && hasDragged.value) emit('dragEnd');
  draggingId.value = null;
  hasDragged.value = false;
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
          <stop offset="0%" stop-color="#253457" />
          <stop offset="68%" stop-color="#121d32" />
          <stop offset="100%" stop-color="#0b1220" />
        </radialGradient>
        <filter id="node-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="500" cy="500" r="486" fill="#0b1220" stroke="#64748b" stroke-opacity=".45" stroke-width="2" />
      <circle cx="500" cy="500" r="475" fill="url(#board-glow)" stroke="#a5b4fc" stroke-opacity=".32" stroke-width="2" />
      <circle cx="500" cy="500" r="444" fill="none" stroke="#94a3b8" stroke-opacity=".13" />
      <g aria-hidden="true">
        <line
          v-for="(tick, index) in ticks"
          :key="index"
          :x1="tick.x1" :y1="tick.y1" :x2="tick.x2" :y2="tick.y2"
          :stroke="tick.major ? '#c7d2fe' : '#94a3b8'"
          :stroke-opacity="tick.major ? '.8' : '.35'"
          :stroke-width="tick.major ? 2 : 1"
        />
      </g>
      <circle cx="500" cy="500" r="340" fill="none" stroke="#818cf8" stroke-opacity=".28" stroke-width="2" stroke-dasharray="5 9" />
      <circle cx="500" cy="500" r="184" fill="none" stroke="#7dd3fc" stroke-opacity=".28" stroke-width="2" />
      <g v-for="position in hours" :key="position.hour" class="clock-hour-label">
        <circle :cx="position.x" :cy="position.y" r="20" />
        <text :x="position.x" :y="position.y + 5">{{ position.hour }}</text>
      </g>
      <g v-for="line in lines" :key="line.id">
        <line
          v-if="nodes.find(node => node.id === line.from) && nodes.find(node => node.id === line.to)"
          :x1="nodes.find(node => node.id === line.from)!.x"
          :y1="nodes.find(node => node.id === line.from)!.y"
          :x2="nodes.find(node => node.id === line.to)!.x"
          :y2="nodes.find(node => node.id === line.to)!.y"
          :stroke="line.color"
          :stroke-width="selectedLineId === line.id ? 6 : 3"
          :stroke-dasharray="line.kind === 'dashed' ? '12 9' : line.kind === 'dotted' ? '2 9' : undefined"
          :class="{ 'relation-line': true, 'relation-selected': selectedLineId === line.id }"
          :data-line-id="line.id"
          tabindex="0"
          role="button"
          :aria-label="`${line.label}: ${nodes.find(node => node.id === line.from)?.name} con ${nodes.find(node => node.id === line.to)?.name}`"
          @pointerdown.stop
          @click.stop="emit('selectLine', line.id)"
          @keydown.enter.stop="emit('selectLine', line.id)"
        />
      </g>
      <g
        v-for="node in nodes"
        :key="node.id"
        class="field-node"
        :class="{ 'node-selected': selectedNodeId === node.id, 'node-dragging': draggingId === node.id }"
        :transform="`translate(${node.x} ${node.y})`"
        :data-node-id="node.id"
        tabindex="0"
        role="button"
        :aria-label="`${node.name}, seleccionado en el tablero`"
        @pointerdown="startNode($event, node)"
        @keydown.enter.prevent="emit('activate', node.id)"
        @keydown.space.prevent="emit('activate', node.id)"
      >
        <path
          :d="`M 0 ${-52 - 13 * node.scale} L -8 ${-40 - 13 * node.scale} L 8 ${-40 - 13 * node.scale} Z`"
          fill="#a5b4fc"
          :transform="`rotate(${node.rotation})`"
        />
        <circle
          :r="36 * node.scale"
          :fill="node.color"
          :stroke="selectedNodeId === node.id ? '#fbbf24' : '#f8fafc'"
          :stroke-width="selectedNodeId === node.id ? 5 : 3"
          filter="url(#node-glow)"
        />
        <text class="node-emoji" y="11" :font-size="36 * node.scale">{{ node.icon }}</text>
        <g class="node-label">
          <rect x="-76" y="45" width="152" height="32" rx="10" />
          <text y="66">{{ node.name.length > 18 ? `${node.name.slice(0, 17)}…` : node.name }}</text>
        </g>
      </g>
      <circle class="board-center" cx="500" cy="500" r="9" />
    </svg>
    <div v-if="nodes.length === 0" class="board-empty">
      <span class="empty-star">✧</span>
      <strong>Tu espacio de trabajo</strong>
      <span>Elige una figura del catálogo para comenzar</span>
    </div>
  </div>
</template>
