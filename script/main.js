import ExcelGrid from './ExcelGrid.js';

/**
 * Initializes the ExcelGrid when the window loads.
 */
window.onload = function () {
  /** @type {HTMLCanvasElement} The canvas element for the grid. */
  const canvas = document.getElementById('excel-canvas');
  /** @type {HTMLInputElement} The input element for cell editing. */
  const input = document.getElementById('cell-editor');
  new ExcelGrid(canvas, input);
};