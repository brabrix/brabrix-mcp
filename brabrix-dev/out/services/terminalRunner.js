"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalRunner = void 0;
const vscode = require("vscode");
class TerminalRunner {
    terminalName;
    constructor() {
        const config = vscode.workspace.getConfiguration('brabrix.agent');
        this.terminalName = config.get('terminalName') || 'Brabrix Dev Agent';
    }
    getOrCreateTerminal() {
        const existing = vscode.window.terminals.find(t => t.name === this.terminalName);
        if (existing) {
            return existing;
        }
        return vscode.window.createTerminal(this.terminalName);
    }
    run(command) {
        const terminal = this.getOrCreateTerminal();
        terminal.show(true);
        terminal.sendText(command);
    }
}
exports.TerminalRunner = TerminalRunner;
//# sourceMappingURL=terminalRunner.js.map