/**
 * Manages the grid's cell data.
 */
class GridData {
  /**
   * Inserts a new row at the specified index.
   * @param {number} rowIndex The index at which to insert the row.
   */
  insertRow(rowIndex) {
    const newData = new Map();
    for (const [key, value] of this.data.entries()) {
      const [r, c] = key.split(',').map(Number);
      if (r >= rowIndex) {
        newData.set(`${r + 1},${c}`, value);
      } else {
        newData.set(key, value);
      }
    }
    this.data = newData;
    this.rows++;
  }

  /**
   * Inserts a new column at the specified index.
   * @param {number} colIndex The index at which to insert the column.
   */
  insertCol(colIndex) {
    const newData = new Map();
    for (const [key, value] of this.data.entries()) {
      const [r, c] = key.split(',').map(Number);
      if (c >= colIndex) {
        newData.set(`${r},${c + 1}`, value);
      } else {
        newData.set(key, value);
      }
    }
    this.data = newData;
    this.cols++;
  }
  /**
   * Initializes the GridData object.
   * @param {number} rows The number of rows in the grid.
   * @param {number} cols The number of columns in the grid.
   */
  constructor(rows, cols) {
    /** @type {number} The number of rows in the grid. */
    this.rows = rows;
    /** @type {number} The number of columns in the grid. */
    this.cols = cols;
    /** @type {Map<string, string>} Stores cell values with key as "row,col". */
    this.data = new Map(); // key: "r,c", value: cell value
  }

  /**
   * Gets the value of a cell.
   * @param {number} r The row index.
   * @param {number} c The column index.
   * @returns {string} The value of the cell, or empty string if not set.
   */
  getCell(r, c) {
    return this.data.get(`${r},${c}`) || '';
  }

  /**
   * Sets the value of a cell.
   * @param {number} r The row index.
   * @param {number} c The column index.
   * @param {string} value The value to set.
   */
  setCell(r, c, value) {
    if (value) this.data.set(`${r},${c}`, value);
    else this.data.delete(`${r},${c}`);
  }

  /**
   * Clears the grid data.
   */
  clear() {
    // Remove all data from the grid
    this.data.clear();
  }
}

export default GridData;