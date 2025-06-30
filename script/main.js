import ExcelGrid from './ExcelGrid.js';

/**
 * Initializes the ExcelGrid when the window loads.
 */
window.onload = function () {
  /** @type {HTMLCanvasElement} The canvas element for the grid. */
  const canvas = document.getElementById('excel-canvas');
  /** @type {HTMLInputElement} The input element for cell editing. */
  const input = document.getElementById('cell-editor');
  const grid = new ExcelGrid(canvas, input);
  window.excelGridInstance = grid;

  // Keyboard shortcuts for undo/redo
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
};
// --- JSON Upload and Load ---
document.getElementById('json-upload').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const json = JSON.parse(evt.target.result);
      // If the JSON is an array of objects, load into grid
      if (Array.isArray(json) && json.length > 0 && typeof json[0] === 'object') {
        // Get reference to your ExcelGrid instance
        // Assuming you have something like: const grid = new ExcelGrid(...);
        // Replace 'grid' with your actual variable name
        const grid = window.excelGridInstance; // or whatever variable you use

        // Clear grid first (optional)
        grid.grid.clear();

        // Set headers
        const headers = Object.keys(json[0]);
        grid.cols = headers.length;
        grid.rows = json.length;
        grid.colWidths = Array(grid.cols).fill(grid.cellWidth);
        grid.rowHeights = Array(grid.rows).fill(grid.cellHeight);

        // Set header row
        for (let c = 0; c < headers.length; c++) {
          grid.grid.setCell(0, c, headers[c]);
        }
        // Fill data
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