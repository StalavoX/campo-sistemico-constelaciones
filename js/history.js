/**
 * Gestor de Historial Deshacer / Rehacer (Undo / Redo)
 */
class HistoryManager {
  constructor() {
    this.stack = [];
    this.step = -1;
  }

  saveState(nodes, lines) {
    const state = JSON.stringify({ nodes, lines });
    if (this.stack[this.step] === state) return;
    this.stack = this.stack.slice(0, this.step + 1);
    this.stack.push(state);
    this.step++;
  }

  canUndo() {
    return this.step > 0;
  }

  canRedo() {
    return this.step < this.stack.length - 1;
  }

  undo() {
    if (this.canUndo()) {
      this.step--;
      return JSON.parse(this.stack[this.step]);
    }
    return null;
  }

  redo() {
    if (this.canRedo()) {
      this.step++;
      return JSON.parse(this.stack[this.step]);
    }
    return null;
  }
}

const historyMgr = new HistoryManager();
