class GridRenderer {
  /**
   * Initializes the GridRenderer object.
   * @param {HTMLCanvasElement} canvas The canvas element to render on.
   * @param {GridData} grid The grid data object.
   * @param {GridSelection} selection The selection state object.
   * @param {number} cellWidth The width of each cell.
   * @param {number} cellHeight The height of each cell.
   * @param {number} rowHeader The width of the row header.
   * @param {number} colHeader The height of the column header.
   * @param {Function} onScroll Callback for scroll events.
   * @param {GridCell} gridCell The grid cell object.
   */
  constructor(canvas, grid, selection, cellWidth, cellHeight, rowHeader, colHeader, onScroll, gridCell) {
    /** @type {HTMLCanvasElement} The canvas element for rendering. */
    this.canvas = canvas;
    /** @type {CanvasRenderingContext2D} The 2D rendering context. */
    this.ctx = canvas.getContext('2d');
    /** @type {GridData} The grid data object. */
    this.grid = grid;
    /** @type {GridCell} The grid cell object. */
    this.gridCell = gridCell;
    /** @type {GridSelection} The selection state object. */
    this.selection = selection;
    /** @type {number} The width of each cell. */
    this.cellWidth = cellWidth;
    /** @type {number} The height of each cell. */
    this.cellHeight = cellHeight;
    /** @type {number} The width of the row header. */
    this.rowHeader = rowHeader;
    /** @type {number} The height of the column header. */
    this.colHeader = colHeader;
    /** @type {number} The current horizontal scroll offset. */
    this.scrollX = 0;
    /** @type {number} The current vertical scroll offset. */
    this.scrollY = 0;
    /** @type {number} The number of visible rows. */
    this.visibleRows = 0;
    /** @type {number} The number of visible columns. */
    this.visibleCols = 0;
    /** @type {Function} Callback for scroll events. */
    this.onScroll = onScroll;
    this.attachScroll();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initScrollbar();
  }

  /**
   * Resizes the canvas and updates visible rows/columns.
   */
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

  /**
   * Attaches scroll event listeners to the canvas.
   */
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

  /**
   * Calculates the maximum horizontal scroll value.
   * @returns {number} The maximum horizontal scroll offset.
   */
  maxScrollX() {
    return Math.max(0, this.grid.cols * this.cellWidth - (this.canvas.width - this.rowHeader));
  }

  /**
   * Calculates the maximum vertical scroll value.
   * @returns {number} The maximum vertical scroll offset.
   */
  maxScrollY() {
    return Math.max(0, this.grid.rows * this.cellHeight - (this.canvas.height - this.colHeader - 16));
  }

  // --- Horizontal Scrollbar ---
  /**
   * Initializes the horizontal scrollbar and its events.
   */
  initScrollbar() {
    /** @type {HTMLElement} The horizontal scrollbar element. */
    this.hScrollbar = document.getElementById('h-scrollbar');
    /** @type {HTMLElement} The horizontal scrollbar thumb element. */
    this.hThumb = document.getElementById('h-thumb');
    /** @type {boolean} Whether the scrollbar thumb is being dragged. */
    this.dragging = false;
    /** @type {number} The X position where dragging started. */
    this.dragStartX = 0;
    /** @type {number} The scroll offset when dragging started. */
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

  /**
   * Updates the horizontal scrollbar thumb size and position.
   */
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

  /**
   * Renders the grid, headers, cells, and selection highlights.
   */
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw column headers (allow partial column at right)
    let startCol = Math.floor(this.scrollX / this.cellWidth);
    let offsetX = this.scrollX % this.cellWidth;
    let totalCols = Math.ceil((this.canvas.width - this.rowHeader) / this.cellWidth);

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
        ctx.strokeStyle = '#107C41';
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
        ctx.lineWidth = 1;
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

  /**
   * Converts a column index to its spreadsheet-style name (A, B, ..., AA, AB, ...).
   * @param {number} n The column index.
   * @returns {string} The column name.
   */
  colToName(n) {
    let name = '';
    do {
      name = String.fromCharCode(65 + (n % 26)) + name;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return name;
  }

  /**
   * Gets the rectangle for a given cell in canvas coordinates.
   * @param {number} row The row index.
   * @param {number} col The column index.
   * @returns {?{x: number, y: number, w: number, h: number}} The cell rectangle or null if out of bounds.
   */
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

  /**
   * Gets the cell indices at a given canvas coordinate.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @returns {?{row: number, col: number}} The cell indices or null if out of bounds.
   */
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

export default GridRenderer;