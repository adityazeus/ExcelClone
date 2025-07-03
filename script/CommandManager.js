/**
 * @class CommandManager
 * @classdesc
 * Manages the execution, undo, and redo of command objects.
 * Maintains separate stacks for undo and redo operations.
 */
class CommandManager {
  /**
   * Initializes the CommandManager with empty undo and redo stacks.
   */
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Executes a command, adds it to the undo stack, and clears the redo stack.
   * @param {Object} command - The command object to execute. Must implement execute() and undo().
   */
  execute(command) {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
  }

  /**
   * Undoes the last executed command and moves it to the redo stack.
   */
  undo() {
    if (this.undoStack.length === 0) return;
    const command = this.undoStack.pop();
    command.undo();
    this.redoStack.push(command);
  }

  /**
   * Redoes the last undone command and moves it back to the undo stack.
   */
  redo() {
    if (this.redoStack.length === 0) return;
    const command = this.redoStack.pop();
    command.execute();
    this.undoStack.push(command);
  }
}

export default CommandManager;