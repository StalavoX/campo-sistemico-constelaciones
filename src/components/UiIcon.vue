<script setup lang="ts">
withDefaults(defineProps<{
  name: 'spark' | 'plus' | 'copy' | 'menu' | 'close' | 'search' | 'shield' | 'undo' | 'redo' | 'link' | 'grid' | 'center' | 'download' | 'panel' | 'arrow-up-right' | 'trash' | 'up' | 'right' | 'down' | 'left' | 'print';
  size?: number;
}>(), {
  size: 18,
});
</script>

<template>
  <svg
    class="ui-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="name === 'spark'">
      <path d="M12 3.5 13.8 10l6.7 2-6.7 1.8L12 20.5l-1.8-6.7L3.5 12l6.7-2L12 3.5Z" />
      <path d="m19 3 .6 2.4L22 6l-2.4.6L19 9l-.6-2.4L16 6l2.4-.6L19 3Z" />
    </template>
    <template v-else-if="name === 'plus'">
      <path d="M12 5v14M5 12h14" />
    </template>
    <template v-else-if="name === 'copy'">
      <rect x="8" y="8" width="12" height="12" rx="2.5" />
      <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
    </template>
    <template v-else-if="name === 'menu'">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </template>
    <template v-else-if="name === 'close'">
      <path d="m6 6 12 12M18 6 6 18" />
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.5 15.5 4.2 4.2" />
    </template>
    <template v-else-if="name === 'shield'">
      <path d="M12 3.5 19 6v5.2c0 4.4-2.9 7.7-7 9.3-4.1-1.6-7-4.9-7-9.3V6l7-2.5Z" />
      <path d="m9 12 2 2 4-4" />
    </template>
    <template v-else-if="name === 'undo'">
      <path d="M9 8 5 12l4 4" />
      <path d="M5 12h8a6 6 0 0 1 6 6" />
    </template>
    <template v-else-if="name === 'redo'">
      <path d="m15 8 4 4-4 4" />
      <path d="M19 12h-8a6 6 0 0 0-6 6" />
    </template>
    <template v-else-if="name === 'link'">
      <path d="m10 14 4-4" />
      <path d="m9.2 14.8-1.4 1.4a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0" />
      <path d="m14.8 9.2 1.4-1.4a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0" />
    </template>
    <template v-else-if="name === 'grid'">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </template>
    <template v-else-if="name === 'center'">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v3M12 20v3M1 12h3M20 12h3" />
    </template>
    <template v-else-if="name === 'download'">
      <path d="M12 3v12m-5-5 5 5 5-5" />
      <path d="M5 17v3h14v-3" />
    </template>
    <template v-else-if="name === 'panel'">
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <path d="M14 4v16" />
    </template>
    <template v-else-if="name === 'arrow-up-right'">
      <path d="M7 17 17 7M8 7h9v9" />
    </template>
    <template v-else-if="name === 'trash'">
      <path d="M4 7h16M10 11v6M14 11v6M6.5 7l.8 13h9.4l.8-13M9 7V4h6v3" />
    </template>
    <template v-else-if="name === 'print'">
      <path d="M7 8V4h10v4M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <path d="M7 14h10v6H7zM17 11h.01" />
    </template>
    <template v-else>
      <path v-if="name === 'up'" d="m6 14 6-6 6 6" />
      <path v-else-if="name === 'right'" d="m10 6 6 6-6 6" />
      <path v-else-if="name === 'down'" d="m6 10 6 6 6-6" />
      <path v-else d="m14 6-6 6 6 6" />
    </template>
  </svg>
</template>
