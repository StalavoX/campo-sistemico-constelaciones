# Campo Sistémico

Aplicación web local e instalable para crear representaciones visuales de sesiones de trabajo sistémico. No tiene backend: las sesiones se guardan en IndexedDB del navegador y no se envían a ningún servicio.

> Es una herramienta de organización y apoyo visual. No realiza diagnósticos ni sustituye la evaluación de un profesional.

## Tecnología

- Vue 3 y TypeScript para la interfaz y el modelo de datos.
- Vite para desarrollo, compilación y publicación estática.
- SVG para el tablero interactivo y sus exportaciones.
- SVG Twemoji locales para que los iconos se vean igual en distintos sistemas y funcionen offline.
- Figuras humanas completas de Sapiens, almacenadas localmente para mantener una anatomía coherente y reconocible.
- IndexedDB para varias sesiones locales con guardado automático.
- Web App Manifest y service worker para instalación y uso offline después de la primera carga.

## Requisitos

- Node.js 22.12+, 24+ o 26+.
- npm 10+.

## Desarrollo

```bash
npm install
npm run dev
```

Vite muestra la dirección local en la terminal. La aplicación ya no se abre haciendo doble clic en `index.html`; usa el servidor local de Vite durante el desarrollo.

## Validación y compilación

```bash
npm test
npm run build
npm run preview
```

La carpeta `dist/` contiene el sitio estático listo para publicar. No subir `node_modules/`.

## Publicar en GitHub Pages

1. Ejecuta `npm run build`.
2. En la configuración del repositorio, selecciona **Settings → Pages → Build and deployment → GitHub Actions**.
3. Envía los cambios a la rama `main`; `.github/workflows/deploy.yml` ejecuta las pruebas, compila `dist/` y lo publica.
4. Abre el sitio con HTTPS. Después de la primera visita, el service worker almacena la aplicación para volver a abrirla sin conexión.

La configuración de Vite usa rutas relativas para funcionar en una URL de proyecto de GitHub Pages. Para instalar la app o habilitar el modo offline se requiere un origen seguro (HTTPS o `localhost`).

## Datos y respaldos

- Cada sesión se guarda localmente y de forma automática en el navegador.
- Crear, duplicar, renombrar y eliminar sesiones es independiente por navegador/dispositivo.
- Usa **Exportar sesión JSON** para respaldar o mover una sesión. El archivo puede importarse desde otro dispositivo.
- PNG y PDF se generan localmente. El informe no se envía a ningún servidor.
- La modernización empieza con un almacenamiento limpio y no importa automáticamente el `localStorage` de la versión anterior.

## Controles

- Arrastrar una figura cambia su posición; activa la cuadrícula para ajustar el movimiento.
- La biblioteca muestra una sola tarjeta por personaje emparejado: usa la miniatura de la figura individual y agrega su hoja 3×3 al tablero. Las hojas sin pareja también aparecen una sola vez.
- Coloca figuras (SVG, PNG, JPG/JPEG, WebP o GIF) en `public/sapiens/` y hojas 3×3 en `public/sprites-3x3/`. Para vincular una figura con su hoja, usa el mismo nombre de archivo sin la extensión (por ejemplo, `hombre 1.png` y `hombre 1.jpg`). Al iniciar Vite o compilar, los manifiestos se actualizan automáticamente.
- Selecciona una figura para ajustar su nombre, tamaño y dirección de mirada en ocho direcciones más la posición al frente.
- Usa el botón **A+** en la barra superior para ampliar el texto de la interfaz.
- Usa **Vínculo** y selecciona dos figuras para crear una relación; selecciónala en el mapa o en la lista para editar su tipo, etiqueta y color.
- `Ctrl/Cmd + Z` deshace, `Ctrl/Cmd + Y` rehace y `Ctrl/Cmd + S` guarda.
- `Delete` elimina la selección y `Esc` cancela el modo de vínculo.
- En pantallas pequeñas, abre la biblioteca o los detalles con sus respectivos botones.

## Privacidad

Las sesiones quedan en IndexedDB del navegador; las imágenes de la biblioteca se sirven desde las carpetas locales del proyecto y se incorporan a las sesiones para que los respaldos sigan mostrándolas. Las imágenes no se envían a ningún servidor.

## Licencia

MIT.

Las ilustraciones Twemoji © Twitter, Inc. y otros colaboradores se distribuyen bajo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). La colección SVG local se obtiene de [@twemoji/svg](https://github.com/SamuelKopp/twemoji-svg), cuya adaptación del paquete se distribuye bajo MIT.

Las figuras humanas se exportaron manualmente desde [Sapiens](https://sapiens.ui8.net/). Antes de redistribuir el proyecto, revisa los términos de licencia de UI8 correspondientes a la cuenta o plan utilizado.
