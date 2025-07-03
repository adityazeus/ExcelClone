import ExcelGrid from './ExcelGrid.js';

/**
 * Initializes the ExcelGrid when the window loads.
 */
window.onload = function () {

  // Create the toolbar at the top of the page
  const toolbar = document.createElement('div');
  toolbar.id = 'excel-toolbar';
  toolbar.innerHTML = `
    <input type="file" id="json-upload" accept=".json">
    <button id="add-row-btn" disabled>Add Row</button>
    <button id="add-col-btn" disabled>Add Col</button>
    <button id="undo-btn">Undo</button>
    <button id="redo-btn">Redo</button>
    <div id="stats-bar"></div>
  `;
  document.body.appendChild(toolbar);

  // Create the main container for the grid and controls
  const container = document.createElement('div');
  container.id = 'excel-container';

  // Create the canvas for rendering the grid
  const canvas = document.createElement('canvas');
  canvas.id = 'excel-canvas';
  container.appendChild(canvas);

  // Create the hidden input for cell editing
  const input = document.createElement('input');
  input.id = 'cell-editor';
  input.type = 'text';
  input.style.display = 'none';
  container.appendChild(input);

  // Create the horizontal scrollbar and its thumb
  const hScrollbar = document.createElement('div');
  hScrollbar.id = 'h-scrollbar';
  const hThumb = document.createElement('div');
  hThumb.id = 'h-thumb';
  hScrollbar.appendChild(hThumb);
  container.appendChild(hScrollbar);

  // Create the vertical scrollbar and its thumb
  const vScrollbar = document.createElement('div');
  vScrollbar.id = 'v-scrollbar';
  const vThumb = document.createElement('div');
  vThumb.id = 'v-thumb';
  vScrollbar.appendChild(vThumb);
  container.appendChild(vScrollbar);

  // Add the container to the body
  document.body.appendChild(container);

  // Initialize the ExcelGrid instance and expose it globally
  const grid = new ExcelGrid(canvas, input);
  window.excelGridInstance = grid;

  // Keyboard shortcuts for undo/redo actions
  window.addEventListener('keydown', (e) => {
    // Ctrl+Z for Undo
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      grid.commandManager.undo();
      grid.hideEditor();
    }
    // Ctrl+Y for Redo
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      grid.commandManager.redo();
      grid.hideEditor();
    }
  });

  // --- JSON Upload and Load ---
  /**
   * Handles uploading and loading a JSON file into the grid.
   * The JSON should be an array of objects, where each object represents a row,
   * and each key in the object is a column header.
   * Example:
   * [
   *   { "Name": "Alice", "Age": 30 },
   *   { "Name": "Bob", "Age": 25 }
   * ]
   */
  document.getElementById('json-upload').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const json = JSON.parse(evt.target.result);
        // Check if the JSON is an array of objects
        if (Array.isArray(json) && json.length > 0 && typeof json[0] === 'object') {
          const grid = window.excelGridInstance;
          grid.grid.clear();
          const headers = Object.keys(json[0]);
          grid.cols = headers.length;
          grid.rows = json.length;
          grid.colWidths = Array(grid.cols).fill(grid.cellWidth);
          grid.rowHeights = Array(grid.rows).fill(grid.cellHeight);
          // Set headers in the first row
          for (let c = 0; c < headers.length; c++) {
            grid.grid.setCell(0, c, headers[c]);
          }
          // Set cell values for each row
          for (let r = 0; r < json.length; r++) {
            const row = json[r];
            for (let c = 0; c < headers.length; c++) {
              grid.grid.setCell(r, c, row[headers[c]]);
            }
          }
          grid.renderer.render();
        } else {
          alert("Invalid JSON format.");
        }
      } catch (err) {
        alert("Error parsing JSON: " + err.message);
      }
    };
    reader.readAsText(file);
  });
};