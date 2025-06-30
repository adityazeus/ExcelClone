class ResizeRowCommand {
  constructor(grid, rowHeights, row, oldHeight, newHeight, renderer) {
    this.grid = grid;
    this.rowHeights = rowHeights;
    this.row = row;
    this.oldHeight = oldHeight;
    this.newHeight = newHeight;
    this.renderer = renderer;
  }
  execute() {
    this.rowHeights[this.row] = this.newHeight;
    if (this.renderer) this.renderer.render();
  }
  undo() {
    this.rowHeights[this.row] = this.oldHeight;
    if (this.renderer) this.renderer.render();
  }
}
export default ResizeRowCommand;