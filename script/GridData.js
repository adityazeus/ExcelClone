/**
 * Manages the grid's cell data.
 */
class GridData {
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
}

export default GridData;