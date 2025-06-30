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
  constructor(
    canvas, grid, selection, cellWidth, cellHeight, colWidths, rowHeights,
    rowHeader, colHeader,onScroll, updateEditorPosition, gridCell,
    onColResizeEnd, onRowResizeEnd
  ) {
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
    this.colWidths = colWidths;
    this.rowHeights = rowHeights;
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
    this.onColResizeEnd = onColResizeEnd;
    this.onRowResizeEnd = onRowResizeEnd;
    this.autoScrollInterval = null;
    this.autoScrollEdgeSize = 30; // px from edge to trigger auto-scroll
    this.autoScrollSpeed = 30;    // px per interval
    this.attachScroll();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initScrollbar();
    this.attachResizeEvents();
  }

  /**
   * Resizes the canvas and updates visible rows/columns.
   */
  resize() {
    let dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
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
        this.updateScrollbar(); // <-- Add this line
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
    // --- Horizontal Scrollbar ---
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
      // --- Vertical Thumb Drag ---
      if (this.vDragging) {
        const dy = e.clientY - this.vDragStartY;
        const trackHeight = this.vScrollbar.offsetHeight - this.vThumb.offsetHeight;
        const maxScroll = this.maxScrollY();
        this.scrollY = Math.max(0, Math.min(this.vScrollStartY + dy * (maxScroll / trackHeight), maxScroll));
        this.updateScrollbar();
        this.render();
      }
    });

    window.addEventListener('mouseup', () => {
      this.dragging = false;
      this.vDragging = false;
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

    // --- Vertical Scrollbar ---
    this.vScrollbar = document.getElementById('v-scrollbar');
    this.vThumb = document.getElementById('v-thumb');
    this.vDragging = false;
    this.vDragStartY = 0;
    this.vScrollStartY = 0;

    this.vThumb.addEventListener('mousedown', (e) => {
      this.vDragging = true;
      this.vDragStartY = e.clientY;
      this.vScrollStartY = this.scrollY;
      document.body.style.userSelect = 'none';
    });

    this.vScrollbar.addEventListener('click', (e) => {
      if (e.target === this.vThumb) return;
      const rect = this.vScrollbar.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const thumbHeight = this.vThumb.offsetHeight;
      const trackHeight = this.vScrollbar.offsetHeight - thumbHeight;
      const maxScroll = this.maxScrollY();
      this.scrollY = Math.max(0, Math.min((clickY - thumbHeight / 2) * (maxScroll / trackHeight), maxScroll));
      this.updateScrollbar();
      this.render();
    });
  }
  /**
   * Updates the horizontal scrollbar thumb size and position.
   */
  updateScrollbar() {
    // --- Horizontal Thumb ---
    if (this.hScrollbar && this.hThumb) {
      const totalWidth = this.grid.cols * this.cellWidth;
      const visibleWidth = this.canvas.width - this.rowHeader;
      const trackWidth = this.hScrollbar.offsetWidth;
      const maxScroll = this.maxScrollX();

      let thumbWidth = Math.max(30, (visibleWidth / totalWidth) * trackWidth);
      let thumbLeft = maxScroll === 0 ? 0 : (this.scrollX / maxScroll) * (trackWidth - thumbWidth);
      if (!isFinite(thumbLeft)) thumbLeft = 0;

      this.hThumb.style.width = thumbWidth + 'px';
      this.hThumb.style.left = thumbLeft + 'px';
    }

    // --- Vertical Thumb ---
    if (this.vScrollbar && this.vThumb) {
      const totalHeight = this.grid.rows * this.cellHeight;
      const visibleHeight = this.canvas.height - this.colHeader - 16;
      const trackHeight = this.vScrollbar.offsetHeight;
      const maxScroll = this.maxScrollY();

      let thumbHeight = Math.max(30, (visibleHeight / totalHeight) * trackHeight);
      let thumbTop = maxScroll === 0 ? 0 : (this.scrollY / maxScroll) * (trackHeight - thumbHeight);
      if (!isFinite(thumbTop)) thumbTop = 0;

      this.vThumb.style.height = thumbHeight + 'px';
      this.vThumb.style.top = thumbTop + 'px';
    }

    if (this.onScroll) this.onScroll();
  }




  /**
   * Renders the grid, headers, cells, and selection highlights.
   */
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate visible startCol/startRow and partial scroll offset
    let startCol = 0, accumulatedWidth = 0;
    while (startCol < this.colWidths.length && accumulatedWidth + this.colWidths[startCol] <= this.scrollX) {
      accumulatedWidth += this.colWidths[startCol];
      startCol++;
    }
    let startRow = 0, accumulatedHeight = 0;
    while (startRow < this.rowHeights.length && accumulatedHeight + this.rowHeights[startRow] <= this.scrollY) {
      accumulatedHeight += this.rowHeights[startRow];
      startRow++;
    }
    this.renderCells(ctx, startCol, startRow, accumulatedWidth, accumulatedHeight);
    this.renderRowHeaders(ctx, startRow, accumulatedHeight);
    this.renderColumnHeaders(ctx, startCol, accumulatedWidth);

    ctx.save();
    ctx.fillStyle = '#E6E6E6'; // Same as row/col header color
    ctx.fillRect(0, 0, this.rowHeader, this.colHeader);
    ctx.restore();
  }

  renderColumnHeaders(ctx, startCol, accumulatedWidth) {
    let cx = this.rowHeader - (this.scrollX - accumulatedWidth);
    // --- Multi-cell selection header highlight ---
    let multiCellCols = [];
    if (
      this.multiCellSelection &&
      this.multiCellSelection.startCell &&
      this.multiCellSelection.endCell &&
      (this.multiCellSelection.isSelectingCells ||
        (this.multiCellSelection.startCell.row !== this.multiCellSelection.endCell.row ||
          this.multiCellSelection.startCell.col !== this.multiCellSelection.endCell.col))
    ) {
      const c1 = Math.min(this.multiCellSelection.startCell.col, this.multiCellSelection.endCell.col);
      const c2 = Math.max(this.multiCellSelection.startCell.col, this.multiCellSelection.endCell.col);
      for (let c = c1; c <= c2; c++) multiCellCols.push(c);
    }
    for (let c = startCol; c < this.colWidths.length && cx < this.canvas.width; c++) {
      let colWidth = this.colWidths[c];
      const multiCol = this.selection.selectedCols || [];
      const multiRow = this.selection.selectedRows || [];

      const isSelected = multiCol.includes(c) || (this.selection.selectedRow !== null && this.selection.selectedCol === null);

      // Header background
      if (isSelected) {
        ctx.save();
        ctx.fillStyle = '#107C41'; // selected header color
        ctx.fillRect(cx, 0, colWidth, this.colHeader);
        ctx.restore();
      } else {
        ctx.fillStyle = '#E6E6E6';
        ctx.fillRect(cx, 0, colWidth, this.colHeader);
      }

      const isSelected1 = multiCol.includes(c) || (this.selection.selectedRow !== null && this.selection.selectedCol === null);

      // Highlight column header for multi-cell selection
      if (multiCellCols.includes(c)) {
        ctx.save();
        ctx.fillStyle = '#CAEAD8';
        ctx.fillRect(cx, 0, colWidth, this.colHeader);
        ctx.restore();

        // Only bottom border
        ctx.save();
        ctx.strokeStyle = '#107C41';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, this.colHeader);
        ctx.lineTo(cx + colWidth, this.colHeader);
        ctx.stroke();
        ctx.restore();
      }

      // Border bottom for selected
      if (isSelected1) {
        ctx.save();
        ctx.strokeStyle = '#107C41';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, this.colHeader);
        ctx.lineTo(cx + colWidth, this.colHeader);
        ctx.stroke();
        ctx.restore();
      }

      // Draw left border for first selected column and right border for last selected column (full height)
      if (multiCol.length > 0) {
        const firstCol = Math.min(...multiCol);
        const lastCol = Math.max(...multiCol);
        if (c === firstCol) {
          ctx.save();
          ctx.strokeStyle = '#107C41';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx, 0);
          ctx.lineTo(cx, this.canvas.height);
          ctx.stroke();
          ctx.restore();
        }
        if (c === lastCol) {
          ctx.save();
          ctx.strokeStyle = '#107C41';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx + colWidth, 0);
          ctx.lineTo(cx + colWidth, this.canvas.height);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Highlight col header when a row or multiple rows are selected (but not columns)
      if (
        multiRow.length > 0 &&
        multiCol.length === 0
      ) {
        ctx.save();
        ctx.fillStyle = '#CAEAD8';
        ctx.fillRect(cx, 0, colWidth, this.colHeader);
        ctx.restore();

        // Bottom border
        ctx.save();
        ctx.strokeStyle = '#107C41';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, this.colHeader);
        ctx.lineTo(cx + colWidth, this.colHeader);
        ctx.stroke();
        ctx.restore();

        // Set font and color for text
        ctx.font = "bold 12px Arial";
        ctx.fillStyle = "#333";
      }

      // Highlight only the header of the selected cell (if no multiCol selection)
      if (
        multiCol.length === 0 &&
        this.selection.col === c &&
        this.selection.row !== null
      ) {
        // Header background
        ctx.save();
        ctx.fillStyle = '#CAEAD8';
        ctx.fillRect(cx, 0, colWidth, this.colHeader);
        ctx.restore();

        // Bottom border
        ctx.save();
        ctx.strokeStyle = '#107C41';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, this.colHeader);
        ctx.lineTo(cx + colWidth, this.colHeader);
        ctx.stroke();
        ctx.restore();

        // Set font and color for text
        ctx.font = "bold 12px Arial";
        ctx.fillStyle = "#fff";
      }

      // Top and right borders
      ctx.strokeStyle = "#ccc";
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx + colWidth, 0); // top
      ctx.moveTo(cx + colWidth, 0);
      ctx.lineTo(cx + colWidth, this.colHeader); // right
      ctx.stroke();

      // Center align column header text, white & bold if selected
      ctx.font = "12px Arial";
      ctx.fillStyle = isSelected ? "#fff" : "#333";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.colToName(c), cx + colWidth / 2, this.colHeader / 2);

      cx += colWidth;
    }
  }

  renderRowHeaders(ctx, startRow, accumulatedHeight) {
    let ry = this.colHeader - (this.scrollY - accumulatedHeight);
    // --- Multi-cell selection header highlight ---
    let multiCellRows = [];
    if (
      this.multiCellSelection &&
      this.multiCellSelection.startCell &&
      this.multiCellSelection.endCell &&
      (this.multiCellSelection.isSelectingCells ||
        (this.multiCellSelection.startCell.row !== this.multiCellSelection.endCell.row ||
          this.multiCellSelection.startCell.col !== this.multiCellSelection.endCell.col))
    ) {
      const r1 = Math.min(this.multiCellSelection.startCell.row, this.multiCellSelection.endCell.row);
      const r2 = Math.max(this.multiCellSelection.startCell.row, this.multiCellSelection.endCell.row);
      for (let r = r1; r <= r2; r++) multiCellRows.push(r);
    }
    for (let r = startRow; r < this.rowHeights.length && ry < this.canvas.height; r++) {
      let rowHeight = this.rowHeights[r];
      const multiRow = this.selection.selectedRows || [];
      const multiCol = this.selection.selectedCols || [];
      const isSelected = multiRow.includes(r) || (this.selection.selectedCol !== null && this.selection.selectedRow === null);

      // Header background
      if (isSelected) {
        ctx.save();
        ctx.fillStyle = '#107C41'; // selected header color
        ctx.fillRect(0, ry, this.rowHeader, rowHeight);
        ctx.restore();
      } else {
        ctx.fillStyle = '#E6E6E6';
        ctx.fillRect(0, ry, this.rowHeader, rowHeight);
      }

      // Highlight row header for multi-cell selection
      if (multiCellRows.includes(r)) {
        ctx.save();
        ctx.fillStyle = '#CAEAD8';
        ctx.fillRect(0, ry, this.rowHeader, rowHeight);
        ctx.restore();

        // Border at right side
        ctx.save();
        ctx.strokeStyle = '#107C41';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.rowHeader, ry);
        ctx.lineTo(this.rowHeader, ry + rowHeight);
        ctx.stroke();
        ctx.restore();
      }

      // Border right for selected
      if (isSelected) {
        ctx.save();
        ctx.strokeStyle = '#107C41';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.rowHeader, ry);
        ctx.lineTo(this.rowHeader, ry + rowHeight);
        ctx.stroke();
        ctx.restore();
      }

      // Draw top border for first selected row and bottom border for last selected row (full width)
      if (multiRow.length > 0) {
        const firstRow = Math.min(...multiRow);
        const lastRow = Math.max(...multiRow);
        if (r === firstRow) {
          ctx.save();
          ctx.strokeStyle = '#107C41';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, ry);
          ctx.lineTo(this.canvas.width, ry);
          ctx.stroke();
          ctx.restore();
        }
        if (r === lastRow) {
          ctx.save();
          ctx.strokeStyle = '#107C41';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, ry + rowHeight);
          ctx.lineTo(this.canvas.width, ry + rowHeight);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Highlight row header when a column or multiple columns are selected (but not rows)
      if (
        multiCol.length > 0 &&
        multiRow.length === 0
      ) {
        ctx.save();
        ctx.fillStyle = '#CAEAD8';
        ctx.fillRect(0, ry, this.rowHeader, rowHeight);
        ctx.restore();

        // Left border
        ctx.save();
        ctx.strokeStyle = '#107C41';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, ry);
        ctx.lineTo(0, ry + rowHeight);
        ctx.stroke();
        ctx.restore();

        // Set font and color for text
        ctx.font = "bold 12px Arial";
        ctx.fillStyle = "#333";
      }

      // Highlight only the header of the selected cell (if no multiRow selection)
      if (
        multiRow.length === 0 &&
        this.selection.row === r &&
        this.selection.col !== null
      ) {
        // Header background
        ctx.save();
        ctx.fillStyle = '#CAEAD8';
        ctx.fillRect(0, ry, this.rowHeader, rowHeight);
        ctx.restore();

        // Right border
        ctx.save();
        ctx.strokeStyle = '#107C41';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.rowHeader, ry);
        ctx.lineTo(this.rowHeader, ry + rowHeight);
        ctx.stroke();
        ctx.restore();

        // Set font and color for text
        ctx.font = "bold 12px Arial";
        ctx.fillStyle = "#fff";
      }

      // Top and right borders
      ctx.strokeStyle = "#ccc";
      ctx.beginPath();
      ctx.moveTo(0, ry);
      ctx.lineTo(this.rowHeader, ry); // top
      ctx.moveTo(this.rowHeader, ry);
      ctx.lineTo(this.rowHeader, ry + rowHeight); // right
      ctx.stroke();

      // Right align row header text, white & bold if selected
      ctx.font = isSelected ? "bold 12px Arial" : "12px Arial";
      ctx.fillStyle = isSelected ? "#fff" : "#333";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(r + 1, this.rowHeader - 5, ry + rowHeight / 2);

      ry += rowHeight;
    }
  }

  renderCells(ctx, startCol, startRow, accumulatedWidth, accumulatedHeight) {
    let cx = this.rowHeader - (this.scrollX - accumulatedWidth);
    for (let c = startCol; c < this.colWidths.length && cx < this.canvas.width; c++) {
      let colWidth = this.colWidths[c];
      let ry = this.colHeader - (this.scrollY - accumulatedHeight);
      for (let r = startRow; r < this.rowHeights.length && ry < this.canvas.height; r++) {
        let rowHeight = this.rowHeights[r];
        const multiRow = this.selection.selectedRows || [];
        const multiCol = this.selection.selectedCols || [];

        // Highlight
        if (
          (multiRow.includes(r)) ||
          (multiCol.includes(c)) ||
          (this.selection.selectedRow !== null && r === this.selection.selectedRow) ||
          (this.selection.selectedCol !== null && c === this.selection.selectedCol)
        ) {
          ctx.save();
          ctx.fillStyle = '#D0F0D0'; // light green highlight
          ctx.fillRect(cx, ry, colWidth, rowHeight);
          ctx.restore();
        } else {
          ctx.fillStyle = '#fff';
          ctx.fillRect(cx, ry, colWidth, rowHeight);
        }

        // Left/right border for selected columns
        // if (multiCol.includes(c)) {
        //   ctx.save();
        //   ctx.strokeStyle = '#107C41';
        //   ctx.lineWidth = 2;
        //   ctx.beginPath();
        //   ctx.moveTo(cx, 0);
        //   ctx.lineTo(cx, this.canvas.height);
        //   ctx.moveTo(cx + colWidth, 0);
        //   ctx.lineTo(cx + colWidth, this.canvas.height);
        //   ctx.stroke();
        //   ctx.restore();
        // }

        // Top/bottom border for selected rows
        // if (multiRow.includes(r)) {
        //   ctx.save();
        //   ctx.strokeStyle = '#107C41';
        //   ctx.lineWidth = 2;
        //   ctx.beginPath();
        //   ctx.moveTo(0, ry);
        //   ctx.lineTo(this.canvas.width, ry);
        //   ctx.moveTo(0, ry + rowHeight);
        //   ctx.lineTo(this.canvas.width, ry + rowHeight);
        //   ctx.stroke();
        //   ctx.restore();
        // }

        // Draw value
        ctx.fillStyle = '#222';
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        let value = this.grid.getCell(r, c);
        ctx.fillText(value, cx + 5, ry + rowHeight / 2);

        // Cell Borders
        ctx.strokeStyle = "#ccc";
        ctx.beginPath();
        ctx.lineWidth = 0.0;
        ctx.moveTo(cx, ry);
        ctx.lineTo(cx + colWidth, ry); // top
        ctx.moveTo(cx + colWidth, ry);
        ctx.lineTo(cx + colWidth, ry + rowHeight); // right
        ctx.stroke();

        // Draw selection
        if (r === this.selection.row && c === this.selection.col) {
          ctx.save();
          ctx.strokeStyle = '#227447';
          ctx.lineWidth = 2;
          ctx.strokeRect(cx, ry, colWidth - 1, rowHeight - 1);
          ctx.restore();
        }

        // Only draw left border for first selected column and right border for last selected column
        if (multiCol.length > 0) {
          const firstCol = Math.min(...multiCol);
          const lastCol = Math.max(...multiCol);
          if (c === firstCol) {
            ctx.save();
            ctx.strokeStyle = '#107C41';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, this.canvas.height);
            ctx.stroke();
            ctx.restore();
          }
          if (c === lastCol) {
            ctx.save();
            ctx.strokeStyle = '#107C41';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx + colWidth, 0);
            ctx.lineTo(cx + colWidth, this.canvas.height);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Only draw top border for first selected row and bottom border for last selected row
        if (multiRow.length > 0) {
          const firstRow = Math.min(...multiRow);
          const lastRow = Math.max(...multiRow);
          if (r === firstRow) {
            ctx.save();
            ctx.strokeStyle = '#107C41';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, ry);
            ctx.lineTo(this.canvas.width, ry);
            ctx.stroke();
            ctx.restore();
          }
          if (r === lastRow) {
            ctx.save();
            ctx.strokeStyle = '#107C41';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, ry + rowHeight);
            ctx.lineTo(this.canvas.width, ry + rowHeight);
            ctx.stroke();
            ctx.restore();
          }
        }
        ry += rowHeight;
      }
      cx += colWidth;
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
    let x = this.rowHeader;
    for (let c = 0; c < col; c++) x += this.colWidths[c];
    x -= this.scrollX;
    let y = this.colHeader;
    for (let r = 0; r < row; r++) y += this.rowHeights[r];
    y -= this.scrollY;
    if (
      x + this.colWidths[col] < this.rowHeader ||
      y + this.rowHeights[row] < this.colHeader ||
      x > this.canvas.width ||
      y > this.canvas.height
    ) return null;
    return {
      x: x,
      y: y,
      w: this.colWidths[col],
      h: this.rowHeights[row]
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
    let cx = this.rowHeader, col = 0;
    x += this.scrollX;
    while (col < this.colWidths.length && cx + this.colWidths[col] <= x) {
      cx += this.colWidths[col];
      col++;
    }
    let ry = this.colHeader, row = 0;
    y += this.scrollY;
    while (row < this.rowHeights.length && ry + this.rowHeights[row] <= y) {
      ry += this.rowHeights[row];
      row++;
    }
    if (row >= this.grid.rows || col >= this.grid.cols) return null;
    return { row, col };
  }

  /**
   * Attaches resize events for columns and rows.
   */
  attachResizeEvents() {
    let resizingCol = null, resizingRow = null, startX = 0, startY = 0, startWidth = 0, startHeight = 0;
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let colEdge = this.getColEdgeAt(x, y);
      let rowEdge = this.getRowEdgeAt(x, y);
      if (colEdge !== null) {
        this.canvas.style.cursor = 'col-resize';
      } else if (rowEdge !== null) {
        this.canvas.style.cursor = 'row-resize';
      } else {
        this.canvas.style.cursor = '';
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let colEdge = this.getColEdgeAt(x, y);
      let rowEdge = this.getRowEdgeAt(x, y);
      if (colEdge !== null) {
        resizingCol = colEdge;
        startX = x;
        startWidth = this.colWidths[colEdge];
        // --- ADD THESE LINES ---
        this.isResizingCol = true;
        this.resizingColIndex = colEdge;
        this.startColWidth = startWidth;
        // -----------------------
        document.body.style.userSelect = 'none';
      } else if (rowEdge !== null) {
        resizingRow = rowEdge;
        startY = y;
        startHeight = this.rowHeights[rowEdge];
        // --- ADD THESE LINES ---
        this.isResizingRow = true;
        this.resizingRowIndex = rowEdge;
        this.startRowHeight = startHeight;
        // -----------------------
        document.body.style.userSelect = 'none';
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (resizingCol !== null) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        let newWidth = Math.max(24, startWidth + (x - startX));
        this.colWidths[resizingCol] = newWidth;
        this.render();
        this.updateScrollbar && this.updateScrollbar();
      }
      if (resizingRow !== null) {
        const rect = this.canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        let newHeight = Math.max(12, startHeight + (y - startY));
        this.rowHeights[resizingRow] = newHeight;
        this.render();
        this.updateScrollbar && this.updateScrollbar();
      }

      // --- Auto-scroll logic ---
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Clear previous interval if any
      if (this.autoScrollInterval) clearInterval(this.autoScrollInterval);

      let scrollX = 0, scrollY = 0;
      if (x > this.canvas.width - this.autoScrollEdgeSize) scrollX = this.autoScrollSpeed;
      else if (x < this.autoScrollEdgeSize) scrollX = -this.autoScrollSpeed;
      if (y > this.canvas.height - this.autoScrollEdgeSize) scrollY = this.autoScrollSpeed;
      else if (y < this.autoScrollEdgeSize) scrollY = -this.autoScrollSpeed;

      if (scrollX !== 0 || scrollY !== 0) {
        this.autoScrollInterval = setInterval(() => {
          if (scrollX !== 0) {
            this.scrollX = Math.max(0, Math.min(this.scrollX + scrollX, this.maxScrollX()));
          }
          if (scrollY !== 0) {
            this.scrollY = Math.max(0, Math.min(this.scrollY + scrollY, this.maxScrollY()));
          }
          this.updateScrollbar && this.updateScrollbar();
          this.render();
          // Optionally, update selection here if needed
        }, 50);
      }
    });

    window.addEventListener('mouseup', () => {
      // When resizing a column ends (e.g., on mouseup after drag):
      if (this.isResizingCol) {
        const col = this.resizingColIndex;
        const oldWidth = this.startColWidth;
        const newWidth = this.colWidths[col];
        if (this.onColResizeEnd) {
          this.onColResizeEnd(col, oldWidth, newWidth);
        }
        this.isResizingCol = false;
        this.resizingColIndex = null;
        this.startColWidth = null;
      }

      // When resizing a row ends:
      if (this.isResizingRow) {
        const row = this.resizingRowIndex;
        const oldHeight = this.startRowHeight;
        const newHeight = this.rowHeights[row];
        if (this.onRowResizeEnd) {
          this.onRowResizeEnd(row, oldHeight, newHeight);
        }
        this.isResizingRow = false;
        this.resizingRowIndex = null;
        this.startRowHeight = null;
      }

      if (this.autoScrollInterval) {
        clearInterval(this.autoScrollInterval);
        this.autoScrollInterval = null;
      }

      resizingCol = null;
      resizingRow = null;
      document.body.style.userSelect = '';
    });
  }

  getColEdgeAt(x, y) {
    if (y > 0 && y < this.colHeader && x > this.rowHeader) {
      let cx = this.rowHeader - this.scrollX; // <-- subtract scrollX
      for (let c = 0; c < this.colWidths.length; c++) {
        cx += this.colWidths[c];
        if (Math.abs(x - cx) < 4) return c;
        if (cx > this.canvas.width) break;
      }
    }
    return null;
  }

  getRowEdgeAt(x, y) {
    if (x > 0 && x < this.rowHeader && y > this.colHeader) {
      let ry = this.colHeader - this.scrollY; // <-- subtract scrollY
      for (let r = 0; r < this.rowHeights.length; r++) {
        ry += this.rowHeights[r];
        if (Math.abs(y - ry) < 4) return r;
        if (ry > this.canvas.height) break;
      }
    }
    return null;
  }

}

export default GridRenderer;