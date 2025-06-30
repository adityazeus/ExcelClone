import GridData from './GridData.js';
import GridCell from './GridCell.js';
import GridSelection from './GridSelection.js';
import GridRange from './GridRange.js';
import GridRenderer from './GridRenderer.js';
import CommandManager from './CommandManager.js';
import SetCellCommand from './SetCellCommand.js';
import ResizeRowCommand from './ResizeRowCommand.js';
import ResizeColCommand from './ResizeColCommand.js';

/**
 * Main class for managing the Excel-like grid, user interactions, and editing.
 */
class ExcelGrid {
  /**
   * Inserts a new row at the selected row or after the last selected row.
   */
  /**
   * Inserts a new row at the given index and updates row heights.
   * @param {number} insertAt The index at which to insert the row.
   */
  insertRowAt(insertAt) {
    this.grid.insertRow(insertAt);
    this.rowHeights.splice(insertAt, 0, this.cellHeight);
    this.renderer.render();
  }

  /**
   * Inserts a new column at the selected column or after the last selected column.
   */
  /**
   * Inserts a new column at the given index and updates col widths.
   * @param {number} insertAt The index at which to insert the column.
   */
  insertColAt(insertAt) {
    this.grid.insertCol(insertAt);
    this.colWidths.splice(insertAt, 0, this.cellWidth);
    this.renderer.render();
  }


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
    this.colWidths = Array(this.cols).fill(this.cellWidth);
    this.rowHeights = Array(this.rows).fill(this.cellHeight);
    this.renderer = new GridRenderer(
      canvas,
      this.grid,
      this.selection,
      this.cellWidth,
      this.cellHeight,
      this.colWidths,
      this.rowHeights,
      this.rowHeader,
      this.colHeader,
      () => { },                        // <-- onScroll FIRST
      () => this.updateEditorPosition(),// <-- updateEditorPosition SECOND
      this.gridCell,
      (col, oldWidth, newWidth) => {
        if (oldWidth !== newWidth) {
          const cmd = new ResizeColCommand(this.grid, this.colWidths, col, oldWidth, newWidth, this.renderer);
          this.commandManager.execute(cmd);
        }
      },
      (row, oldHeight, newHeight) => {
        if (oldHeight !== newHeight) {
          const cmd = new ResizeRowCommand(this.grid, this.rowHeights, row, oldHeight, newHeight, this.renderer);
          this.commandManager.execute(cmd);
        }
      }
    );
    /** @type {HTMLCanvasElement} The canvas element. */
    this.canvas = canvas;
    /** @type {HTMLInputElement} The input element for editing. */
    this.input = input;
    this.addRowBtn = document.getElementById('add-row-btn');
    this.addColBtn = document.getElementById('add-col-btn');
    this.statsBar = document.getElementById('stats-bar');
    this.selectedHeader = null;
    this.addRowBtn.disabled = true;
    this.addColBtn.disabled = true;
    /** @type {boolean} Is currently selecting rows. */
    this.isSelectingRows = false;
    /** @type {boolean} Is currently selecting columns. */
    this.isSelectingCols = false;
    /** @type {number|null} The starting row for selection. */
    this.startRow = null;
    /** @type {number|null} The starting column for selection. */
    this.startCol = null;
    this.commandManager = new CommandManager();

    // Undo/Redo buttons
    this.undoBtn = document.getElementById('undo-btn');
    this.redoBtn = document.getElementById('redo-btn');
    if (this.undoBtn && this.redoBtn) {
      this.undoBtn.addEventListener('click', () => {
        this.commandManager.undo();
        this.hideEditor();
      });
      this.redoBtn.addEventListener('click', () => {
        this.commandManager.redo();
        this.hideEditor();
      });
    }
    this.attachEvents();
    this.renderer.render();

    this._multiCellSelection = {
      isSelectingCells: false,
      startCell: null,
      endCell: null
    };
    this.renderer.multiCellSelection = this._multiCellSelection;

    // Mouse down on a cell (not header)
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x > this.rowHeader && y > this.colHeader) {
        const cell = this.renderer.getCellAt(x, y);
        if (cell) {
          this._multiCellSelection.isSelectingCells = true;
          this._multiCellSelection.startCell = cell;
          this._multiCellSelection.endCell = cell;
          this.renderer.render();
        }
      }
    });

    // Mouse move for drag selection
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this._multiCellSelection.isSelectingCells) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cell = this.renderer.getCellAt(x, y);
      if (cell) {
        this._multiCellSelection.endCell = cell;
        this.renderer.render();
      }
    });

    // Mouse up to finish selection
    window.addEventListener('mouseup', () => {
      if (this._multiCellSelection.isSelectingCells) {
        this._multiCellSelection.isSelectingCells = false;
        this.renderer.render();
      }
    });

    // Patch renderer to draw multi-cell selection rectangle
    if (!this._multiCellSelectionPatched) {
      const origRenderCells = this.renderer.renderCells.bind(this.renderer);
      this.renderer.renderCells = (ctx, startCol, startRow, accumulatedWidth, accumulatedHeight) => {
        origRenderCells(ctx, startCol, startRow, accumulatedWidth, accumulatedHeight);

        const sel = this._multiCellSelection;
        if (
          (sel.startCell && sel.endCell) &&
          (sel.isSelectingCells || (!sel.isSelectingCells && (sel.startCell.row !== sel.endCell.row || sel.startCell.col !== sel.endCell.col)))
        ) {
          const r1 = Math.min(sel.startCell.row, sel.endCell.row);
          const r2 = Math.max(sel.startCell.row, sel.endCell.row);
          const c1 = Math.min(sel.startCell.col, sel.endCell.col);
          const c2 = Math.max(sel.startCell.col, sel.endCell.col);

          // Highlight all cells in the rectangle
          for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
              const rect = this.renderer.getCellRect(r, c);
              if (rect) {
                ctx.save();
                ctx.fillStyle = 'rgba(16,124,65,0.08)';
                ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
                ctx.restore();
              }
            }
          }
          // Draw border around the rectangle
          const topLeft = this.renderer.getCellRect(r1, c1);
          const bottomRight = this.renderer.getCellRect(r2, c2);
          if (topLeft && bottomRight) {
            ctx.save();
            ctx.strokeStyle = '#107C41';
            ctx.lineWidth = 2;
            ctx.strokeRect(
              topLeft.x,
              topLeft.y,
              bottomRight.x + bottomRight.w - topLeft.x,
              bottomRight.y + bottomRight.h - topLeft.y
            );
            ctx.restore();
          }
          // --- Compute and show stats for selected cells ---
          this.computeAndShowStats(r1, r2, c1, c2);
        } else {
          // Only clear stats bar if no header is selected
          if (!this.selectedHeader) {
            this.statsBar.innerHTML = '';
          }
        }
      };
      this._multiCellSelectionPatched = true;
    }
  }

  /**
   * Updates the position and size of the cell editor input.
   */
  updateEditorPosition() {
    if (this.editingRow !== null && this.editingCol !== null) {
      const rect = this.renderer.getCellRect(this.editingRow, this.editingCol);
      // Hide if cell is under the header or out of bounds
      if (
        !rect ||
        rect.x < this.rowHeader ||
        rect.y < this.colHeader
      ) {
        this.input.style.display = 'none';
        return;
      }
      // Show and focus input if cell is visible
      this.input.style.display = 'block';
      this.input.style.left = `${rect.x}px`;
      this.input.style.top = `${rect.y + 50}px`;
      this.input.style.width = `${rect.w - 1}px`;
      this.input.style.height = `${rect.h - 1}px`;
      this.input.value = this.grid.getCell(this.editingRow, this.editingCol);
      this.input.focus();
      this.input.select();
    }
  }

  /**
   * Attaches mouse and keyboard events for grid interaction and editing.
   */
  attachEvents() {
    this.addRowBtn.addEventListener('click', () => {
      console.log("hello");
      if (this.selectedHeader && this.selectedHeader.type === 'row') {
        this.insertRowAt(this.selectedHeader.idx);
        this.selection.selectRow(this.selectedHeader.idx);
        this.renderer.render();
        this.hideEditor();
        // Optionally, reset selection and disable button
        this.selectedHeader = null;
        this.addRowBtn.disabled = true;
      }
    });
    this.addColBtn.addEventListener('click', () => {
      if (this.selectedHeader && this.selectedHeader.type === 'col') {
        this.insertColAt(this.selectedHeader.idx);
        this.selection.selectCol(this.selectedHeader.idx);
        this.renderer.render();
        this.hideEditor();
        // Optionally, reset selection and disable button
        this.selectedHeader = null;
        this.addColBtn.disabled = true;
      }
    });
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Row header click
      if (x < this.rowHeader && y > this.colHeader) {
        const cell = this.renderer.getCellAt(this.rowHeader + 1, y);
        if (cell) {
          this.selectedHeader = { type: 'row', idx: cell.row };
          this.addRowBtn.disabled = false;
          this.addColBtn.disabled = true;
          this.selection.selectRow(cell.row);
          this.renderer.render();
          this.computeAndShowStats(cell.row, cell.row, 0, this.cols - 1);
          this.hideEditor();
        }
        return;
      }
      // Column header click
      if (y < this.colHeader && x > this.rowHeader) {
        const cell = this.renderer.getCellAt(x, this.colHeader + 1);
        if (cell) {
          this.selectedHeader = { type: 'col', idx: cell.col };
          this.addColBtn.disabled = false;
          this.addRowBtn.disabled = true;
          this.selection.selectCol(cell.col);
          this.renderer.render();
          this.computeAndShowStats(0, this.rows - 1, cell.col, cell.col); this.hideEditor();
        }
        return;
      }

      // Normal cell click
      this.selectedHeader = null;
      this.addRowBtn.disabled = true;
      this.addColBtn.disabled = true;
      const cell = this.renderer.getCellAt(x, y);
      if (cell) {
        this.selection.clearMulti();
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

    // --- Multi-row selection ---
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < this.rowHeader && y > this.colHeader) {
        const cell = this.renderer.getCellAt(this.rowHeader + 1, y);
        if (cell) {
          this.isSelectingRows = true;
          this.startRow = cell.row;
          this.selection.clearMulti();
          this.selection.setRows([cell.row]);
          this.renderer.render();
        }
      }
      if (y < this.colHeader && x > this.rowHeader) {
        const cell = this.renderer.getCellAt(x, this.colHeader + 1);
        if (cell) {
          this.isSelectingCols = true;
          this.startCol = cell.col;
          this.selection.clearMulti();
          this.selection.setCols([cell.col]);
          this.renderer.render();
        }
      }
    });

    // --- Mousemove for drag selection ---
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isSelectingRows) {
        const rect = this.canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const cell = this.renderer.getCellAt(this.rowHeader + 1, y);
        if (cell) {
          let from = Math.min(this.startRow, cell.row);
          let to = Math.max(this.startRow, cell.row);
          let rows = [];
          for (let r = from; r <= to; r++) rows.push(r);
          this.selection.setRows(rows);
          this.renderer.render();
        }
      }
      if (this.isSelectingCols) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const cell = this.renderer.getCellAt(x, this.colHeader + 1);
        if (cell) {
          let from = Math.min(this.startCol, cell.col);
          let to = Math.max(this.startCol, cell.col);
          let cols = [];
          for (let c = from; c <= to; c++) cols.push(c);
          this.selection.setCols(cols);
          this.renderer.render();
        }
      }
    });

    // --- Mouseup to finish selection ---
    window.addEventListener('mouseup', () => {
      this.isSelectingRows = false;
      this.isSelectingCols = false;
    });

    document.getElementById('json-upload').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();

      reader.readAsText(file);
    });
  }

  /**
   * Shows the cell editor input for the specified cell.
   * @param {number} row The row index.
   * @param {number} col The column index.
   */
  showEditor(row, col) {
    const rect = this.renderer.getCellRect(row, col);
    // Hide if cell is under the header or out of bounds
    if (
      !rect ||
      rect.x < this.rowHeader ||
      rect.y < this.colHeader
    ) {
      this.input.style.display = 'none';
      return;
    }
    this.editingRow = row;
    this.editingCol = col;
    this.input.style.display = 'block';
    this.input.style.left = `${rect.x}px`;
    this.input.style.top = `${rect.y + 50}px`;
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

  }

  /**
   * Saves the value from the cell editor input to the grid.
   */
  saveEditor() {
    if (this.editingRow !== null && this.editingCol !== null) {
      const oldValue = this.grid.getCell(this.editingRow, this.editingCol);
      const newValue = this.input.value;
      if (oldValue !== newValue) {
        const cmd = new SetCellCommand(
          this.grid,
          this.editingRow,
          this.editingCol,
          newValue,
          this.renderer
        );
        this.commandManager.execute(cmd);
      } else {
        this.renderer.render();
      }
    }
  }



  /**
   * Compute and display stats for selected cells (count, min, max, sum, avg).
   * Count includes all selected cells, others only numeric.
   */
  computeAndShowStats(r1, r2, c1, c2) {
    let totalCount = 0;
    let values = [];
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        totalCount++;
        let v = this.grid.getCell(r, c);
        let num = parseFloat(v);
        if (!isNaN(num)) values.push(num);
      }
    }
    if (values.length > 0) {
      let min = Math.min(...values);
      let max = Math.max(...values);
      let sum = values.reduce((a, b) => a + b, 0);
      let avg = sum / values.length;
      this.statsBar.innerHTML =
        `<b>Count:</b> ${totalCount} &nbsp; <b>Min:</b> ${min} &nbsp; <b>Max:</b> ${max} &nbsp; <b>Sum:</b> ${sum} &nbsp; <b>Avg:</b> ${avg.toFixed(2)}`;
    } else {
      this.statsBar.innerHTML = `<b>Count:</b> ${totalCount}`;
    }
  }
}



export default ExcelGrid;
