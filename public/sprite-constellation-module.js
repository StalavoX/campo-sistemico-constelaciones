/**
 * Módulo: SpriteConstellationModule
 * Sistema autocontenido de figuras direccionales (sprites 3x3), menú contextual
 * de 9 direcciones fijas, detección de miradas e interacción de vínculos.
 * 
 * Convención de la cuadrícula 3x3:
 * [0: NW, 1: N, 2: NE]
 * [3: W,  4: C, 5: E ]
 * [6: SW, 7: S, 8: SE]
 */

class SpriteConstellationModule {
  constructor(options = {}) {
    this.container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;

    if (!this.container) {
      throw new Error('SpriteConstellationModule: No se encontró el contenedor.');
    }

    this.storageKey = options.storageKey || 'constellation_sprite_library_v1';
    this.onStateChange = typeof options.onStateChange === 'function' ? options.onStateChange : null;
    this.onSelectSprite = typeof options.onSelectSprite === 'function' ? options.onSelectSprite : null;
    this.onLibraryChange = typeof options.onLibraryChange === 'function' ? options.onLibraryChange : null;
    this.onError = typeof options.onError === 'function' ? options.onError : null;
    this.libraryOnly = options.libraryOnly === true;
    this.allowUploads = options.allowUploads !== false;

    // Direcciones indexadas de 0 a 8 (fila * 3 + columna)
    this.DIRECTIONS = [
      { index: 0, code: 'NW', label: 'Arriba-Izq', icon: '↖', dx: -0.707, dy: -0.707, angle: -135 },
      { index: 1, code: 'N',  label: 'Arriba',     icon: '↑', dx: 0,      dy: -1,     angle: -90  },
      { index: 2, code: 'NE', label: 'Arriba-Der', icon: '↗', dx: 0.707,  dy: -0.707, angle: -45  },
      { index: 3, code: 'W',  label: 'Izquierda',  icon: '←', dx: -1,     dy: 0,      angle: 180  },
      { index: 4, code: 'C',  label: 'Frente',     icon: '•', dx: 0,      dy: 0,      angle: 0    },
      { index: 5, code: 'E',  label: 'Derecha',    icon: '→', dx: 1,      dy: 0,      angle: 0    },
      { index: 6, code: 'SW', label: 'Abajo-Izq',  icon: '↙', dx: -0.707, dy: 0.707,  angle: 135  },
      { index: 7, code: 'S',  label: 'Abajo',      icon: '↓', dx: 0,      dy: 1,      angle: 90   },
      { index: 8, code: 'SE', label: 'Abajo-Der',  icon: '↘', dx: 0.707,  dy: 0.707,  angle: 45   }
    ];

    this.LINK_TYPES = {
      strong:   { label: 'Vínculo fuerte', color: '#10b981', dash: '' },
      loyalty:  { label: 'Lealtad',        color: '#6366f1', dash: '6,4' },
      tension:  { label: 'Tensión',        color: '#ef4444', dash: '3,3' },
      distance: { label: 'Distancia',      color: '#94a3b8', dash: '10,6' }
    };

    // Estado interno
    this.library = [
      ...(options.initialLibrary || []),
      ...(this.allowUploads ? this._loadSavedLibrary() : []),
    ];
    this.figures = [];
    this.links = [];
    this.selectedId = null;
    this.selectedSpriteSource = null;
    this.linkingFromId = null;
    this.dragState = null;

    this._injectStyles();
    this._renderLayout();
    if (!this.libraryOnly) this._bindGlobalEvents();
  }

  /* =========================================================
   * 1. GESTIÓN DE LIBRERÍA DE SPRITES 3x3
   * ========================================================= */

  /**
   * Registra un sprite 3x3 en la librería (puede ser ruta local, URL o Base64)
   */
  registerSprite({ id, name, category = 'General', src, persist = false }) {
    const item = {
      id: id || `spr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      category,
      src,
      spriteSheet: true
    };

    if (persist) {
      this._saveToStorage(item);
    }

    const existingIdx = this.library.findIndex(s => s.id === item.id);
    if (existingIdx >= 0) {
      this.library[existingIdx] = item;
    } else {
      this.library.push(item);
    }

    this._renderLibraryBar();
    if (this.onLibraryChange) this.onLibraryChange([...this.library]);
    return item;
  }

  /**
   * Procesa un archivo File (input type="file") y lo guarda en la librería
   */
  async addSpriteFromFile(file, name, category = 'Personalizado') {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        return reject(new Error('El archivo debe ser una imagen válida.'));
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const sprite = this.registerSprite({
            name: name || file.name.replace(/\.[^/.]+$/, ''),
            category,
            src: e.target.result,
            persist: true
          });
          resolve(sprite);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      reader.readAsDataURL(file);
    });
  }

  _loadSavedLibrary() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const saved = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(saved)) return [];
      return saved.filter(item =>
        item &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.src === 'string' &&
        /^data:image\/[a-z0-9.+-]+;base64,/i.test(item.src)
      ).map(item => ({
        ...item,
        category: typeof item.category === 'string' ? item.category : 'Sprites 3×3',
        spriteSheet: true
      }));
    } catch {
      return [];
    }
  }

  _saveToStorage(item) {
    const saved = this._loadSavedLibrary().filter(savedItem => savedItem.id !== item.id);
    saved.push(item);
    localStorage.setItem(this.storageKey, JSON.stringify(saved));
  }

  /* =========================================================
   * 2. GESTIÓN DE FIGURAS Y DIRECCIONES EN EL CAMPO
   * ========================================================= */

  /**
   * Añade una figura desde la librería al mapa en coordenadas (x, y) en porcentaje (0-100)
   */
  addFigure(spriteId, { x = 50, y = 50, label = '', direction = 4, scale = 1 } = {}) {
    const sprite = this.library.find(s => s.id === spriteId);
    if (!sprite) return null;

    // Pequeño desplazamiento automático si cae exactamente en el centro
    const offset = (this.figures.length % 5) * 3;
    const figure = {
      id: `fig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      spriteId: sprite.id,
      x: Math.min(88, Math.max(12, x + offset)),
      y: Math.min(88, Math.max(12, y + offset)),
      label: label || sprite.name,
      direction, // 0..8
      scale
    };

    this.figures.push(figure);
    this.selectFigure(figure.id);
    this._renderField();
    this._notifyChange();
    return figure;
  }

  setFigureDirection(figureId, dirIndex) {
    const fig = this.figures.find(f => f.id === figureId);
    if (!fig || dirIndex < 0 || dirIndex > 8) return;
    fig.direction = dirIndex;
    this._renderField();
    this._renderContextMenu();
    this._notifyChange();
  }

  /**
   * Calcula automáticamente cuál de las 8 direcciones cardinales/diagonales
   * apunta mejor desde sourceId hacia targetId
   */
  lookAtFigure(sourceId, targetId) {
    const src = this.figures.find(f => f.id === sourceId);
    const tgt = this.figures.find(f => f.id === targetId);
    if (!src || !tgt || src.id === tgt.id) return;

    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI); // -180 a 180

    // Mapeo de sectores de 45 grados a los índices de la matriz 3x3
    let dirIndex = 4;
    if (angleDeg >= -22.5 && angleDeg < 22.5) dirIndex = 5;        // E (Derecha)
    else if (angleDeg >= 22.5 && angleDeg < 67.5) dirIndex = 8;    // SE (Abajo-Der)
    else if (angleDeg >= 67.5 && angleDeg < 112.5) dirIndex = 7;   // S (Abajo)
    else if (angleDeg >= 112.5 && angleDeg < 157.5) dirIndex = 6;  // SW (Abajo-Izq)
    else if (angleDeg >= 157.5 || angleDeg < -157.5) dirIndex = 3; // W (Izquierda)
    else if (angleDeg >= -157.5 && angleDeg < -112.5) dirIndex = 0;// NW (Arriba-Izq)
    else if (angleDeg >= -112.5 && angleDeg < -67.5) dirIndex = 1; // N (Arriba)
    else if (angleDeg >= -67.5 && angleDeg < -22.5) dirIndex = 2;  // NE (Arriba-Der)

    this.setFigureDirection(sourceId, dirIndex);
  }

  removeFigure(figureId) {
    this.figures = this.figures.filter(f => f.id !== figureId);
    this.links = this.links.filter(l => l.from !== figureId && l.to !== figureId);
    if (this.selectedId === figureId) this.selectedId = null;
    this._renderField();
    this._renderContextMenu();
    this._notifyChange();
  }

  selectFigure(figureId) {
    this.selectedId = figureId;
    this._renderField();
    this._renderContextMenu();
  }

  /* =========================================================
   * 3. INTERACCIÓN Y VÍNCULOS ENTRE FIGURAS
   * ========================================================= */

  toggleLink(fromId, toId, type = 'strong') {
    if (fromId === toId) return;
    const existingIdx = this.links.findIndex(
      l => (l.from === fromId && l.to === toId) || (l.from === toId && l.to === fromId)
    );

    if (existingIdx >= 0) {
      const types = Object.keys(this.LINK_TYPES);
      const nextIdx = types.indexOf(this.links[existingIdx].type) + 1;
      if (nextIdx >= types.length) {
        this.links.splice(existingIdx, 1); // Eliminar vínculo tras ciclar todos los tipos
      } else {
        this.links[existingIdx].type = types[nextIdx];
      }
    } else {
      this.links.push({ id: `lnk_${Date.now()}`, from: fromId, to: toId, type });
    }
    this._renderField();
    this._notifyChange();
  }

  /**
   * Detecta si dos figuras se están mirando mutuamente según su dirección actual
   */
  _detectMutualGazes() {
    const mutualPairs = new Set();
    const thresholdDeg = 28; // Tolerancia angular en grados

    for (let i = 0; i < this.figures.length; i++) {
      for (let j = i + 1; j < this.figures.length; j++) {
        const a = this.figures[i];
        const b = this.figures[j];
        if (a.direction === 4 || b.direction === 4) continue;

        const dirA = this.DIRECTIONS[a.direction];
        const dirB = this.DIRECTIONS[b.direction];

        const angleAB = Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
        const angleBA = Math.atan2(a.y - b.y, a.x - b.x) * (180 / Math.PI);

        const diffA = Math.abs(((angleAB - dirA.angle + 540) % 360) - 180);
        const diffB = Math.abs(((angleBA - dirB.angle + 540) % 360) - 180);

        if (diffA <= thresholdDeg && diffB <= thresholdDeg) {
          mutualPairs.add(`${a.id}|${b.id}`);
        }
      }
    }
    return mutualPairs;
  }

  /* =========================================================
   * 4. SERIALIZACIÓN (PARA GUARDAR / CARGAR SESIONES)
   * ========================================================= */

  exportJSON() {
    return JSON.stringify({
      figures: this.figures,
      links: this.links
    }, null, 2);
  }

  importJSON(jsonString) {
    const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    this.figures = data.figures || [];
    this.links = data.links || [];
    this.selectedId = null;
    this._renderField();
    this._renderContextMenu();
  }

  _notifyChange() {
    if (this.onStateChange) {
      this.onStateChange({ figures: this.figures, links: this.links });
    }
  }

  /* =========================================================
   * 5. RENDERIZADO DOM Y ESTILOS ENCAPSULADOS
   * ========================================================= */

  _renderLayout() {
    const uploader = this.allowUploads ? `
      <label class="scm-upload-btn" title="Subir imagen en cuadrícula 3x3">
        + Sprite 3×3
        <input type="file" accept="image/*" hidden data-scm-file-input />
      </label>
    ` : '';
    const stage = this.libraryOnly ? '' : `
      <!-- Campo sistémico interactivo -->
      <div class="scm-stage" data-scm-stage>
        <div class="scm-field" data-scm-field>
          <div class="scm-ring scm-ring-outer"></div>
          <div class="scm-ring scm-ring-inner"></div>
          <svg class="scm-svg-layer" viewBox="0 0 100 100" preserveAspectRatio="none" data-scm-svg></svg>
          <div class="scm-figures-layer" data-scm-figures></div>
        </div>
        <div class="scm-context-menu" data-scm-menu hidden></div>
      </div>
    `;
    this.container.innerHTML = `
      <div class="scm-wrapper ${this.libraryOnly ? 'scm-library-only' : ''}">
        <!-- Barra de miniaturas de la librería -->
        <div class="scm-toolbar">
          <div class="scm-library-list" data-scm-library></div>
          ${uploader}
        </div>
        ${stage}
      </div>
    `;

    this.elLibrary = this.container.querySelector('[data-scm-library]');
    this.elFileInput = this.container.querySelector('[data-scm-file-input]');

    if (this.elFileInput) {
      this.elFileInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const name = file.name.replace(/\.[^/.]+$/, '').trim().slice(0, 80) || 'Personaje';
        try {
          await this.addSpriteFromFile(file, name);
        } catch (error) {
          if (this.onError) this.onError(error);
          else throw error;
        }
        e.target.value = '';
      });
    }

    if (this.libraryOnly) {
      this._renderLibraryBar();
      return;
    }
    this.elField = this.container.querySelector('[data-scm-field]');
    this.elSvg = this.container.querySelector('[data-scm-svg]');
    this.elFigures = this.container.querySelector('[data-scm-figures]');
    this.elMenu = this.container.querySelector('[data-scm-menu]');

    // Deseleccionar al hacer clic en el fondo vacío
    this.elField.addEventListener('pointerdown', (e) => {
      if (e.target === this.elField || e.target.classList.contains('scm-ring')) {
        this.selectedId = null;
        this.linkingFromId = null;
        this._renderField();
        this._renderContextMenu();
      }
    });

    this._renderLibraryBar();
    this._renderField();
  }

  get visibleLibrary() {
    return this.libraryOnly
      ? this.library.filter((item) => item.isLibraryPrimary !== false)
      : this.library;
  }

  setSelectedSpriteSource(source) {
    this.selectedSpriteSource = source;
    this.elLibrary.querySelectorAll('[data-add-sprite]').forEach((button) => {
      const item = this.library.find((entry) => entry.id === button.dataset.addSprite);
      const equivalentSheet = item?.equivalentId
        ? this.library.find((entry) => entry.id === item.equivalentId && entry.spriteSheet)
        : null;
      const isSelected = item?.src === source || equivalentSheet?.src === source;
      button.classList.toggle('is-selected', isSelected);
    });
  }

  _renderLibraryBar() {
    const visibleLibrary = this.visibleLibrary;
    if (!visibleLibrary.length) {
      const hint = document.createElement('span');
      hint.className = 'scm-empty-hint';
      hint.textContent = 'No hay personajes precargados.';
      this.elLibrary.replaceChildren(hint);
      return;
    }

    const buttons = visibleLibrary.map(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'scm-thumb-btn';
      button.dataset.addSprite = item.id;
      button.title = `Agregar: ${item.name}`;
      button.setAttribute('aria-label', `Agregar ${item.name} al campo`);
      const crop = document.createElement('span');
      crop.className = `scm-thumb-crop${item.spriteSheet ? '' : ' scm-thumb-crop--figure'}`;
      crop.style.backgroundImage = `url("${item.src}")`;
      const name = document.createElement('span');
      name.className = 'scm-thumb-name';
      name.textContent = item.name;
      const selection = document.createElement('span');
      selection.className = 'scm-thumb-selection';
      selection.setAttribute('aria-hidden', 'true');
      selection.textContent = '✓';
      button.append(crop, name, selection);
      return button;
    });
    this.elLibrary.replaceChildren(...buttons);

    this.elLibrary.querySelectorAll('[data-add-sprite]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sprite = this.library.find(item => item.id === btn.dataset.addSprite);
        if (!sprite) return;
        const equivalentSheet = this.libraryOnly && !sprite.spriteSheet
          ? this.library.find((item) => item.id === sprite.equivalentId && item.spriteSheet)
          : null;
        const selectedSprite = equivalentSheet || sprite;
        if (this.onSelectSprite) this.onSelectSprite(selectedSprite);
        else this.addFigure(selectedSprite.id);
      });
    });
    this.setSelectedSpriteSource(this.selectedSpriteSource);
  }

  _renderField() {
    const mutualGazes = this._detectMutualGazes();

    // 1. Renderizar líneas SVG (vínculos + vectores de mirada)
    let svgContent = `
      <defs>
        <marker id="scm-arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="#f59e0b" />
        </marker>
        <marker id="scm-arrow-mutual" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="#10b981" />
        </marker>
      </defs>
    `;

    // Líneas de vínculo relacional
    this.links.forEach(link => {
      const a = this.figures.find(f => f.id === link.from);
      const b = this.figures.find(f => f.id === link.to);
      if (!a || !b) return;
      const style = this.LINK_TYPES[link.type] || this.LINK_TYPES.strong;
      svgContent += `
        <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"
              stroke="${style.color}" stroke-width="0.65"
              stroke-dasharray="${style.dash}" opacity="0.85" />
      `;
    });

    // Vectores de mirada según dirección 0..8
    this.figures.forEach(fig => {
      if (fig.direction === 4) return; // Mirando al frente (centro)
      const dir = this.DIRECTIONS[fig.direction];
      const len = 13;
      const x2 = fig.x + dir.dx * len;
      const y2 = fig.y + dir.dy * len;

      const isMutual = Array.from(mutualGazes).some(pair => pair.includes(fig.id));
      const strokeColor = isMutual ? '#10b981' : '#f59e0b';
      const marker = isMutual ? 'url(#scm-arrow-mutual)' : 'url(#scm-arrow)';

      svgContent += `
        <line x1="${fig.x}" y1="${fig.y}" x2="${x2}" y2="${y2}"
              stroke="${strokeColor}" stroke-width="0.55"
              stroke-dasharray="1.2,1.2" marker-end="${marker}" />
      `;
    });

    this.elSvg.innerHTML = svgContent;

    // 2. Renderizar figuras posicionadas
    this.elFigures.innerHTML = this.figures.map(fig => {
      const sprite = this.library.find(s => s.id === fig.spriteId);
      if (!sprite) return '';

      const col = fig.direction % 3;
      const row = Math.floor(fig.direction / 3);
      const posX = col * 50; // 0%, 50%, 100%
      const posY = row * 50; // 0%, 50%, 100%
      const isSelected = fig.id === this.selectedId;
      const isLinkingTarget = this.linkingFromId && this.linkingFromId !== fig.id;

      return `
        <div class="scm-figure ${isSelected ? 'is-selected' : ''} ${isLinkingTarget ? 'is-link-target' : ''}"
             data-fig-id="${fig.id}"
             style="left: ${fig.x}%; top: ${fig.y}%; transform: translate(-50%, -50%) scale(${fig.scale});">
          <div class="scm-sprite-box"
               style="background-image: url('${sprite.src}'); background-position: ${posX}% ${posY}%;">
          </div>
          <span class="scm-figure-label">${fig.label}</span>
        </div>
      `;
    }).join('');

    // Eventos de arrastre y selección por figura
    this.elFigures.querySelectorAll('.scm-figure').forEach(el => {
      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const id = el.dataset.figId;

        // Si estaba activo el modo "Conectar vínculo", crea el vínculo con esta figura
        if (this.linkingFromId && this.linkingFromId !== id) {
          this.toggleLink(this.linkingFromId, id);
          this.linkingFromId = null;
          this.selectFigure(id);
          return;
        }

        this.selectFigure(id);
        const fig = this.figures.find(f => f.id === id);
        const rect = this.elField.getBoundingClientRect();
        this.dragState = {
          id,
          startX: e.clientX,
          startY: e.clientY,
          origX: fig.x,
          origY: fig.y,
          fieldW: rect.width,
          fieldH: rect.height
        };
      });
    });
  }

  _renderContextMenu() {
    const fig = this.figures.find(f => f.id === this.selectedId);
    if (!fig) {
      this.elMenu.hidden = true;
      return;
    }

    this.elMenu.hidden = false;
    const otherFigures = this.figures.filter(f => f.id !== fig.id);

    this.elMenu.innerHTML = `
      <div class="scm-menu-header">
        <input type="text" class="scm-name-input" value="${fig.label}" data-scm-label placeholder="Rol / Nombre" />
        <button type="button" class="scm-del-btn" data-scm-delete title="Quitar del mapa">✕</button>
      </div>

      <!-- Pad de 9 direcciones fijas -->
      <div class="scm-dpad-label">Dirección de mirada (fija)</div>
      <div class="scm-dpad">
        ${this.DIRECTIONS.map(d => `
          <button type="button"
                  class="scm-dir-btn ${fig.direction === d.index ? 'is-active' : ''}"
                  data-dir="${d.index}"
                  title="${d.label}">
            ${d.icon}
          </button>
        `).join('')}
      </div>

      <!-- Interacción entre figuras -->
      ${otherFigures.length ? `
        <div class="scm-interaction-row">
          <select class="scm-select" data-scm-lookat>
            <option value="">Mirar hacia...</option>
            ${otherFigures.map(o => `<option value="${o.id}">${o.label}</option>`).join('')}
          </select>
        </div>
      ` : ''}

      <div class="scm-actions-row">
        <button type="button" class="scm-action-btn ${this.linkingFromId === fig.id ? 'is-active' : ''}" data-scm-link>
          ${this.linkingFromId === fig.id ? 'Selecciona destino...' : '🔗 Vincular'}
        </button>
        <input type="range" min="0.7" max="1.4" step="0.1" value="${fig.scale}" data-scm-scale title="Escala" />
      </div>
    `;

    // Bindings del menú contextual
    this.elMenu.querySelectorAll('[data-dir]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setFigureDirection(fig.id, Number(btn.dataset.dir));
      });
    });

    this.elMenu.querySelector('[data-scm-label]').addEventListener('input', (e) => {
      fig.label = e.target.value;
      this._renderField();
      this._notifyChange();
    });

    const lookAtSelect = this.elMenu.querySelector('[data-scm-lookat]');
    if (lookAtSelect) {
      lookAtSelect.addEventListener('change', (e) => {
        if (e.target.value) {
          this.lookAtFigure(fig.id, e.target.value);
          e.target.value = '';
        }
      });
    }

    this.elMenu.querySelector('[data-scm-link]').addEventListener('click', () => {
      this.linkingFromId = this.linkingFromId === fig.id ? null : fig.id;
      this._renderField();
      this._renderContextMenu();
    });

    this.elMenu.querySelector('[data-scm-scale]').addEventListener('input', (e) => {
      fig.scale = parseFloat(e.target.value);
      this._renderField();
    });

    this.elMenu.querySelector('[data-scm-delete]').addEventListener('click', () => {
      this.removeFigure(fig.id);
    });
  }

  _bindGlobalEvents() {
    window.addEventListener('pointermove', (e) => {
      if (!this.dragState) return;
      const fig = this.figures.find(f => f.id === this.dragState.id);
      if (!fig) return;

      const dxPct = ((e.clientX - this.dragState.startX) / this.dragState.fieldW) * 100;
      const dyPct = ((e.clientY - this.dragState.startY) / this.dragState.fieldH) * 100;

      fig.x = Math.min(92, Math.max(8, this.dragState.origX + dxPct));
      fig.y = Math.min(92, Math.max(8, this.dragState.origY + dyPct));
      this._renderField();
    });

    window.addEventListener('pointerup', () => {
      if (this.dragState) {
        this.dragState = null;
        this._notifyChange();
      }
    });
  }

  _injectStyles() {
    if (document.getElementById('scm-module-styles')) return;
    const style = document.createElement('style');
    style.id = 'scm-module-styles';
    style.textContent = `
      .scm-wrapper { display: flex; flex-direction: column; gap: 12px; font-family: system-ui, -apple-system, sans-serif; color: #1e293b; }
      .scm-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow-x: auto; }
      .scm-library-list { display: flex; align-items: center; gap: 8px; }
      .scm-thumb-btn { display: flex; align-items: center; gap: 6px; padding: 4px 10px 4px 4px; background: #fff; border: 1px solid #cbd5e1; border-radius: 999px; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
      .scm-thumb-btn:hover { border-color: #6366f1; background: #eef2ff; }
      .scm-thumb-crop { width: 28px; height: 28px; flex: 0 0 28px; border-radius: 50%; background-size: 300% 300%; background-position: 50% 50%; background-repeat: no-repeat; background-color: #f1f5f9; }
      .scm-thumb-name { font-size: 12px; font-weight: 600; }
      .scm-upload-btn { padding: 6px 12px; background: #0f172a; color: #fff; font-size: 12px; font-weight: 600; border-radius: 8px; cursor: pointer; white-space: nowrap; }
      .scm-stage { position: relative; display: flex; justify-content: center; align-items: center; background: #f1f5f9; border-radius: 16px; padding: 16px; min-height: 520px; }
      .scm-field { position: relative; width: min(100%, 500px); aspect-ratio: 1 / 1; background: radial-gradient(circle, #ffffff 0%, #f8fafc 75%, #e2e8f0 100%); border-radius: 50%; border: 2px solid #cbd5e1; box-shadow: inset 0 2px 12px rgba(15,23,42,0.06); touch-action: none; }
      .scm-ring { position: absolute; border-radius: 50%; border: 1px dashed #cbd5e1; pointer-events: none; top: 50%; left: 50%; transform: translate(-50%, -50%); }
      .scm-ring-outer { width: 72%; height: 72%; }
      .scm-ring-inner { width: 38%; height: 38%; }
      .scm-svg-layer { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
      .scm-figures-layer { position: absolute; inset: 0; }
      .scm-figure { position: absolute; display: flex; flex-direction: column; align-items: center; cursor: grab; user-select: none; z-index: 2; }
      .scm-figure:active { cursor: grabbing; }
      .scm-sprite-box { width: 64px; height: 64px; background-size: 300% 300%; background-repeat: no-repeat; border-radius: 12px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.14)); transition: outline 0.15s; }
      .scm-figure.is-selected .scm-sprite-box { outline: 2.5px solid #6366f1; outline-offset: 2px; background-color: rgba(99, 102, 241, 0.08); }
      .scm-figure.is-link-target .scm-sprite-box { outline: 2.5px dashed #10b981; outline-offset: 3px; }
      .scm-figure-label { margin-top: 2px; padding: 1px 7px; font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.92); border: 1px solid #cbd5e1; border-radius: 999px; white-space: nowrap; }
      .scm-context-menu { position: absolute; top: 16px; right: 16px; width: 205px; background: #fff; border: 1px solid #cbd5e1; border-radius: 14px; padding: 12px; box-shadow: 0 10px 25px rgba(15,23,42,0.12); z-index: 10; display: flex; flex-direction: column; gap: 8px; }
      .scm-context-menu[hidden] { display: none; }
      .scm-menu-header { display: flex; gap: 6px; align-items: center; }
      .scm-name-input { width: 100%; font-size: 12px; font-weight: 600; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 6px; }
      .scm-del-btn { background: #fee2e2; color: #b91c1c; border: none; border-radius: 6px; width: 26px; height: 26px; cursor: pointer; font-weight: bold; }
      .scm-dpad-label { font-size: 11px; font-weight: 600; color: #64748b; text-align: center; }
      .scm-dpad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
      .scm-dir-btn { height: 34px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 8px; font-size: 15px; cursor: pointer; transition: all 0.12s; }
      .scm-dir-btn:hover { background: #e2e8f0; }
      .scm-dir-btn.is-active { background: #4f46e5; color: #fff; border-color: #4f46e5; font-weight: bold; }
      .scm-select { width: 100%; font-size: 12px; padding: 5px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; }
      .scm-actions-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
      .scm-action-btn { flex: 1; font-size: 11px; font-weight: 600; padding: 5px 8px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; cursor: pointer; }
      .scm-action-btn.is-active { background: #10b981; color: #fff; border-color: #10b981; }
      .scm-actions-row input[type="range"] { width: 60px; }
      .scm-empty-hint { font-size: 12px; color: #64748b; }
      .scm-library-only { gap: 0; }
      .scm-library-only .scm-toolbar { height: 100%; min-height: 0; flex-direction: column; align-items: stretch; justify-content: flex-start; padding: 0; overflow: visible; border: 0; background: transparent; }
      .scm-library-only .scm-library-list { display: grid; min-height: 0; flex: 1; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: max-content; align-content: start; align-items: stretch; gap: 9px; max-height: 100%; overflow-y: auto; }
      .scm-library-only .scm-thumb-btn { position: relative; min-width: 0; padding: 9px; border-color: #334155; border-radius: 12px; color: #e2e8f0; background: #1e293b; }
      .scm-library-only .scm-thumb-btn:hover { border-color: #818cf8; color: #fff; background: #273449; }
      .scm-library-only .scm-thumb-btn:focus-visible { outline: 3px solid #fbbf24; outline-offset: 3px; }
      .scm-library-only .scm-thumb-btn:active { transform: scale(.97); }
      .scm-library-only .scm-thumb-btn.is-selected { border-color: #c4b5fd; color: #fff; background: #312e81; box-shadow: 0 0 0 2px rgba(129, 140, 248, .42), 0 8px 20px rgba(79, 70, 229, .25); }
      .scm-library-only .scm-thumb-selection { position: absolute; top: -7px; right: -7px; display: none; width: 20px; height: 20px; place-items: center; border: 2px solid #0f172a; border-radius: 50%; color: #1e1b4b; background: #c4b5fd; font-size: 12px; font-weight: 800; line-height: 1; }
      .scm-library-only .scm-thumb-btn.is-selected .scm-thumb-selection { display: grid; }
      .scm-thumb-crop--figure { background-size: 170% auto; background-position: 50% 15%; }
      .scm-library-only .scm-thumb-name { overflow: hidden; text-overflow: ellipsis; }
      .scm-library-only .scm-upload-btn { display: block; padding: 10px 12px; border: 1px solid #6366f1; border-radius: 10px; text-align: center; background: #4338ca; }
      .scm-library-only .scm-empty-hint { grid-column: 1 / -1; padding: 12px; color: #94a3b8; text-align: center; }
      .theme-light .scm-library-only .scm-thumb-btn { border-color: #cbd5e1; color: #1e293b; background: #fff; }
      .theme-light .scm-library-only .scm-thumb-btn:hover { border-color: #6366f1; color: #1e1b4b; background: #eef2ff; }
      .theme-light .scm-library-only .scm-thumb-btn.is-selected { border-color: #4f46e5; color: #1e1b4b; background: #eef2ff; box-shadow: 0 0 0 2px rgba(79, 70, 229, .3), 0 8px 20px rgba(79, 70, 229, .14); }
      .theme-light .scm-library-only .scm-thumb-selection { border-color: #fff; color: #fff; background: #4f46e5; }
      .theme-light .scm-library-only .scm-empty-hint { color: #64748b; }
    `;
    document.head.appendChild(style);
  }
}

// Exportación compatible tanto con <script> tradicional como con ES Modules
if (typeof window !== 'undefined') {
  window.SpriteConstellationModule = SpriteConstellationModule;
}