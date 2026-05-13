"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openContextFolderCommand = openContextFolderCommand;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
async function openContextFolderCommand(workspaceConfig) {
    const root = workspaceConfig.getWorkspaceRoot();
    if (!root) {
        vscode.window.showWarningMessage("Abra um workspace primeiro.");
        return;
    }
    const contextFolder = path.join(root.fsPath, '.brabrix', 'context');
    if (!fs.existsSync(contextFolder)) {
        vscode.window.showInformationMessage("A pasta de contexto ainda não foi gerada. Sincronize o projeto primeiro.");
        return;
    }
    // Open file explorer revealing the folder
    vscode.env.openExternal(vscode.Uri.file(contextFolder));
}
//# sourceMappingURL=openContextFolderCommand.js.map