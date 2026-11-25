const CACHE_NAME = 'campo-sistemico-v8';
const CORE_ASSETS = [
  './',
  './manifest.webmanifest',
  './icon.svg',
  './sapiens/manifest.json',
  './sprites-3x3/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(CORE_ASSETS);
      const shellResponse = await fetch('./');
      const shellMarkup = await shellResponse.clone().text();
      const bundlePaths = [...shellMarkup.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)]
        .map((match) => match[1]);
      await Promise.all(bundlePaths.map(async (path) => {
        const url = new URL(path, self.registration.scope);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`No se pudo almacenar ${path} para uso offline.`);
        await cache.put(url, response);
      }));
      const iconManifestResponse = await fetch('./twemoji/manifest.json');
      if (!iconManifestResponse.ok) throw new Error('No se pudo cargar el catálogo de iconos para uso offline.');
      const iconPaths = await iconManifestResponse.json();
      if (!Array.isArray(iconPaths) || iconPaths.some((path) => typeof path !== 'string' || !path.startsWith('./twemoji/') || !path.endsWith('.svg'))) {
        throw new Error('El catálogo de iconos offline no es válido.');
      }
      await cache.addAll(iconPaths.map((path) => new URL(path, self.registration.scope)));
      const sapiensManifestResponse = await fetch('./sapiens/manifest.json');
      if (!sapiensManifestResponse.ok) throw new Error('No se pudo cargar el catálogo Sapiens para uso offline.');
      const sapiensPaths = await sapiensManifestResponse.json();
      if (!Array.isArray(sapiensPaths) || sapiensPaths.some((path) =>
        typeof path !== 'string' ||
        !path.startsWith('./sapiens/') ||
        !/\.(?:svg|png|jpe?g|webp|gif)$/i.test(path)
      )) {
        throw new Error('El catálogo Sapiens offline no es válido.');
      }
      await cache.addAll(sapiensPaths.map((path) => new URL(path, self.registration.scope)));

      const spriteSheetManifestResponse = await fetch('./sprites-3x3/manifest.json');
      if (!spriteSheetManifestResponse.ok) throw new Error('No se pudo cargar el catálogo de sprites para uso offline.');
      const spriteSheetPaths = await spriteSheetManifestResponse.json();
      if (!Array.isArray(spriteSheetPaths) || spriteSheetPaths.some((path) =>
        typeof path !== 'string' ||
        !path.startsWith('./sprites-3x3/') ||
        !/\.(?:svg|png|jpe?g|webp|gif)$/i.test(path)
      )) {
        throw new Error('El catálogo de sprites offline no es válido.');
      }
      await cache.addAll(spriteSheetPaths.map((path) => new URL(path, self.registration.scope)));
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;

  const url = new URL(event.request.url);
  const isStaticAsset = url.pathname.includes('/twemoji/') ||
    url.pathname.includes('/sapiens/') ||
    url.pathname.includes('/sprites-3x3/') ||
    url.pathname.includes('/assets/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js');

  // Estrategia Cache-First para recursos inmutables y estáticos
  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request, { ignoreVary: true }).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      }),
    );
    return;
  }

  // Estrategia Network-First con fallback a caché para navegación y documentos
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request, { ignoreVary: true });
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          const shell = await caches.match('./');
          if (shell) return shell;
        }
        return new Response('Sin conexión y recurso no disponible localmente.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }),
  );
});
