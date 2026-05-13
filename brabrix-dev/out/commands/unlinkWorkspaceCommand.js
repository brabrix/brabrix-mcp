"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlinkWorkspaceCommand = unlinkWorkspaceCommand;
const vscode = require("vscode");
async function unlinkWorkspaceCommand(workspaceConfig, syncStateService, refreshAll) {
    const config = await workspaceConfig.readConfig();
    if (!config) {
        vscode.window.showInformationMessage("Este workspace não está vinculado a nenhum projeto.");
        return;
    }
    const action = await vscode.window.showWarningMessage(`Desvincular workspace do projeto "${config.projectName}"?`, "Remover vínculo", "Cancelar");
    if (action === "Remover vínculo") {
        await workspaceConfig.clearConfig();
        syncStateService.clearState();
        // Optional: clear local-db.json if it was a local project? We can keep it to not lose data.
        vscode.window.showInformationMessage("Workspace desvinculado da Brabrix.");
        refreshAll();
    }
}
//# sourceMappingURL=unlinkWorkspaceCommand.js.map