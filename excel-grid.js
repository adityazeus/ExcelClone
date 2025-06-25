class GridData {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.data = new Map(); // key: "r,c", value: cell value
  }
  getCell(r, c) {
    return this.data.get(`${r},${c}`) || '';
  }
  setCell(r, c, value) {
    if (value) this.data.set(`${r},${c}`, value);
    else this.data.delete(`${r},${c}`);
  }
}

class GridCell {
  constructor(row, col, value = '') {
    this.row = row;
    this.col = col;
    this.value = value;
  }

}

class GridSelection {
  constructor() {
    this.row = -1;
    this.col = -1;
    this.selectedRow = null; // Add this
    this.selectedCol = null; // Add this
  }
  set(row, col) {
    this.row = row;
    this.col = col;
    this.selectedRow = null;
    this.selectedCol = null;
  }
  selectRow(row) {
    this.selectedRow = row;
    this.selectedCol = null;
    this.row = -1;
    this.col = -1;
  }
  selectCol(col) {
    this.selectedCol = col;
    this.selectedRow = null;
    this.row = -1;
    this.col = -1;
  }
}

class GridRange {
  constructor() {
    this.start = null;
    this.end = null;
  }
  set(start, end) {
    this.start = start;
    this.end = end;
  }
}

class GridRenderer {
  constructor(canvas, grid, selection, cellWidth, cellHeight, rowHeader, colHeader, onScroll, gridCell) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.grid = grid;
    this.gridCell = gridCell;
    this.selection = selection;
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    this.rowHeader = rowHeader;
    this.colHeader = colHeader;
    this.scrollX = 0;
    this.scrollY = 0;
    this.visibleRows = 0;
    this.visibleCols = 0;
    this.onScroll = onScroll;
    this.attachScroll();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initScrollbar();
  }

  resize() {
    let dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth*dpr;
    this.canvas.height = window.innerHeight*dpr;
    this.ctx.scale(dpr, dpr);
    this.visibleRows = Math.ceil((this.canvas.height - this.colHeader - 16) / this.cellHeight); // 16px for scrollbar
    this.visibleCols = Math.ceil((this.canvas.width - this.rowHeader) / this.cellWidth);
    this.updateScrollbar();
    this.render();
  }

  attachScroll() {
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // Horizontal scroll
        this.scrollX += Math.sign(e.deltaX || e.deltaY) * 30;
        this.scrollX = Math.max(0, Math.min(this.scrollX, this.maxScrollX()));
        this.updateScrollbar();
      } else {
        // Vertical scroll
        this.scrollY += Math.sign(e.deltaY) * 30;
        this.scrollY = Math.max(0, Math.min(this.scrollY, this.maxScrollY()));
      }
      if (this.onScroll) this.onScroll();
      this.render();
    });
  }

  maxScrollX() {
    return Math.max(0, this.grid.cols * this.cellWidth - (this.canvas.width - this.rowHeader));
  }
  maxScrollY() {
    return Math.max(0, this.grid.rows * this.cellHeight - (this.canvas.height - this.colHeader - 16));
  }

  // --- Horizontal Scrollbar ---
  initScrollbar() {
    this.hScrollbar = document.getElementById('h-scrollbar');
    this.hThumb = document.getElementById('h-thumb');
    this.dragging = false;
    this.dragStartX = 0;
    this.scrollStartX = 0;

    this.hThumb.addEventListener('mousedown', (e) => {
      this.dragging = true;
      this.dragStartX = e.clientX;
      this.scrollStartX = this.scrollX;
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (this.dragging) {
        const dx = e.clientX - this.dragStartX;
        const trackWidth = this.hScrollbar.offsetWidth - this.hThumb.offsetWidth;
        const maxScroll = this.maxScrollX();
        this.scrollX = Math.max(0, Math.min(this.scrollStartX + dx * (maxScroll / trackWidth), maxScroll));
        this.updateScrollbar();
        this.render();
      }
    });

    window.addEventListener('mouseup', () => {
      this.dragging = false;
      document.body.style.userSelect = '';
    });

    this.hScrollbar.addEventListener('click', (e) => {
      if (e.target === this.hThumb) return;
      const rect = this.hScrollbar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const thumbWidth = this.hThumb.offsetWidth;
      const trackWidth = this.hScrollbar.offsetWidth - thumbWidth;
      const maxScroll = this.maxScrollX();
      this.scrollX = Math.max(0, Math.min((clickX - thumbWidth / 2) * (maxScroll / trackWidth), maxScroll));
      this.updateScrollbar();
      this.render();
    });
  }

  updateScrollbar() {
    if (!this.hScrollbar || !this.hThumb) return;
    const totalWidth = this.grid.cols * this.cellWidth;
    const visibleWidth = this.canvas.width - this.rowHeader;
    const trackWidth = this.hScrollbar.offsetWidth;
    const maxScroll = this.maxScrollX();

    // Thumb size and position
    let thumbWidth = Math.max(30, (visibleWidth / totalWidth) * trackWidth);
    let thumbLeft = maxScroll === 0 ? 0 : (this.scrollX / maxScroll) * (trackWidth - thumbWidth);
    if (!isFinite(thumbLeft)) thumbLeft = 0;

    this.hThumb.style.width = thumbWidth + 'px';
    this.hThumb.style.left = thumbLeft + 'px';
    if (this.onScroll) this.onScroll();
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw column headers (allow partial column at right)
    let startCol = Math.floor(this.scrollX / this.cellWidth);
    let offsetX = this.scrollX % this.cellWidth;
    let totalCols = Math.ceil((this.canvas.width - this.rowHeader) / this.cellWidth);
    // let totalCols = Math.ceil((this.canvas.width - this.rowHeader + offsetX) / this.cellWidth);

    for (let c = 0; c < totalCols; c++) {
      let colIdx = startCol + c;
      let x = this.rowHeader + c * this.cellWidth;
      // Highlight column header if a row is selected and no column is selected


      if (this.selection.selectedRow !== null && this.selection.selectedCol === null) {
        ctx.save();
        ctx.fillStyle = '#D0F0D0'; // light green
        ctx.fillRect(x, 0, this.cellWidth, this.colHeader);
        ctx.restore();
      } else {
        ctx.fillStyle = '#E6E6E6';
        ctx.fillRect(x, 0, this.cellWidth, this.colHeader);
      }
      if(this.selection.col === colIdx) {
        ctx.save();
        ctx.fillStyle = '#D0F0D0'; // light green
        ctx.fillRect(x, 0, this.cellWidth, this.colHeader);
        ctx.restore();
        //border bottom
        ctx.save();
        ctx.strokeStyle = '#107C41'; // or any color you want for the border
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, this.colHeader);
        ctx.lineTo(x+this.cellWidth, this.colHeader);
        ctx.stroke();
        ctx.restore();
      }

      // Only top and right borders
      ctx.strokeStyle = "#ccc";
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + this.cellWidth, 0); // top
      ctx.moveTo(x + this.cellWidth, 0);
      ctx.lineTo(x + this.cellWidth, this.colHeader); // right
      ctx.stroke();
      ctx.font = "12px Arial";
      ctx.fillStyle = '#333';
      ctx.fillText(this.colToName(colIdx), x + 5, this.colHeader / 2 + 5);
    }

    // Draw row headers (allow partial row at bottom)
    let startRow = Math.floor(this.scrollY / this.cellHeight);
    let offsetY = this.scrollY % this.cellHeight;
    let totalRows = Math.ceil((this.canvas.height - this.colHeader - 16) / this.cellHeight);
    // let totalRows = Math.ceil((this.canvas.height - this.colHeader - 16 + offsetY) / this.cellHeight);

    for (let r = 0; r < totalRows; r++) {
      let rowIdx = startRow + r;
      let y = this.colHeader + r * this.cellHeight;
      // Highlight row header if a column is selected and no row is selected


      if (this.selection.selectedCol !== null && this.selection.selectedRow === null) {
        ctx.save();
        ctx.fillStyle = '#D0F0D0'; // light green
        ctx.fillRect(0, y, this.rowHeader, this.cellHeight);
        ctx.restore();
      } else {
        ctx.fillStyle = '#E6E6E6';
        ctx.fillRect(0, y, this.rowHeader, this.cellHeight);
      }

      // Only top and right borders
      if (this.selection.row === rowIdx) {
        ctx.save();
        ctx.fillStyle = '#CAEAD8'; // light green
        ctx.fillRect(0, y, this.cellWidth, this.colHeader);
        ctx.restore();
        //Border bottom
        ctx.save();
        ctx.strokeStyle = '#107C41'; // or any color you want for the border
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y + this.cellHeight);
        ctx.lineTo(this.rowHeader, y + this.cellHeight);
        ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = "#ccc";
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.rowHeader, y); // top
      ctx.moveTo(this.rowHeader, y);
      ctx.lineTo(this.rowHeader, y + this.cellHeight); // right
      ctx.stroke();

      ctx.fillStyle = '#333';
      ctx.fillText(rowIdx + 1, 5, y + this.cellHeight / 2 + 5);
    }

    // Draw cells (allow partial columns/rows)
    for (let r = 0; r < totalRows; r++) {
      let rowIdx = startRow + r;
      let y = this.colHeader + r * this.cellHeight;
      for (let c = 0; c < totalCols; c++) {
        let colIdx = startCol + c;
        let x = this.rowHeader + c * this.cellWidth;

        // 1. Fill background or highlight
        if (
          (this.selection.selectedRow !== null && rowIdx === this.selection.selectedRow) ||
          (this.selection.selectedCol !== null && colIdx === this.selection.selectedCol)
        ) {
          ctx.save();
          ctx.fillStyle = '#D0F0D0'; // light green highlight
          ctx.fillRect(x, y, this.cellWidth, this.cellHeight);
          ctx.restore();
        } else {
          ctx.fillStyle = '#fff';
          ctx.fillRect(x, y, this.cellWidth, this.cellHeight);
        }

        // 2. Draw value (after background)
        ctx.fillStyle = '#222';
        let value = this.grid.getCell(rowIdx, colIdx);
        ctx.fillText(value, x + 5, y + this.cellHeight / 2 + 5);


        // 3.Draw Cell Borders
        ctx.strokeStyle = "#ccc";
        ctx.beginPath();
        ctx.lineWidth = .2;
        ctx.moveTo(x, y);
        ctx.lineTo(x + this.cellWidth, y); // top
        ctx.moveTo(x + this.cellWidth, y);
        ctx.lineTo(x + this.cellWidth, y + this.cellHeight); // right
        ctx.stroke();

        // Draw selection
        if (rowIdx === this.selection.row && colIdx === this.selection.col) {
          ctx.save();
          ctx.strokeStyle = '#227447';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, this.cellWidth, this.cellHeight);
          ctx.restore();
        }
      }
    }
  }

  colToName(n) {
    let name = '';
    do {
      name = String.fromCharCode(65 + (n % 26)) + name;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return name;
  }

  getCellRect(row, col) {
    const startRow = Math.floor(this.scrollY / this.cellHeight);
    const startCol = Math.floor(this.scrollX / this.cellWidth);
    const offsetX = this.scrollX % this.cellWidth;
    const offsetY = this.scrollY % this.cellHeight;
    const r = row - startRow;
    const c = col - startCol;
    if (r < 0 || c < 0) return null;
    const x = this.rowHeader + c * this.cellWidth;
    // const x = this.rowHeader + c * this.cellWidth - offsetX;
    const y = this.colHeader + r * this.cellHeight;
    // const y = this.colHeader + r * this.cellHeight - offsetY;
    if (
      x + this.cellWidth < this.rowHeader ||
      y + this.cellHeight < this.colHeader ||
      x > this.canvas.width ||
      y > this.canvas.height
    ) return null;
    return {
      x: x,
      y: y,
      w: this.cellWidth,
      h: this.cellHeight
    };
  }

  getCellAt(x, y) {
    if (x < this.rowHeader || y < this.colHeader) return null;
    const startCol = Math.floor(this.scrollX / this.cellWidth);
    const startRow = Math.floor(this.scrollY / this.cellHeight);
    const offsetX = this.scrollX % this.cellWidth;
    const offsetY = this.scrollY % this.cellHeight;
    const col = Math.floor((x - this.rowHeader) / this.cellWidth) + startCol;
    // const col = Math.floor((x - this.rowHeader + offsetX) / this.cellWidth) + startCol;
    const row = Math.floor((y - this.colHeader) / this.cellHeight) + startRow;
    // const row = Math.floor((y - this.colHeader + offsetY) / this.cellHeight) + startRow;
    if (row >= this.grid.rows || col >= this.grid.cols) return null;
    return { row, col };
  }
}

class ExcelGrid {
  constructor(canvas, input) {
    this.rows = 100000;
    this.cols = 1000;
    this.cellWidth = 64;
    this.cellHeight = 20;
    this.rowHeader = 40;
    this.colHeader = 24;
    this.editingRow = null;
    this.editingCol = null;
    this.hideEditor = this.hideEditor.bind(this);
    this.grid = new GridData(this.rows, this.cols);
    this.selection = new GridSelection();
    this.range = new GridRange();
    this.gridCell = new GridCell(0, 0);
    this.renderer = new GridRenderer(canvas, this.grid, this.selection, this.cellWidth, this.cellHeight, this.rowHeader, this.colHeader, () => this.updateEditorPosition(), this.gridCell);
    this.canvas = canvas;
    this.input = input;
    this.attachEvents();
    this.renderer.render();
  }
  updateEditorPosition() {
    if (this.editingRow !== null && this.editingCol !== null) {
      const rect = this.renderer.getCellRect(this.editingRow, this.editingCol);
      if (rect) {
        this.input.style.display = 'block';
        this.input.style.left = `${rect.x}px`;
        this.input.style.top = `${rect.y}px`;
        this.input.style.width = `${rect.w - 1}px`;
        this.input.style.height = `${rect.h - 1}px`;
      } else {
        this.input.style.display = 'none';
      }
    }
  }

  attachEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Row header click
      if (x < this.rowHeader && y > this.colHeader) {
        const row = Math.floor((y - this.colHeader) / this.cellHeight) + Math.floor(this.renderer.scrollY / this.cellHeight);
        this.selection.selectRow(row);
        this.renderer.render();
        this.hideEditor();
        return;
      }
      // Column header click
      if (y < this.colHeader && x > this.rowHeader) {
        const col = Math.floor((x - this.rowHeader) / this.cellWidth) + Math.floor(this.renderer.scrollX / this.cellWidth);
        this.selection.selectCol(col);
        this.renderer.render();
        this.hideEditor();
        return;
      }

      // Normal cell click
      const cell = this.renderer.getCellAt(x, y);
      if (cell) {
        this.selection.set(cell.row, cell.col);
        this.renderer.render();
        this.hideEditor();
      } else {
        this.hideEditor();
      }
    });

    this.canvas.addEventListener('dblclick', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cell = this.renderer.getCellAt(x, y);
      if (cell) {
        this.selection.set(cell.row, cell.col);
        this.renderer.render();
        this.showEditor(cell.row, cell.col);
      }
    });

    this.input.addEventListener('blur', () => {
      this.saveEditor();
      this.hideEditor();
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.saveEditor();
        this.hideEditor();
      }
    });
  }
  showEditor(row, col) {
    const rect = this.renderer.getCellRect(row, col);
    if (!rect) return;
    this.editingRow = row;
    this.editingCol = col;
    this.input.style.display = 'block';
    this.input.style.left = `${rect.x}px`;
    this.input.style.top = `${rect.y}px`;
    this.input.style.width = `${rect.w - 1}px`;
    this.input.style.height = `${rect.h - 1}px`;
    this.input.value = this.grid.getCell(row, col);
    this.input.focus();
    this.input.select();
  }
  hideEditor() {
    this.input.style.display = 'none';
    this.editingRow = null;
    this.editingCol = null;
  }
  saveEditor() {
    if (this.editingRow !== null && this.editingCol !== null) {
      this.grid.setCell(this.editingRow, this.editingCol, this.input.value);
      this.renderer.render();
    }
  }
}

window.onload = function () {
  const canvas = document.getElementById('excel-canvas');
  const input = document.getElementById('cell-editor');
  new ExcelGrid(canvas, input);
};