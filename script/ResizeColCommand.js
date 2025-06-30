class ResizeColCommand {
  constructor(grid, colWidths, col, oldWidth, newWidth, renderer) {
    this.grid = grid;
    this.colWidths = colWidths;
    this.col = col;
    this.oldWidth = oldWidth;
    this.newWidth = newWidth;
    this.renderer = renderer;
  }
  execute() {
    this.colWidths[this.col] = this.newWidth;
    if (this.renderer) this.renderer.render();
  }
  undo() {
    this.colWidths[this.col] = this.oldWidth;
    if (this.renderer) this.renderer.render();
  }
}
export default ResizeColCommand;