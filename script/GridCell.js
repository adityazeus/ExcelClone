/**
 * Represents a single cell in the grid.
 */
class GridCell {
  /**
   * Initializes the GridCell object.
   * @param {number} row The row index of the cell.
   * @param {number} col The column index of the cell.
   * @param {string} [value=''] The value of the cell.
   */
  constructor(row, col, value = '') {
    /** @type {number} The row index of the cell. */
    this.row = row;
    /** @type {number} The column index of the cell. */
    this.col = col;
    /** @type {string} The value of the cell. */
    this.value = value;
  }
}

export default GridCell;