<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SpriteLibraryItem } from '../types';
import UiIcon from './UiIcon.vue';

const props = defineProps<{
  items: SpriteLibraryItem[];
  selectedSrc: string | null;
  theme?: 'dark' | 'light';
}>();

const emit = defineEmits<{
  (e: 'select', item: SpriteLibraryItem): void;
  (e: 'upload', item: SpriteLibraryItem): void;
  (e: 'remove', id: string): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const uploadAsSheet = ref(true);

const visibleItems = computed(() =>
  props.items.filter((item) => item.isLibraryPrimary !== false),
);

function isItemSelected(item: SpriteLibraryItem): boolean {
  if (!props.selectedSrc) return false;
  if (item.src === props.selectedSrc) return true;
  if (item.equivalentId && item.equivalentId.endsWith(props.selectedSrc.replace(/^.*\//, ''))) return true;
  return false;
}

function handleSelect(item: SpriteLibraryItem) {
  // Si el elemento es una figura emparejada con una hoja 3x3, pasar la hoja 3x3 para que el tablero tenga las 9 miradas
  const targetItem = item.equivalentId && !item.spriteSheet
    ? props.items.find((candidate) => candidate.id === item.equivalentId && candidate.spriteSheet) ?? item
    : item;
  emit('select', targetItem);
}

function triggerUpload() {
  fileInput.value?.click();
}

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result as string;
    const cleanName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Personaje';
    const isSheet = uploadAsSheet.value;
    const newItem: SpriteLibraryItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      category: 'Personalizados',
      src: dataUrl,
      spriteSheet: isSheet,
      isLibraryPrimary: true,
    };
    emit('upload', newItem);
    input.value = '';
  };
  reader.readAsDataURL(file);
}
</script>

<template>
  <div class="sprite-catalog" :class="{ 'theme-light': theme === 'light' }">
    <div class="catalog-actions">
      <button
        type="button"
        class="upload-trigger-btn"
        title="Subir imagen transparente PNG o SVG desde tu equipo"
        @click="triggerUpload"
      >
        <UiIcon name="arrow-up-right" :size="16" />
        <span>Subir personaje (PNG)</span>
      </button>
      <label class="upload-mode-toggle" title="Indica si la imagen subida contiene una cuadrícula de 9 vistas (3×3) o una figura única">
        <input v-model="uploadAsSheet" type="checkbox" />
        <span>Cuadrícula 3×3</span>
      </label>
      <input
        ref="fileInput"
        type="file"
        accept="image/png,image/svg+xml,image/webp,image/jpeg"
        class="sr-only"
        @change="onFileSelected"
      />
    </div>

    <div v-if="!visibleItems.length" class="catalog-empty">
      <p>No hay personajes disponibles.</p>
      <small>Coloca imágenes en <code>public/sapiens</code> o <code>public/sprites-3x3</code>, o sube un archivo PNG arriba.</small>
    </div>

    <div v-else class="catalog-grid" role="list">
      <button
        v-for="item in visibleItems"
        :key="item.id"
        type="button"
        class="sprite-card"
        :class="{ 'is-active': isItemSelected(item) }"
        :title="item.name"
        :aria-label="item.name"
        @click="handleSelect(item)"
      >
        <span
          class="sprite-crop"
          :class="{ 'is-figure': !item.spriteSheet }"
          :style="{
            backgroundImage: `url('${item.src}')`,
            backgroundSize: item.spriteSheet ? '300% 300%' : 'contain',
            backgroundPosition: item.spriteSheet ? '50% 50%' : 'center center',
          }"
        />
        <span v-if="isItemSelected(item)" class="sprite-badge" aria-hidden="true">✓</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.sprite-catalog {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  height: 100%;
}

.catalog-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border, rgba(148, 163, 184, 0.15));
}

.upload-trigger-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(99, 102, 241, 0.4);
  border-radius: 9px;
  background: rgba(99, 102, 241, 0.18);
  color: #c7d2fe;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}

.upload-trigger-btn:hover {
  background: rgba(99, 102, 241, 0.32);
  border-color: #818cf8;
  color: #ffffff;
}

.upload-mode-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #94a3b8;
  font-size: 10px;
  cursor: pointer;
  user-select: none;
}

.upload-mode-toggle input {
  cursor: pointer;
  accent-color: #6366f1;
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  overflow-y: auto;
  align-content: start;
  min-height: 0;
  padding-right: 4px;
}

.sprite-card {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  aspect-ratio: 1;
  padding: 6px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.7);
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.16s ease-out;
}

.sprite-card:hover {
  border-color: #818cf8;
  background: rgba(49, 46, 129, 0.35);
  color: #ffffff;
  transform: translateY(-2px);
}

.sprite-card.is-active {
  border-color: #c4b5fd;
  background: rgba(79, 70, 229, 0.35);
  box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.4), 0 6px 18px rgba(79, 70, 229, 0.22);
}

.sprite-crop {
  width: 52px;
  height: 52px;
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  background-color: transparent !important;
  background-repeat: no-repeat;
  transition: transform 0.15s;
}

.sprite-card:hover .sprite-crop {
  transform: scale(1.08);
}

.sprite-name {
  flex: 1;
  font-size: 11.5px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sprite-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: 2px solid #0f172a;
  border-radius: 50%;
  background: #818cf8;
  color: #0f172a;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}

.catalog-empty {
  padding: 24px 12px;
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
}

.catalog-empty code {
  color: #c7d2fe;
  background: rgba(15, 23, 42, 0.6);
  padding: 1px 4px;
  border-radius: 4px;
}

/* Modo claro */
.theme-light .upload-trigger-btn {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.35);
  color: #4338ca;
}

.theme-light .upload-trigger-btn:hover {
  background: rgba(99, 102, 241, 0.2);
  color: #312e81;
}

.theme-light .upload-mode-toggle {
  color: #64748b;
}

.theme-light .sprite-card {
  border-color: #cbd5e1;
  background: #ffffff;
  color: #1e293b;
}

.theme-light .sprite-card:hover {
  border-color: #6366f1;
  background: #f1f5f9;
  color: #0f172a;
}

.theme-light .sprite-card.is-active {
  border-color: #4f46e5;
  background: #eef2ff;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.3), 0 6px 18px rgba(79, 70, 229, 0.15);
}

.theme-light .sprite-badge {
  border-color: #ffffff;
  background: #4f46e5;
  color: #ffffff;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
