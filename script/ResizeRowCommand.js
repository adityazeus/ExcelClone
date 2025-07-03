/**
 * @class ResizeRowCommand
 * @classdesc
 * Command for resizing a row in the grid. Supports undo and redo.
 */
class ResizeRowCommand {
  /**
   * @constructor
   * @param {Object} grid - The grid data object.
   * @param {Array<number>} rowHeights - Array of row heights.
   * @param {number} row - The index of the row to resize.
   * @param {number} oldHeight - The previous height of the row.
   * @param {number} newHeight - The new height to set for the row.
   * @param {Object} renderer - The renderer object for re-rendering the grid.
   */
  constructor(grid, rowHeights, row, oldHeight, newHeight, renderer) {
    this.grid = grid;
    this.rowHeights = rowHeights;
    this.row = row;
    this.oldHeight = oldHeight;
    this.newHeight = newHeight;
    this.renderer = renderer;
  }
  /**
   * Executes the row resize (redo).
   */
  execute() {
    this.rowHeights[this.row] = this.newHeight;
    if (this.renderer) this.renderer.render();
  }
  /**
   * Undoes the row resize.
   */
  undo() {
    this.rowHeights[this.row] = this.oldHeight;
    if (this.renderer) this.renderer.render();
  }
}

export default ResizeRowCommand;