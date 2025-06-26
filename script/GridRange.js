/**
 * Represents a range of cells in the grid.
 */
class GridRange {
  /**
   * Initializes the GridRange object.
   */
  constructor() {
    /** @type {?any} The start of the range. */
    this.start = null;
    /** @type {?any} The end of the range. */
    this.end = null;
  }

  /**
   * Sets the start and end of the range.
   * @param {any} start The start of the range.
   * @param {any} end The end of the range.
   */
  set(start, end) {
    this.start = start;
    this.end = end;
  }
}

export default GridRange;