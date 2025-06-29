/**
 * Manages the selection state for grid cells, rows, and columns.
 */
class GridSelection {
  /**
   * Initializes the GridSelection object.
   * @constructor
   */
  constructor() {
    /** @type {number} The currently selected cell's row index, or -1 if none */
    this.row = -1;
    /** @type {number} The currently selected cell's column index, or -1 if none */
    this.col = -1;
    /** @type {?number} The currently selected row index for row selection, or null if none */
    this.selectedRow = null;
    /** @type {?number} The currently selected column index for column selection, or null if none */
    this.selectedCol = null;
    /** @type {Array<number>} The currently selected rows */
    this.selectedRows = [];
    /** @type {Array<number>} The currently selected columns */
    this.selectedCols = [];
  }

  /**
   * Sets the selection to a specific cell and clears row/column selection.
   * @param {number} row The row index of the selected cell.
   * @param {number} col The column index of the selected cell.
   */
  set(row, col) {
    this.row = row;
    this.col = col;
    this.selectedRow = null;
    this.selectedCol = null;
  }

  /**
   * Selects an entire row and clears cell and column selection.
   * @param {number} row The row index to select.
   */
  selectRow(row) {
    this.selectedRow = row;
    this.selectedCol = null;
    this.row = -1;
    this.col = -1;
  }

  /**
   * Selects an entire column and clears cell and row selection.
   * @param {number} col The column index to select.
   */
  selectCol(col) {
    this.selectedCol = col;
    this.selectedRow = null;
    this.row = -1;
    this.col = -1;
  }

  /**
   * Sets multiple rows as selected.
   * @param {Array<number>} rows The array of row indices to select.
   */
  setRows(rows) {
    this.selectedRows = rows.slice();
    this.selectedRow = null;
    this.selectedCol = null;
    this.row = -1;
    this.col = -1;
  }

  /**
   * Sets multiple columns as selected.
   * @param {Array<number>} cols The array of column indices to select.
   */
  setCols(cols) {
    this.selectedCols = cols.slice();
    this.selectedRow = null;
    this.selectedCol = null;
    this.row = -1;
    this.col = -1;
  }

  /**
   * Clears the selection of multiple rows and columns.
   */
  clearMulti() {
    this.selectedRows = [];
    this.selectedCols = [];
  }
}

export default GridSelection;