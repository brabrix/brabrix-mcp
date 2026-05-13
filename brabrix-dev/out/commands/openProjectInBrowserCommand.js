"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openProjectInBrowserCommand = openProjectInBrowserCommand;
const vscode = require("vscode");
async function openProjectInBrowserCommand(workspaceConfig) {
    const config = await workspaceConfig.readConfig();
    if (!config) {
        vscode.window.showWarningMessage('Nenhum projeto selecionado. Selecione um projeto primeiro.');
        return;
    }
    const webBaseUrl = vscode.workspace.getConfiguration().get('brabrix.webBaseUrl', 'https://app.brabrix.com');
    const url = `${webBaseUrl}/dev/projects/${config.projectId}`;
    vscode.env.openExternal(vscode.Uri.parse(url));
}
//# sourceMappingURL=openProjectInBrowserCommand.js.map