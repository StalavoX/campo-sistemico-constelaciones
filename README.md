# 🌌 Campo Sistémico Pro - Simulador de Constelaciones Familiares

Un simulador interactivo de **Constelaciones Familiares y Diagnóstico Transgeneracional** listo para ejecutarse 100% de manera local y ser desplegado en **GitHub Pages**.

## 🚀 Características Principales

- **Tablero Circular en Forma de Reloj (12 Posiciones):** Guías concéntricas de proximidad (núcleo interno, medio y externo).
- **Catálogo Extendido con +110 Arquetipos:**
  - Mujeres, Hombres, Ancianos/Ancestros (diversidad étnica y visual).
  - Iconografía a color y diferenciada para personas, vínculos familiares, animales y conceptos, con variantes de cabello y edad.
  - Niños, Niñas, Bebés y Hijos No Nacidos / Abortos.
  - Roles familiares específicos (Matriarca, Patriarca, Pareja, Ex-pareja, etc.).
  - Animales domésticos y tótems (Perro, Gato, Caballo, Lobo, Águila, Serpiente, etc.).
  - Conceptos abstractos y sistémicos (Dinero, Enfermedad/Síntoma, Destino, Trauma/Secreto, Patria, Culpa).
- **Control de Mirada & Escala:** Ajuste fino de la orientación ($0^\circ$ a $360^\circ$) y jerarquía/tamaño ($0.6	imes$ a $1.8	imes$).
- **Vínculos y Conectores de Relación:** Trazado de líneas directas entre figuras para representar alianzas, conflictos o lealtades invisibles.
- **Historial Deshacer / Rehacer (Undo / Redo):** Navegación completa por los movimientos realizados.
- **Bitácora Clínica & Frases Sanadoras:** Panel de notas para el facilitador e inserción rápida de frases sistémicas.
- **Persistencia Local & Exportación:**
  - Descarga de imagen en **PNG** con el reloj, iconos, nombres, vínculos y datos de sesión.
  - Exportación e importación en formato **JSON**.
  - Generación de **Reporte PDF / Impresión** con mapa visual, resumen, elementos, vínculos y notas de sesión.
  - Guardado rápido en `localStorage`.
- **100% Offline (Sin servidores backend):** Iconos a color con emojis del sistema; sin dependencias externas de iconografía.

---

## 📁 Estructura del Proyecto

```text
campo-sistemico-constelaciones/
├── index.html          # Punto de entrada principal HTML5
├── css/
│   └── style.css       # Estilos personalizados, gradientes y formato de impresión
├── js/
│   ├── svg-icons.js    # Biblioteca de íconos SVG vectoriales embebidos
│   ├── archetypes.js   # Base de datos modular de 110+ arquetipos
│   ├── history.js      # Administrador de pila Deshacer/Rehacer (Undo/Redo)
│   └── app.js          # Lógica principal del canvas, interactividad y eventos
├── README.md           # Documentación del proyecto
└── .gitignore          # Archivos ignorados por Git
```

---

## 🛠️ Instalación y Uso Local

1. Clona este repositorio o descarga el archivo comprimido `.zip`.
2. Haz doble clic en el archivo `index.html` para abrirlo en cualquier navegador web moderno (Chrome, Edge, Firefox, Safari).
3. No requiere Node.js, servidores web local ni instalación de dependencias.

---

## 🌐 Publicación en GitHub Pages

Para publicar este proyecto gratuitamente en internet utilizando **GitHub Pages**:

1. Crea un nuevo repositorio en tu cuenta de GitHub (ejemplo: `campo-sistemico-constelaciones`).
2. Inicializa Git en la carpeta del proyecto y sube los archivos:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Campo Sistemico Pro"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/campo-sistemico-constelaciones.git
   git push -u origin main
   ```
3. En GitHub, ve a la pestaña **Settings** (Configuración) de tu repositorio.
4. En el menú lateral izquierdo, haz clic en **Pages**.
5. Bajo **Build and deployment > Source**, selecciona `Deploy from a branch`.
6. En **Branch**, selecciona `main` y la carpeta `/ (root)`, luego haz clic en **Save**.
7. En 1-2 minutos, tu aplicación estará en línea en:
   `https://TU-USUARIO.github.io/campo-sistemico-constelaciones/`

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia MIT. Libre para uso personal, académico y comercial.
