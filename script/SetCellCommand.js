/**
 * @class SetCellCommand
 * @classdesc
 * Command for setting a cell's value in the grid. Supports undo and redo.
 */
class SetCellCommand {
  /**
   * @constructor
   * @param {Object} grid - The grid data object.
   * @param {number} row - The row index of the cell.
   * @param {number} col - The column index of the cell.
   * @param {any} newValue - The new value to set in the cell.
   * @param {Object} renderer - The renderer object for re-rendering the grid.
   */
  constructor(grid, row, col, newValue, renderer) {
    this.grid = grid;
    this.row = row;
    this.col = col;
    this.newValue = newValue;
    this.oldValue = grid.getCell(row, col);
    this.renderer = renderer;
  }

  /**
   * Executes the cell value change (redo).
   */
  execute() {
    this.grid.setCell(this.row, this.col, this.newValue);
    if (this.renderer) this.renderer.render();
  }

  /**
   * Undoes the cell value change.
   */
  undo() {
    this.grid.setCell(this.row, this.col, this.oldValue);
    if (this.renderer) this.renderer.render();
  }
}

export default SetCellCommand;