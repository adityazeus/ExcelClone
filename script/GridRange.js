/**
 * Represents a range of cells in the grid.
 */
class GridRange {
  /**
   * Initializes the GridRange object.
   */
  constructor() {
    /** @type {number} The start of the range. */
    this.start = -1;
    /** @type {number} The end of the range. */
    this.end = -1;
  }

  /**
   * Sets the start and end of the range.
   * @param {number} start The start of the range.
   * @param {number} end The end of the range.
   */
  set(start, end) {
    this.start = start;
    this.end = end;
  }
}

export default GridRange;