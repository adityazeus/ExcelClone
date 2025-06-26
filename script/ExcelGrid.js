import GridData from './GridData.js';
import GridCell from './GridCell.js';
import GridSelection from './GridSelection.js';
import GridRange from './GridRange.js';
import GridRenderer from './GridRenderer.js';

/**
 * Main class for managing the Excel-like grid, user interactions, and editing.
 */
class ExcelGrid {
  /**
   * Initializes the ExcelGrid object.
   * @param {HTMLCanvasElement} canvas The canvas element to render on.
   * @param {HTMLInputElement} input The input element for cell editing.
   */
  constructor(canvas, input) {
    /** @type {number} The total number of rows in the grid. */
    this.rows = 100000;
    /** @type {number} The total number of columns in the grid. */
    this.cols = 1000;
    /** @type {number} The width of each cell. */
    this.cellWidth = 64;
    /** @type {number} The height of each cell. */
    this.cellHeight = 20;
    /** @type {number} The width of the row header. */
    this.rowHeader = 40;
    /** @type {number} The height of the column header. */
    this.colHeader = 24;
    /** @type {?number} The row index currently being edited, or null. */
    this.editingRow = null;
    /** @type {?number} The column index currently being edited, or null. */
    this.editingCol = null;
    /** @type {function} Bound method to hide the editor. */
    this.hideEditor = this.hideEditor.bind(this);
    /** @type {GridData} The grid data object. */
    this.grid = new GridData(this.rows, this.cols);
    /** @type {GridSelection} The selection state object. */
    this.selection = new GridSelection();
    /** @type {GridRange} The range selection object. */
    this.range = new GridRange();
    /** @type {GridCell} The grid cell object. */
    this.gridCell = new GridCell(0, 0);
    /** @type {GridRenderer} The renderer for the grid. */
    this.renderer = new GridRenderer(
      canvas,
      this.grid,
      this.selection,
      this.cellWidth,
      this.cellHeight,
      this.rowHeader,
      this.colHeader,
      () => this.updateEditorPosition(),
      this.gridCell
    );
    /** @type {HTMLCanvasElement} The canvas element. */
    this.canvas = canvas;
    /** @type {HTMLInputElement} The input element for editing. */
    this.input = input;
    this.attachEvents();
    this.renderer.render();
  }

  /**
   * Updates the position and size of the cell editor input.
   */
  updateEditorPosition() {
    if (this.editingRow !== null && this.editingCol !== null) {
      const rect = this.renderer.getCellRect(this.editingRow, this.editingCol);
      if (rect) {
        this.input.style.display = 'block';
        this.input.style.left = `${rect.x}px`;
        this.input.style.top = `${rect.y}px`;
        this.input.style.width = `${rect.w - 1}px`;
        this.input.style.height = `${rect.h - 1}px`;
      } else {
        this.input.style.display = 'none';
      }
    }
  }

  /**
   * Attaches mouse and keyboard events for grid interaction and editing.
   */
  attachEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Row header click
      if (x < this.rowHeader && y > this.colHeader) {
        const row = Math.floor((y - this.colHeader) / this.cellHeight) + Math.floor(this.renderer.scrollY / this.cellHeight);
        this.selection.selectRow(row);
        this.renderer.render();
        this.hideEditor();
        return;
      }
      // Column header click
      if (y < this.colHeader && x > this.rowHeader) {
        const col = Math.floor((x - this.rowHeader) / this.cellWidth) + Math.floor(this.renderer.scrollX / this.cellWidth);
        this.selection.selectCol(col);
        this.renderer.render();
        this.hideEditor();
        return;
      }

      // Normal cell click
      const cell = this.renderer.getCellAt(x, y);
      if (cell) {
        this.selection.set(cell.row, cell.col);
        this.renderer.render();
        this.hideEditor();
      } else {
        this.hideEditor();
      }
    });

    this.canvas.addEventListener('dblclick', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cell = this.renderer.getCellAt(x, y);
      if (cell) {
        this.selection.set(cell.row, cell.col);
        this.renderer.render();
        this.showEditor(cell.row, cell.col);
      }
    });

    this.input.addEventListener('blur', () => {
      this.saveEditor();
      this.hideEditor();
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.saveEditor();
        this.hideEditor();
      }
    });
  }

  /**
   * Shows the cell editor input for the specified cell.
   * @param {number} row The row index.
   * @param {number} col The column index.
   */
  showEditor(row, col) {
    const rect = this.renderer.getCellRect(row, col);
    if (!rect) return;
    this.editingRow = row;
    this.editingCol = col;
    this.input.style.display = 'block';
    this.input.style.left = `${rect.x}px`;
    this.input.style.top = `${rect.y}px`;
    this.input.style.width = `${rect.w - 1}px`;
    this.input.style.height = `${rect.h - 1}px`;
    this.input.value = this.grid.getCell(row, col);
    this.input.focus();
    this.input.select();
  }

  /**
   * Hides the cell editor input.
   */
  hideEditor() {
    this.input.style.display = 'none';
    this.editingRow = null;
    this.editingCol = null;
  }

  /**
   * Saves the value from the cell editor input to the grid.
   */
  saveEditor() {
    if (this.editingRow !== null && this.editingCol !== null) {
      this.grid.setCell(this.editingRow, this.editingCol, this.input.value);
      this.renderer.render();
    }
  }
}

export default ExcelGrid;