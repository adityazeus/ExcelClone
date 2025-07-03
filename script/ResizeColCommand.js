/**
 * @class ResizeColCommand
 * @classdesc
 * Command for resizing a column in the grid. Supports undo and redo.
 */
class ResizeColCommand {
  /**
   * @constructor
   * @param {Object} grid - The grid data object.
   * @param {Array<number>} colWidths - Array of column widths.
   * @param {number} col - The index of the column to resize.
   * @param {number} oldWidth - The previous width of the column.
   * @param {number} newWidth - The new width to set for the column.
   * @param {Object} renderer - The renderer object for re-rendering the grid.
   */
  constructor(grid, colWidths, col, oldWidth, newWidth, renderer) {
    this.grid = grid;
    this.colWidths = colWidths;
    this.col = col;
    this.oldWidth = oldWidth;
    this.newWidth = newWidth;
    this.renderer = renderer;
  }
  /**
   * Executes the column resize (redo).
   */
  execute() {
    this.colWidths[this.col] = this.newWidth;
    if (this.renderer) this.renderer.render();
  }
  /**
   * Undoes the column resize.
   */
  undo() {
    this.colWidths[this.col] = this.oldWidth;
    if (this.renderer) this.renderer.render();
  }
}

export default ResizeColCommand;