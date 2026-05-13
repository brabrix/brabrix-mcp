"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshCommand = refreshCommand;
const vscode = require("vscode");
async function refreshCommand(refreshAll) {
    refreshAll();
    vscode.window.setStatusBarMessage('Brabrix: Atualizado', 3000);
}
//# sourceMappingURL=refreshCommand.js.map