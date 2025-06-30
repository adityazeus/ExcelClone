class SetCellCommand {
  constructor(grid, row, col, newValue, renderer) {
    this.grid = grid;
    this.row = row;
    this.col = col;
    this.newValue = newValue;
    this.oldValue = grid.getCell(row, col);
    this.renderer = renderer;
  }

  execute() {
    this.grid.setCell(this.row, this.col, this.newValue);
    if (this.renderer) this.renderer.render();
  }

  undo() {
    this.grid.setCell(this.row, this.col, this.oldValue);
    if (this.renderer) this.renderer.render();
  }
}

export default SetCellCommand;